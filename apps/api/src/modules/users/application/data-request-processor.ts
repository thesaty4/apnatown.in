import { Inject, Injectable } from '@nestjs/common';
import {
  DATA_REQUEST_EVENT_TYPES,
  DataRequestEventPayloadSchema,
  type EventEnvelope,
  type JsonValue,
} from '@apnatown/shared';
import {
  DATA_EXPORT_SECTIONS,
  DataExportSchema,
  type DataExport,
  type DataRequestFailureCode,
} from '@apnatown/shared/users';
import type { Logger } from 'pino';
import {
  AUTH_SESSION_PORT,
  type AuthSessionPort,
} from '../../../shared/auth/ports';
import {
  IDENTITY_CRYPTO,
  type IdentityCrypto,
} from '../../../shared/auth/crypto';
import {
  RUNTIME_CONFIG,
  type RuntimeConfig,
} from '../../../shared/config/config';
import type { OutboxHandler } from '../../../shared/jobs/outbox-dispatcher';
import { RUNTIME_LOGGER } from '../../../shared/logger/logger';
import {
  UNIT_OF_WORK,
  type TxContext,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import {
  PRIVATE_STORAGE,
  type StoragePort,
} from '../../../integrations/storage/port';
import {
  DATA_REQUEST_REPOSITORY,
  exportArtifactContext,
  type DataRequestRepository,
  type StoredDataRequest,
} from '../domain/data-request';
import { USERS_REPOSITORY, type UsersRepository } from '../domain/identity';
import { DataRequestEvents } from './data-request-events';
import { USER_DATA_OWNERS, type UserDataPort } from './user-data-port';

const PAGE_LIMIT = 50;
// Defensive bound on owner pagination; a runaway cursor fails, never truncates.
const MAX_PAGES = 1000;
const CONSUMER_RECEIPT_TTL_MS = 24 * 60 * 60 * 1000;

class DataRequestFailure extends Error {
  constructor(readonly code: DataRequestFailureCode) {
    super(code);
  }
}

/**
 * Users data-request worker for `user.data_request.created`.
 * `handle` is the DB-local claim committed with the consumer receipt; the
 * after-commit continuation performs storage/multi-owner work and resumes
 * `processing` requests on job retry from recorded receipts.
 */
@Injectable()
export class DataRequestProcessor implements OutboxHandler {
  readonly operation = Object.freeze({
    consumer: 'users',
    handler: 'users.data-requests.process',
    eventType: DATA_REQUEST_EVENT_TYPES.created,
    schemaVersion: 1,
  });

  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(DATA_REQUEST_REPOSITORY)
    private readonly requests: DataRequestRepository,
    @Inject(USERS_REPOSITORY) private readonly users: UsersRepository,
    @Inject(USER_DATA_OWNERS) private readonly owners: readonly UserDataPort[],
    @Inject(AUTH_SESSION_PORT) private readonly sessions: AuthSessionPort,
    @Inject(PRIVATE_STORAGE) private readonly storage: StoragePort,
    @Inject(IDENTITY_CRYPTO) private readonly crypto: IdentityCrypto,
    private readonly events: DataRequestEvents,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
    @Inject(RUNTIME_LOGGER) private readonly logger: Logger,
  ) {}

  expiresAt(): Date {
    return new Date(this.clock.now().getTime() + CONSUMER_RECEIPT_TTL_MS);
  }

  /** Claim: queued -> processing, or an explicit blocked/failed outcome. */
  async handle(tx: TxContext, event: EventEnvelope): Promise<void> {
    const { requestId, userId } = this.payload(event);
    const row = await this.requests.lock(tx, requestId);
    if (!row || row.userId !== userId) throw new Error('DATA_REQUEST_MISSING');
    if (row.status !== 'queued') return;
    const user = await this.users.lock(tx, userId);
    const now = this.clock.now();
    if (row.type === 'export') {
      if (!user || user.accountStatus !== 'active' || user.deletedAt)
        return this.stop(tx, row, 'failed', 'ACCOUNT_UNAVAILABLE');
      // Q-32: no approved export retention => blocked, never a guessed TTL.
      if (!this.config.DATA_EXPORT_TTL_SECONDS)
        return this.stop(tx, row, 'blocked', 'POLICY_PENDING');
      await this.requests.update(tx, row.id, {
        status: 'processing',
        updatedAt: now,
      });
      return;
    }
    if (!user || user.deletedAt)
      return this.stop(tx, row, 'failed', 'ACCOUNT_UNAVAILABLE');
    // Q-32: without an approved deletion policy nothing is touched: the
    // account stays active, no erasure runs and no sessions are revoked.
    const policyVersion = this.config.DATA_DELETION_POLICY_VERSION;
    if (!policyVersion) return this.stop(tx, row, 'blocked', 'POLICY_PENDING');
    // Mark deleting first so new sessions/writes cannot recreate erased data.
    if (user.accountStatus !== 'deleting')
      await this.users.markDeleting(tx, userId, now);
    await this.requests.update(tx, row.id, {
      status: 'processing',
      policyVersion: row.policyVersion ?? policyVersion,
      updatedAt: now,
    });
  }

  /** Continuation after the claim commits (also on receipt replay). */
  async afterCommit(event: EventEnvelope): Promise<void> {
    const { requestId } = this.payload(event);
    const row = await this.uow.run((tx) => this.requests.lock(tx, requestId));
    if (!row || row.status !== 'processing') return;
    try {
      if (row.type === 'export') await this.export(row);
      else await this.erase(row);
    } catch (error) {
      const code =
        error instanceof DataRequestFailure ? error.code : 'PROCESSING_FAILED';
      this.logger.error({
        event: 'users.data_request_failed',
        requestId: row.id,
        code,
      });
      await this.uow.run(async (tx) => {
        const current = await this.requests.lock(tx, row.id);
        if (current?.status === 'processing')
          await this.stop(tx, current, 'failed', code);
      });
    }
  }

  private async export(row: StoredDataRequest): Promise<void> {
    const ttl = this.config.DATA_EXPORT_TTL_SECONDS;
    if (!ttl) throw new DataRequestFailure('POLICY_PENDING');
    const sections: Record<string, JsonValue> = {};
    for (const section of DATA_EXPORT_SECTIONS) {
      const owner = this.owners.find((item) => item.section === section);
      sections[section] = owner
        ? { status: 'included', items: await this.collect(owner, row) }
        : { status: 'unavailable', reasonCode: 'OWNER_NOT_IMPLEMENTED' };
    }
    const artifact: DataExport = DataExportSchema.parse({
      requestId: row.id,
      generatedAt: this.clock.now().toISOString(),
      sections,
    });
    const key = `data-requests/${row.id}.json`;
    try {
      await this.storage.put({
        key,
        body: Buffer.from(
          this.crypto.encrypt(
            JSON.stringify(artifact),
            exportArtifactContext(row.userId, row.id),
          ),
          'utf8',
        ),
      });
    } catch {
      throw new DataRequestFailure('STORAGE_UNAVAILABLE');
    }
    // Completed only after the whole artifact is stored.
    await this.uow.run(async (tx) => {
      const current = await this.requests.lock(tx, row.id);
      if (current?.status !== 'processing') return;
      const now = this.clock.now();
      const done = await this.requests.update(tx, row.id, {
        status: 'completed',
        artifactStorageKey: key,
        artifactExpiresAt: new Date(now.getTime() + ttl * 1000),
        completedAt: now,
        updatedAt: now,
      });
      await this.events.completed(tx, done);
    });
  }

  private async collect(
    owner: UserDataPort,
    row: StoredDataRequest,
  ): Promise<JsonValue[]> {
    const items: JsonValue[] = [];
    let cursor: string | null = null;
    for (let page = 0; page < MAX_PAGES; page += 1) {
      const result = await this.uow.run((tx) =>
        owner.exportPage({ userId: row.userId, cursor, limit: PAGE_LIMIT }, tx),
      );
      items.push(...result.items);
      if (result.nextCursor === null) return items;
      cursor = result.nextCursor;
    }
    throw new Error('USER_DATA_EXPORT_UNBOUNDED');
  }

  private async erase(row: StoredDataRequest): Promise<void> {
    const policyVersion = row.policyVersion;
    if (!policyVersion) throw new DataRequestFailure('POLICY_PENDING');
    for (const owner of this.owners) {
      const erase = owner.erase?.bind(owner);
      // Owners without erase retain data under their own policy.
      // Completed receipts are never repeated; blocked ones are retried.
      if (!erase || row.completedSteps[owner.section]?.status === 'completed')
        continue;
      const blocked = await this.uow.run(async (tx) => {
        const current = await this.requests.lock(tx, row.id);
        if (current?.status !== 'processing') return true;
        if (current.completedSteps[owner.section]?.status === 'completed')
          return false;
        const result = await erase(
          { userId: row.userId, requestId: row.id, policyVersion },
          tx,
        );
        const steps = {
          ...current.completedSteps,
          [owner.section]: {
            receipt: result.receipt,
            status: result.status,
            ...(result.reasonCode ? { reasonCode: result.reasonCode } : {}),
          },
        };
        // Blocked owners record their receipt and stop the request in the
        // same transaction; nothing further is erased.
        const updated = await this.requests.update(tx, row.id, {
          completedSteps: steps,
          updatedAt: this.clock.now(),
        });
        if (result.status === 'blocked') {
          await this.stop(tx, updated, 'blocked', 'OWNER_BLOCKED');
          return true;
        }
        return false;
      });
      if (blocked) return;
    }
    await this.uow.run(async (tx) => {
      const current = await this.requests.lock(tx, row.id);
      if (current?.status !== 'processing') return;
      // Sessions are revoked in the same transaction as completion.
      await this.sessions.revokeUserSessions({ userId: row.userId }, tx);
      const now = this.clock.now();
      const user = await this.users.markDeleted(tx, row.userId, now);
      const done = await this.requests.update(tx, row.id, {
        status: 'completed',
        completedAt: now,
        updatedAt: now,
      });
      await this.events.completed(tx, done);
      await this.events.accountDeleted(tx, user);
    });
  }

  private async stop(
    tx: TxContext,
    row: StoredDataRequest,
    status: 'blocked' | 'failed',
    failureCode: DataRequestFailureCode,
  ): Promise<void> {
    const updated = await this.requests.update(tx, row.id, {
      status,
      failureCode,
      updatedAt: this.clock.now(),
    });
    await this.events.failed(tx, updated);
  }

  private payload(event: EventEnvelope) {
    const parsed = DataRequestEventPayloadSchema.safeParse(event.payload);
    if (!parsed.success) throw new Error('DATA_REQUEST_EVENT_INVALID');
    return parsed.data;
  }
}
