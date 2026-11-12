import { Inject, Injectable } from '@nestjs/common';
import {
  FEATURE_FLAG_KEYS,
  IMAGE_PURPOSES,
  LegalPageSchema,
  PlatformHealthSchema,
  PublicSettingsSchema,
  SETTING_KEYS,
  type FeatureFlagKey,
  type LegalPage,
  type LegalSlug,
  type PlatformHealth,
  type PublicSettings,
  type SettingKey,
} from '@apnatown/shared/settings';
import type { Locale } from '@apnatown/shared/users';
import {
  RUNTIME_CONFIG,
  type RuntimeConfig,
} from '../../../shared/config/config';
import { DomainError } from '../../../shared/errors/errors';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import {
  SETTINGS_REPOSITORY,
  type SettingsRepository,
} from '../domain/settings';
import { integrationStatus } from './settings-policy';
import { parseStored } from './settings-reader';
import { SETTINGS_READ, type SettingsReadPort } from './settings-ports';

/** Safe public projections: no credentials, evidence or internal tax data. */
@Injectable()
export class PublicSettingsService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(SETTINGS_REPOSITORY) private readonly repository: SettingsRepository,
    @Inject(SETTINGS_READ) private readonly reader: SettingsReadPort,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  publicSettings(): Promise<PublicSettings> {
    // Current (uncached) read so public flags never lag a committed toggle.
    return this.uow.run(async (tx) => {
      const [settings, flags] = await Promise.all([
        this.repository.readSettings(tx),
        this.repository.readFlags(tx),
      ]);
      const byKey = new Map(settings.map((row) => [row.key, row]));
      const value = <K extends SettingKey>(key: K) => {
        const row = byKey.get(key);
        return row ? parseStored(key, row.value) : null;
      };
      const flag = (key: FeatureFlagKey) =>
        flags.find((item) => item.key === key);
      const enabled = (key: FeatureFlagKey) => flag(key)?.enabled ?? false;
      const integrations = value('integrations');
      const uploads = value('uploads');
      return PublicSettingsSchema.parse({
        branding: value('branding'),
        flags: Object.fromEntries(
          FEATURE_FLAG_KEYS.map((key) => [key, enabled(key)]),
        ),
        paymentMethods: {
          online:
            enabled('payments_online') &&
            integrationStatus(this.config).gateway.configured,
          cod: enabled('payments_cod'),
        },
        refundPolicy: value('policies'),
        uploads: uploads
          ? {
              purposes: Object.fromEntries(
                IMAGE_PURPOSES.map((purpose) => {
                  const policy = uploads.purposes[purpose];
                  return [
                    purpose,
                    {
                      enabled: policy.enabled,
                      allowedMimeTypes: policy.allowedMimeTypes,
                      maxBytes: policy.maxBytes,
                      minWidth: policy.minWidth,
                      minHeight: policy.minHeight,
                      maxWidth: policy.maxWidth,
                      maxHeight: policy.maxHeight,
                      maxPixels: policy.maxPixels,
                    },
                  ];
                }),
              ),
            }
          : null,
        seo: value('seo'),
        plans: (value('plans') ?? [])
          .filter((plan) => plan.enabled)
          .map((plan) => ({
            code: plan.code,
            nameEn: plan.nameEn,
            nameHi: plan.nameHi,
            pricePaise: plan.pricePaise,
            premium: plan.premium,
            billingPeriodMonths: plan.billingPeriodMonths,
          })),
        promotions: (value('promotion_fees') ?? [])
          .filter((fee) => fee.enabled)
          .map((fee) => ({
            code: fee.code,
            nameEn: fee.nameEn,
            nameHi: fee.nameHi,
            pricePaise: fee.pricePaise,
            kind: fee.kind,
            durationDays: fee.durationDays,
          })),
        // Configured contacts only; never a fabricated prototype number.
        support: {
          callPhoneE164: integrations?.supportCallE164 ?? null,
          whatsappPhoneE164: integrations?.supportWhatsappE164 ?? null,
        },
        versions: {
          settings: Object.fromEntries(
            SETTING_KEYS.map((key) => [key, byKey.get(key)?.version ?? 0]),
          ),
          flags: Object.fromEntries(
            flags.map((item) => [item.key, item.version]),
          ),
        },
        generatedAt: this.clock.now().toISOString(),
      });
    });
  }

  legal(slug: LegalSlug, locale: Locale): Promise<LegalPage> {
    return this.uow.run(async (tx) => {
      const [page] = await this.repository.readLegal(tx, [slug]);
      // Unpublished pages (Q-12 copy pending) are an explicit not-found.
      if (!page) throw new DomainError('LEGAL_PAGE_NOT_FOUND');
      return LegalPageSchema.parse({
        slug,
        locale,
        title: locale === 'hi' ? page.titleHi : page.titleEn,
        body: locale === 'hi' ? page.bodyHi : page.bodyEn,
        version: page.version,
        updatedAt: page.publishedAt,
      });
    });
  }

  async health(): Promise<PlatformHealth> {
    let maintenance: boolean;
    try {
      maintenance = (await this.reader.getCurrentFlag('maintenance')).enabled;
    } catch {
      // No dependency detail is exposed; readiness probes report internals.
      throw new DomainError('COMMON_UNAVAILABLE');
    }
    return PlatformHealthSchema.parse({
      status: maintenance ? 'maintenance' : 'ok',
      checkedAt: this.clock.now().toISOString(),
    });
  }
}
