import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  FEATURE_FLAG_KEYS,
  LEGAL_SLUGS,
  SETTING_KEYS,
  SETTINGS_GROUPS,
  FeatureFlagSchema,
  LegalPageAdminSchema,
  SavedSettingSchema,
  SavedSettingsGroupSchema,
  SettingEntrySchema,
  SuperAdminSettingsSchema,
  settingsGroupOf,
  type FeatureFlag,
  type FeatureFlagKey,
  type LegalPageAdmin,
  type LegalSlug,
  type SavedSetting,
  type SavedSettingsGroup,
  type SettingEntry,
  type SettingKey,
  type SettingsGroup,
  type SuperAdminSettings,
  type UpdateFeatureFlag,
  type UpdateLegalPage,
  type UpdateSetting,
  type UpdateSettingsGroup,
} from '@apnatown/shared/settings';
import type { AdminReadContext } from '../../../shared/auth/ports';
import {
  RUNTIME_CONFIG,
  type RuntimeConfig,
} from '../../../shared/config/config';
import { DomainError } from '../../../shared/errors/errors';
import {
  UNIT_OF_WORK,
  type TxContext,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import {
  CLOCK,
  ID_PROVIDER,
  type Clock,
  type IdProvider,
} from '../../../shared/runtime/providers';
import {
  AdminCommands,
  type AdminCommand,
  type SuperActor,
} from '../../admin/application/admin-command';
import {
  AUDIT_WRITER,
  type AuditWriter,
} from '../../audit/application/audit-writer.port';
import {
  SETTINGS_REPOSITORY,
  type SettingsRepository,
  type StoredFlag,
  type StoredLegalPage,
  type StoredSetting,
} from '../domain/settings';
import { sanitizeLegalMarkdown } from './legal-sanitizer';
import { SettingsEvents } from './settings-events';
import {
  flagEnablable,
  integrationStatus,
  readiness,
  validateSetting,
} from './settings-policy';
import { SettingsReader, parseStored } from './settings-reader';

const LEGAL_AUDIT_FIELDS = ['titleEn', 'titleHi', 'bodyEn', 'bodyHi'] as const;

function entry(key: SettingKey, row: StoredSetting | undefined): SettingEntry {
  return SettingEntrySchema.parse({
    key,
    value: row ? parseStored(key, row.value) : null,
    version: row?.version ?? 0,
    group: settingsGroupOf(key),
    updatedAt: row?.updatedAt ?? null,
  });
}

/** Super Admin settings, flags and legal pages (one audited command each). */
@Injectable()
export class SettingsService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(SETTINGS_REPOSITORY)
    private readonly repository: SettingsRepository,
    @Inject(AUDIT_WRITER) private readonly audit: AuditWriter,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    private readonly commands: AdminCommands,
    private readonly events: SettingsEvents,
    private readonly reader: SettingsReader,
  ) {}

  read(ctx: AdminReadContext): Promise<SuperAdminSettings> {
    if (!ctx.isSuper) throw new DomainError('COMMON_FORBIDDEN');
    return this.uow.run(async (tx) => {
      const [settings, flags, legal] = await Promise.all([
        this.repository.readSettings(tx),
        this.repository.readFlags(tx),
        this.repository.readLegal(tx),
      ]);
      const status = integrationStatus(this.config);
      const byKey = new Map(settings.map((row) => [row.key, row]));
      const value = <K extends SettingKey>(key: K) => {
        const row = byKey.get(key);
        return row ? parseStored(key, row.value) : null;
      };
      return SuperAdminSettingsSchema.parse({
        settings: SETTING_KEYS.map((key) => entry(key, byKey.get(key))),
        flags: FEATURE_FLAG_KEYS.flatMap((key) => {
          const flag = flags.find((item) => item.key === key);
          return flag ? [this.flag(flag)] : [];
        }),
        legal: LEGAL_SLUGS.map((slug) => {
          const page = legal.find((item) => item.slug === slug);
          return {
            slug,
            version: page?.version ?? 0,
            page: page ? this.legalPage(page) : null,
          };
        }),
        integrationStatus: status,
        readiness: readiness({
          plans: value('plans'),
          promotion_fees: value('promotion_fees'),
          tax: value('tax'),
          uploads: value('uploads'),
        }),
      });
    });
  }

  async updateSetting(
    command: AdminCommand,
    key: SettingKey,
    input: UpdateSetting,
  ): Promise<SavedSetting> {
    // Grouped members must be saved through their transactional group.
    if (settingsGroupOf(key)) throw new DomainError('SETTINGS_GROUP_REQUIRED');
    const saved = await this.commands.run(
      command,
      {
        name: 'super-admin.settings.update',
        method: 'PUT',
        resource: `/super-admin/settings/${key}`,
        successStatus: 200,
      },
      input,
      async (tx, actor) => {
        const changeSetId = this.ids.uuidv7();
        const [row] = await this.save(
          tx,
          actor,
          changeSetId,
          command.correlationId,
          [{ key, ...input }],
        );
        await this.events.settingUpdated(
          tx,
          { key, version: row!.version, changeSetId },
          command.correlationId,
        );
        return SavedSettingSchema.parse({
          entry: entry(key, row),
          changeSetId,
        }) as SavedSetting & JsonValue;
      },
      {
        store: (result) => result,
        replay: (_tx, stored) =>
          Promise.resolve(
            SavedSettingSchema.parse(stored) as SavedSetting & JsonValue,
          ),
      },
    );
    this.reader.invalidate([key]);
    return saved;
  }

  async updateGroup(
    command: AdminCommand,
    group: SettingsGroup,
    input: UpdateSettingsGroup,
  ): Promise<SavedSettingsGroup> {
    const members = SETTINGS_GROUPS[group] as readonly SettingKey[];
    const keys = input.updates.map((update) => update.key);
    // Exact membership: every allowed key once, no extras or duplicates.
    if (
      new Set(keys).size !== keys.length ||
      keys.length !== members.length ||
      !members.every((key) => keys.includes(key))
    )
      throw new DomainError('SETTINGS_INVALID', { fields: ['updates'] });
    const saved = await this.commands.run(
      command,
      {
        name: 'super-admin.settings.group.update',
        method: 'PUT',
        resource: `/super-admin/settings/groups/${group}`,
        successStatus: 200,
      },
      input,
      async (tx, actor) => {
        const changeSetId = this.ids.uuidv7();
        const rows = await this.save(
          tx,
          actor,
          changeSetId,
          command.correlationId,
          input.updates,
          group,
        );
        const versions = members.map((key) => ({
          key,
          version: rows.find((row) => row.key === key)!.version,
        }));
        for (const item of versions)
          await this.events.settingUpdated(
            tx,
            { ...item, changeSetId },
            command.correlationId,
          );
        await this.events.groupUpdated(
          tx,
          { group, keys: versions, changeSetId },
          command.correlationId,
        );
        return SavedSettingsGroupSchema.parse({
          group,
          values: members.map((key) =>
            entry(
              key,
              rows.find((row) => row.key === key),
            ),
          ),
          changeSetId,
        }) as SavedSettingsGroup & JsonValue;
      },
      {
        store: (result) => result,
        replay: (_tx, stored) =>
          Promise.resolve(
            SavedSettingsGroupSchema.parse(stored) as SavedSettingsGroup &
              JsonValue,
          ),
      },
    );
    this.reader.invalidate(members);
    return saved;
  }

  updateFlag(
    command: AdminCommand,
    key: FeatureFlagKey,
    input: UpdateFeatureFlag,
  ): Promise<FeatureFlag> {
    // Future products (booking/donations) and unconfigured channels stay off.
    if (input.enabled && !flagEnablable(key, integrationStatus(this.config)))
      throw new DomainError('FEATURE_NOT_AVAILABLE');
    return this.commands.run(
      command,
      {
        name: 'super-admin.feature-flags.update',
        method: 'PUT',
        resource: `/super-admin/feature-flags/${key}`,
        successStatus: 200,
      },
      input,
      async (tx, actor) => {
        const current = await this.repository.lockFlag(tx, key);
        if (!current)
          throw new DomainError('SETTINGS_INVALID', { field: 'key' });
        const now = this.clock.now();
        if (
          current.version !== input.expectedVersion ||
          !(await this.repository.writeFlag(tx, {
            key,
            enabled: input.enabled,
            expectedVersion: input.expectedVersion,
            updatedBy: actor.userId,
            at: now,
          }))
        )
          throw new DomainError('SETTINGS_VERSION_CONFLICT');
        const [updated] = await this.repository.readFlags(tx, [key]);
        const changeSetId = this.ids.uuidv7();
        await this.audit.record(tx, {
          actor,
          action: 'feature_flag.updated',
          entityType: 'feature_flag',
          entityId: changeSetId,
          summary: `${input.enabled ? 'Enabled' : 'Disabled'} feature flag "${key}"`,
          before: { [key]: current.enabled },
          after: { [key]: input.enabled },
          fields: [key],
          correlationId: command.correlationId,
        });
        await this.events.flagUpdated(
          tx,
          changeSetId,
          { key, enabled: input.enabled, version: updated!.version },
          command.correlationId,
        );
        return this.flag(updated!) as FeatureFlag & JsonValue;
      },
      {
        store: (result) => result,
        // Replay returns the current flag state (re-read after the recheck).
        replay: async (tx) => {
          const [flag] = await this.repository.readFlags(tx, [key]);
          if (!flag)
            throw new DomainError('SETTINGS_INVALID', { field: 'key' });
          return this.flag(flag) as FeatureFlag & JsonValue;
        },
      },
    );
  }

  updateLegal(
    command: AdminCommand,
    slug: LegalSlug,
    input: UpdateLegalPage,
  ): Promise<LegalPageAdmin> {
    const clean = {
      titleEn: sanitizeLegalMarkdown(input.titleEn),
      titleHi: sanitizeLegalMarkdown(input.titleHi),
      bodyEn: sanitizeLegalMarkdown(input.bodyEn),
      bodyHi: sanitizeLegalMarkdown(input.bodyHi),
    };
    const empty = LEGAL_AUDIT_FIELDS.filter((field) => !clean[field]);
    if (empty.length)
      throw new DomainError('SETTINGS_INVALID', { fields: empty });
    return this.commands.run(
      command,
      {
        name: 'super-admin.legal.update',
        method: 'PUT',
        resource: `/super-admin/legal/${slug}`,
        successStatus: 200,
      },
      input,
      async (tx, actor) => {
        const current = await this.repository.lockLegal(tx, slug);
        const now = this.clock.now();
        if (
          (current?.version ?? 0) !== input.expectedVersion ||
          !(await this.repository.writeLegal(tx, {
            slug,
            ...clean,
            publishedAt: now,
            expectedVersion: input.expectedVersion,
            updatedBy: actor.userId,
            at: now,
          }))
        )
          throw new DomainError('SETTINGS_VERSION_CONFLICT');
        const [page] = await this.repository.readLegal(tx, [slug]);
        const changeSetId = this.ids.uuidv7();
        const snapshot = (value: typeof clean | StoredLegalPage | null) =>
          value
            ? Object.fromEntries(
                LEGAL_AUDIT_FIELDS.map((field) => [field, value[field]]),
              )
            : null;
        await this.audit.record(tx, {
          actor,
          action: 'legal.updated',
          entityType: 'legal_page',
          entityId: changeSetId,
          summary: `Published legal page "${slug}"`,
          before: snapshot(current),
          after: snapshot(clean),
          fields: LEGAL_AUDIT_FIELDS,
          correlationId: command.correlationId,
        });
        await this.events.legalUpdated(
          tx,
          changeSetId,
          { slug, version: page!.version, publishedAt: page!.publishedAt },
          command.correlationId,
        );
        return this.legalPage(page!) as LegalPageAdmin & JsonValue;
      },
      {
        store: (result) => result,
        replay: (_tx, stored) =>
          Promise.resolve(
            LegalPageAdminSchema.parse(stored) as LegalPageAdmin & JsonValue,
          ),
      },
    );
  }

  /**
   * Validates every key, locks rows in stable key order, compares all
   * versions, then writes and records one audit entry. Any stale/invalid key
   * throws, rolling the whole transaction back.
   */
  private async save(
    tx: TxContext,
    actor: SuperActor,
    changeSetId: string,
    correlationId: string,
    updates: readonly {
      key: SettingKey;
      value: unknown;
      expectedVersion: number;
    }[],
    group?: SettingsGroup,
  ): Promise<StoredSetting[]> {
    const values = updates.map((update) => ({
      ...update,
      value: validateSetting(update.key, update.value, this.config),
    }));
    const keys = values.map((item) => item.key).sort();
    const locked = await this.repository.lockSettings(tx, keys);
    const now = this.clock.now();
    for (const item of [...values].sort((a, b) => a.key.localeCompare(b.key))) {
      const current = locked.find((row) => row.key === item.key);
      if (
        (current?.version ?? 0) !== item.expectedVersion ||
        !(await this.repository.writeSetting(tx, {
          key: item.key,
          value: item.value,
          expectedVersion: item.expectedVersion,
          updatedBy: actor.userId,
          at: now,
        }))
      )
        throw new DomainError('SETTINGS_VERSION_CONFLICT', {
          field: item.key,
        });
    }
    await this.audit.record(tx, {
      actor,
      action: group ? 'settings.group_updated' : 'settings.updated',
      entityType: 'settings',
      entityId: changeSetId,
      summary: group
        ? `Saved settings group "${group}"`
        : `Saved setting "${keys[0]}"`,
      before: Object.fromEntries(
        keys.map((key) => [
          key,
          (locked.find((row) => row.key === key)?.value ?? null) as JsonValue,
        ]),
      ),
      after: Object.fromEntries(
        values.map((item) => [item.key, item.value as JsonValue]),
      ),
      fields: keys,
      correlationId,
    });
    return this.repository.readSettings(tx, keys);
  }

  private flag(row: StoredFlag): FeatureFlag {
    return FeatureFlagSchema.parse({
      ...row,
      enablable: flagEnablable(row.key, integrationStatus(this.config)),
    });
  }

  private legalPage(row: StoredLegalPage): LegalPageAdmin {
    return LegalPageAdminSchema.parse(row);
  }
}
