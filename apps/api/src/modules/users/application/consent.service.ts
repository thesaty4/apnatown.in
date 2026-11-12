import { Inject, Injectable } from '@nestjs/common';
import {
  CONSENT_EVENT_TYPES,
  ConsentEventPayloadSchema,
} from '@apnatown/shared';
import {
  CONSENT_PAIRS,
  ConsentSourceSchema,
  registeredConsentPair,
  type ConsentChoice,
  type ConsentList,
  type ConsentPair,
  type ConsentPurpose,
  type ConsentRecord,
  type UpdateConsent,
} from '@apnatown/shared/users';
import {
  SESSION_ACCESS,
  type SessionAccess,
  type SessionBinding,
} from '../../../shared/auth';
import {
  RUNTIME_CONFIG,
  type RuntimeConfig,
} from '../../../shared/config/config';
import { DomainError } from '../../../shared/errors/errors';
import {
  EVENT_FACTORY,
  OUTBOX_WRITER,
  type EventFactory,
  type OutboxWriter,
} from '../../../shared/events';
import { currentCorrelationId } from '../../../shared/logger/context';
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
  CONSENT_REPOSITORY,
  type ConsentRepository,
  type StoredConsent,
} from '../domain/consent';
import { USERS_REPOSITORY, type UsersRepository } from '../domain/identity';
import type {
  ConsentChoiceKey,
  ConsentReadPort,
  ConsentWriteInput,
  ConsentWritePort,
} from './consent-port';

@Injectable()
export class ConsentService implements ConsentReadPort, ConsentWritePort {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(USERS_REPOSITORY) private readonly users: UsersRepository,
    @Inject(CONSENT_REPOSITORY) private readonly consents: ConsentRepository,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(EVENT_FACTORY) private readonly events: EventFactory,
    @Inject(OUTBOX_WRITER) private readonly outbox: OutboxWriter,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
  ) {}
  list(binding: SessionBinding): Promise<ConsentList> {
    return this.uow.run(async (tx) => {
      const userId = await this.own(tx, binding);
      const latest = await this.consents.latestForUser(tx, userId);
      return {
        currentNoticeVersion: this.config.CONSENT_NOTICE_VERSION ?? null,
        items: CONSENT_PAIRS.map((pair) => this.choice(pair, latest)),
      };
    });
  }
  async update(
    binding: SessionBinding,
    purpose: ConsentPurpose,
    input: UpdateConsent,
  ): Promise<ConsentRecord> {
    // Fail fast before any database work; write() re-validates for port callers.
    const pair = this.pair(purpose, input.channel);
    this.notice(input.granted, input.noticeVersion);
    return this.uow.run(async (tx) => {
      const userId = await this.own(tx, binding);
      const row = await this.write(tx, {
        userId,
        ...pair,
        granted: input.granted,
        source: 'account',
        ...(input.noticeVersion !== undefined
          ? { noticeVersion: input.noticeVersion }
          : {}),
      });
      return this.present(row);
    });
  }
  /** Q-31: anonymous cookie identity and categories are not approved. */
  anonymousUnavailable(): never {
    throw new DomainError('COMMON_UNAVAILABLE');
  }
  async current(input: ConsentChoiceKey, tx?: TxContext) {
    const pair = this.pair(input.purpose, input.channel);
    const read = (t: TxContext) =>
      this.consents.latest(t, input.userId, pair.purpose, pair.channel);
    const row = tx ? await read(tx) : await this.uow.run(read);
    return row
      ? { granted: row.granted, consentId: row.id, recordedAt: row.recordedAt }
      : { granted: false };
  }
  async record(tx: TxContext, input: ConsentWriteInput) {
    const row = await this.write(tx, input);
    return { consentId: row.id, recordedAt: row.recordedAt };
  }
  private async write(
    tx: TxContext,
    input: ConsentWriteInput,
  ): Promise<StoredConsent> {
    const pair = this.pair(input.purpose, input.channel);
    const noticeVersion = this.notice(input.granted, input.noticeVersion);
    const source = ConsentSourceSchema.safeParse(input.source);
    if (!source.success) throw new Error('INVALID_CONSENT_SOURCE');
    // The user row lock serializes every consent change for this subject.
    const user = await this.users.lock(tx, input.userId);
    if (!user) throw new DomainError('USER_NOT_FOUND');
    // Withdrawals (including verified STOP) are never blocked by account state.
    if (input.granted && (user.accountStatus !== 'active' || user.deletedAt))
      throw new DomainError('ACCOUNT_UNAVAILABLE');
    const latest = await this.consents.latest(
      tx,
      user.id,
      pair.purpose,
      pair.channel,
    );
    if (
      latest &&
      latest.granted === input.granted &&
      latest.noticeVersion === noticeVersion
    )
      return latest;
    const row = await this.consents.insert(tx, {
      id: this.ids.uuidv7(),
      userId: user.id,
      ...pair,
      granted: input.granted,
      noticeVersion,
      recordedAt: this.recordedAt(latest),
      source: source.data,
    });
    await this.publish(tx, row);
    return row;
  }
  private async publish(tx: TxContext, row: StoredConsent): Promise<void> {
    const correlationId = currentCorrelationId();
    if (!correlationId) throw new Error('MISSING_CORRELATION_CONTEXT');
    const payload = {
      userId: row.userId,
      purpose: row.purpose,
      channel: row.channel,
      consentId: row.id,
      recordedAt: row.recordedAt,
    };
    if (!ConsentEventPayloadSchema.safeParse(payload).success)
      throw new Error('INVALID_CONSENT_EVENT');
    await this.outbox.append(
      tx,
      this.events.create(
        row.granted
          ? CONSENT_EVENT_TYPES.granted
          : CONSENT_EVENT_TYPES.withdrawn,
        { type: 'consent', id: row.id, version: 1 },
        payload,
        correlationId,
      ),
    );
  }
  /** Strictly after the previous evidence so the latest choice never reorders. */
  private recordedAt(latest: StoredConsent | null): string {
    const now = this.clock.now().getTime();
    const floor = latest ? Date.parse(latest.recordedAt) + 1 : now;
    return new Date(Math.max(now, floor)).toISOString();
  }
  private pair(purpose: unknown, channel: unknown): ConsentPair {
    const pair = registeredConsentPair(purpose, channel);
    if (!pair)
      throw new DomainError('CONSENT_PURPOSE_INVALID', {
        fields: ['purpose', 'channel'],
      });
    return pair;
  }
  /** Grants must acknowledge the configured notice; withdrawals never need one. */
  private notice(granted: boolean, submitted?: string): string | null {
    if (!granted) return null;
    const current = this.config.CONSENT_NOTICE_VERSION;
    if (current === undefined || submitted !== current)
      throw new DomainError('CONSENT_NOTICE_INVALID', {
        field: 'noticeVersion',
      });
    return current;
  }
  private async own(tx: TxContext, binding: SessionBinding): Promise<string> {
    const principal = await this.sessions.requirePrincipal(tx, binding);
    const user = await this.users.lock(tx, principal.userId);
    if (!user) throw new DomainError('USER_NOT_FOUND');
    if (user.accountStatus !== 'active' || user.deletedAt)
      throw new DomainError('ACCOUNT_UNAVAILABLE');
    return user.id;
  }
  private choice(pair: ConsentPair, latest: StoredConsent[]): ConsentChoice {
    const row = latest.find(
      (item) => item.purpose === pair.purpose && item.channel === pair.channel,
    );
    return row
      ? this.present(row)
      : {
          ...pair,
          granted: false,
          consentId: null,
          noticeVersion: null,
          recordedAt: null,
        };
  }
  private present(row: StoredConsent): ConsentRecord {
    return {
      consentId: row.id,
      purpose: row.purpose,
      channel: row.channel,
      granted: row.granted,
      noticeVersion: row.noticeVersion,
      recordedAt: row.recordedAt,
    };
  }
}
