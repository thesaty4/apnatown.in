import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  NOTIFICATION_PREFERENCE_DEFAULTS,
  NOTIFICATION_PREFERENCE_KEYS,
  NotificationPreferencesSchema,
  NotificationUnsubscribeMarketingResultSchema,
  type NotificationPreferences,
  type NotificationPreferencesUpdate,
  type NotificationUnsubscribeMarketingResult,
} from '@apnatown/shared/notifications';
import type { ConsentChannel } from '@apnatown/shared/users';
import {
  SESSION_ACCESS,
  type SessionAccess,
  type SessionBinding,
} from '../../../shared/auth/ports';
import {
  RUNTIME_CONFIG,
  type RuntimeConfig,
} from '../../../shared/config/config';
import { DomainError } from '../../../shared/errors/errors';
import {
  COMMAND_CONTEXT_FACTORY,
  HttpCommandContextFactory,
} from '../../../shared/idempotency/context';
import {
  COMMAND_UNIT_OF_WORK,
  UNIT_OF_WORK,
  type CommandUnitOfWork,
  type TxContext,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import { RECEIPT_TTL_MS } from '../../../shared/idempotency/receipt-ttl';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import {
  PREFERENCE_REPOSITORY,
  type PreferenceRepository,
  type PreferenceValues,
  type StoredPreferences,
} from '../domain/notification';
import { PREFERENCE_PAIRS, PreferenceConsents } from './preference-consents';

export interface PreferenceRequest {
  session: SessionBinding;
  actorId: string;
}
export interface UnsubscribeRequest extends PreferenceRequest {
  correlationId: string;
  key: unknown;
}

const MARKETING_CHANNELS: readonly ConsentChannel[] = [
  'in_app',
  'email',
  'whatsapp',
];
const DEFAULTS: PreferenceValues = { ...NOTIFICATION_PREFERENCE_DEFAULTS };

/**
 * Own notification preferences (F-NT-002, ST-pref). Preferences are
 * versioned display choices; consent evidence lives in Users and is changed
 * only through CONSENT_WRITE. Enabling a WhatsApp key needs a current grant
 * or an explicit acknowledgement of the configured notice.
 */
@Injectable()
export class NotificationPreferencesService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY)
    private readonly contexts: HttpCommandContextFactory,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(PREFERENCE_REPOSITORY)
    private readonly preferences: PreferenceRepository,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly consents: PreferenceConsents,
  ) {}

  get(request: PreferenceRequest): Promise<NotificationPreferences> {
    return this.uow.run(async (tx) => {
      const userId = await this.principal(tx, request);
      const stored = (await this.preferences.find(tx, userId)) ?? {
        ...DEFAULTS,
        version: 1,
      };
      return this.view(tx, userId, stored);
    });
  }

  update(
    request: PreferenceRequest,
    input: NotificationPreferencesUpdate,
  ): Promise<NotificationPreferences> {
    return this.uow.run(async (tx) => {
      const userId = await this.principal(tx, request);
      const now = this.clock.now();
      const stored = await this.preferences.lockOrCreate(tx, userId, DEFAULTS, now);
      if (stored.version !== input.expectedVersion)
        throw new DomainError('NOTIFICATION_VERSION_CONFLICT');
      const next: PreferenceValues = { ...pick(stored) };
      for (const key of NOTIFICATION_PREFERENCE_KEYS)
        if (input[key] !== undefined) next[key] = input[key];
      const acks = input.consentAcknowledgements ?? [];
      const ackKeys = acks.map((ack) => {
        const key = NOTIFICATION_PREFERENCE_KEYS.find(
          (k) =>
            PREFERENCE_PAIRS[k].purpose === ack.purpose &&
            PREFERENCE_PAIRS[k].channel === ack.channel &&
            input[k] === true,
        );
        if (!key) throw new DomainError('VALIDATION_ERROR');
        return key;
      });
      if (new Set(ackKeys).size !== ackKeys.length)
        throw new DomainError('VALIDATION_ERROR');
      const views = await this.consents.view(tx, userId);
      for (const key of NOTIFICATION_PREFERENCE_KEYS) {
        const pair = PREFERENCE_PAIRS[key];
        const ack = acks[ackKeys.indexOf(key)];
        const granted = views.find((v) => v.key === key)?.granted ?? false;
        if (ack) {
          await this.consents.grant(tx, userId, pair, ack.noticeVersion);
        } else if (pair.required && next[key] && !granted) {
          // Explicit enable needs a live grant; an ungranted stored value is
          // never carried forward as on (DPDP: no consent, no WhatsApp).
          if (input[key] === true) throw new DomainError('CONSENT_REQUIRED');
          next[key] = false;
        }
        // Turning a WhatsApp key off withdraws its pair (marketing for offers).
        if (pair.required && input[key] === false && granted)
          await this.consents.withdraw(tx, userId, pair, 'notification_preferences');
      }
      const version = stored.version + 1;
      await this.preferences.update(tx, userId, next, version, now);
      return this.view(tx, userId, { ...next, version });
    });
  }

  /**
   * Signed-in one-click marketing opt-out: wa_offers (the marketing WhatsApp
   * key) off and marketing withdrawn on every channel. `email`/`inapp` gate
   * transactional updates (spec rule 2) and are left unchanged. Idempotent;
   * withdrawal needs no notice.
   */
  unsubscribeMarketing(
    request: UnsubscribeRequest,
    expectedVersion: number,
  ): Promise<NotificationUnsubscribeMarketingResult> {
    const now = this.clock.now();
    const command = this.contexts.create(
      {
        name: 'notifications.preferences.unsubscribe-marketing',
        method: 'POST',
        scope: 'principal',
        successStatus: 200,
      },
      {
        actorId: request.actorId,
        correlationId: request.correlationId,
        resource: '/notifications/preferences/unsubscribe-marketing',
        business: null,
        expiresAt: new Date(now.getTime() + RECEIPT_TTL_MS),
      },
      { key: request.key, payload: { expectedVersion } },
    );
    return this.commands.run(
      command,
      async (tx) => {
        const userId = await this.principal(tx, request);
        const stored = await this.preferences.lockOrCreate(tx, userId, DEFAULTS, now);
        if (stored.version !== expectedVersion)
          throw new DomainError('NOTIFICATION_VERSION_CONFLICT');
        const withdrawn = [];
        for (const channel of MARKETING_CHANNELS) {
          const pair = { purpose: 'marketing' as const, channel };
          const result = await this.consents.withdraw(
            tx,
            userId,
            pair,
            'marketing_unsubscribe',
          );
          withdrawn.push({ ...pair, ...result });
        }
        const next = { ...pick(stored), wa_offers: false };
        const version = stored.version + 1;
        await this.preferences.update(tx, userId, next, version, now);
        return NotificationUnsubscribeMarketingResultSchema.parse({
          preferences: await this.view(tx, userId, { ...next, version }),
          withdrawn,
        }) as NotificationUnsubscribeMarketingResult & JsonValue;
      },
      {
        store: (result) => result,
        // A replay re-proves the live session/principal before returning.
        replay: async (tx, stored) => {
          await this.principal(tx, request);
          return NotificationUnsubscribeMarketingResultSchema.parse(
            stored,
          ) as NotificationUnsubscribeMarketingResult & JsonValue;
        },
      },
    );
  }

  private async principal(
    tx: TxContext,
    request: PreferenceRequest,
  ): Promise<string> {
    const principal = await this.sessions.requirePrincipal(tx, request.session);
    if (principal.userId !== request.actorId)
      throw new DomainError('SESSION_EXPIRED');
    return principal.userId;
  }

  private async view(
    tx: TxContext,
    userId: string,
    stored: StoredPreferences,
  ): Promise<NotificationPreferences> {
    const consents = await this.consents.view(tx, userId);
    const values = pick(stored);
    // WhatsApp keys report the effective value: preference AND live grant.
    for (const view of consents)
      if (view.required) values[view.key] &&= view.granted;
    return NotificationPreferencesSchema.parse({
      ...values,
      version: stored.version,
      currentNoticeVersion: this.config.CONSENT_NOTICE_VERSION ?? null,
      consents,
    });
  }
}

function pick(values: PreferenceValues): PreferenceValues {
  return {
    inapp: values.inapp,
    email: values.email,
    wa_orders: values.wa_orders,
    wa_offers: values.wa_offers,
    wa_enq: values.wa_enq,
  };
}
