import { Inject, Injectable } from '@nestjs/common';
import {
  DataExportSchema,
  DataRequestAcceptedSchema,
  type CreateDataRequest,
  type DataExport,
  type DataRequest,
  type DataRequestAccepted,
  type DataRequestCompletion,
} from '@apnatown/shared/users';
import { IdSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import type { SessionBinding } from '../../../shared/auth';
import {
  IDENTITY_CRYPTO,
  type IdentityCrypto,
} from '../../../shared/auth/crypto';
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
import {
  InvalidOpaqueTokenError,
  OPAQUE_TOKENS,
  type OpaqueTokens,
} from '../../../shared/runtime/opaque-token';
import {
  CLOCK,
  ID_PROVIDER,
  type Clock,
  type IdProvider,
} from '../../../shared/runtime/providers';
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
import { AddressAccess } from './address-access';
import type { AddressCommand } from './address-command';
import { DataRequestEvents } from './data-request-events';

// Local retry horizon, not a production retention policy (as for addresses).
const RECEIPT_TTL_MS = 24 * 60 * 60 * 1000;
// The idempotency receipt never holds the completion token or a response snapshot.
const receiptSchema = z.strictObject({ requestId: IdSchema });
const bearer = /^Bearer ([A-Za-z0-9_-]{43})$/;

@Injectable()
export class DataRequestService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY)
    private readonly contexts: HttpCommandContextFactory,
    private readonly access: AddressAccess,
    @Inject(DATA_REQUEST_REPOSITORY)
    private readonly requests: DataRequestRepository,
    private readonly events: DataRequestEvents,
    @Inject(OPAQUE_TOKENS) private readonly tokens: OpaqueTokens,
    @Inject(PRIVATE_STORAGE) private readonly storage: StoragePort,
    @Inject(IDENTITY_CRYPTO) private readonly crypto: IdentityCrypto,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
  ) {}

  async submit(
    request: AddressCommand,
    input: CreateDataRequest,
  ): Promise<DataRequestAccepted> {
    const command = this.contexts.create(
      {
        name: 'users.data-requests.post',
        method: 'POST',
        scope: 'principal',
        successStatus: 202,
      },
      {
        actorId: request.actorId,
        correlationId: request.correlationId,
        resource: '/users/me/data-requests',
        business: null,
        expiresAt: new Date(this.clock.now().getTime() + RECEIPT_TTL_MS),
      },
      {
        key: request.key,
        payload: input.confirmed
          ? { type: input.type, confirmed: true }
          : { type: input.type },
      },
    );
    // The context factory has validated the header format.
    const key = String(request.key);
    const result = await this.commands.run(
      command,
      async (tx) => {
        const userId = await this.access.own(
          tx,
          request.session,
          command.actor.id,
        );
        return this.accept(tx, await this.place(tx, userId, key, input));
      },
      {
        store: (accepted) => ({
          requestId: receiptSchema.parse({ requestId: accepted.requestId })
            .requestId,
        }),
        replay: async (tx, stored) => {
          const userId = await this.access.own(
            tx,
            request.session,
            command.actor.id,
          );
          const { requestId } = receiptSchema.parse(stored);
          const row = await this.requests.lock(tx, requestId);
          if (!row || row.userId !== userId)
            throw new Error('INVALID_DATA_REQUEST_RECEIPT');
          // Authenticated retry: same request, rotated capability.
          return this.accept(tx, row);
        },
      },
    );
    return DataRequestAcceptedSchema.parse(result);
  }

  read(session: SessionBinding, requestId: string): Promise<DataRequest> {
    return this.uow.run(async (tx) => {
      const row = await this.owned(tx, session, requestId);
      const now = this.clock.now();
      return {
        requestId: row.id,
        type: row.type,
        status: row.status,
        ...(row.failureCode ? { failureCode: row.failureCode } : {}),
        requestedAt: row.requestedAt.toISOString(),
        ...(row.completedAt
          ? { completedAt: row.completedAt.toISOString() }
          : {}),
        downloadAvailable:
          row.type === 'export' &&
          row.status === 'completed' &&
          row.artifactStorageKey !== null &&
          row.artifactExpiresAt !== null &&
          row.artifactExpiresAt > now,
      };
    });
  }

  async download(
    session: SessionBinding,
    requestId: string,
  ): Promise<DataExport> {
    // Ownership, account status and expiry are rechecked on every download.
    const row = await this.uow.run(async (tx) => {
      const found = await this.owned(tx, session, requestId);
      if (found.type !== 'export')
        throw new DomainError('DATA_REQUEST_NOT_FOUND');
      if (found.status !== 'completed' || !found.artifactStorageKey)
        throw new DomainError('DATA_REQUEST_NOT_READY');
      if (
        !found.artifactExpiresAt ||
        found.artifactExpiresAt <= this.clock.now()
      )
        throw new DomainError('DATA_EXPORT_EXPIRED');
      return found;
    });
    const key = row.artifactStorageKey;
    if (!key) throw new DomainError('DATA_REQUEST_NOT_READY');
    let body: Buffer;
    try {
      body = await this.storage.get(key);
    } catch {
      throw new DomainError('COMMON_UNAVAILABLE');
    }
    return DataExportSchema.parse(
      JSON.parse(
        this.crypto.decrypt(
          body.toString('utf8'),
          exportArtifactContext(row.userId, row.id),
        ),
      ),
    );
  }

  /** Capability-only deletion status; reveals `{status}` and nothing else. */
  completion(
    requestId: string,
    authorization: unknown,
  ): Promise<DataRequestCompletion> {
    const match =
      typeof authorization === 'string' ? bearer.exec(authorization) : null;
    const token = match?.[1];
    if (!token) throw new DomainError('DATA_REQUEST_NOT_FOUND');
    return this.uow.run(async (tx) => {
      const row = await this.requests.lock(tx, requestId);
      if (
        !row ||
        row.type !== 'delete' ||
        !row.completionTokenHash ||
        !row.completionTokenExpiresAt ||
        row.completionTokenExpiresAt <= this.clock.now() ||
        !this.verify(token, row.completionTokenHash)
      )
        throw new DomainError('DATA_REQUEST_NOT_FOUND');
      return { status: row.status };
    });
  }

  private async place(
    tx: TxContext,
    userId: string,
    key: string,
    input: CreateDataRequest,
  ): Promise<StoredDataRequest> {
    // Every path below runs under the user row lock taken by access.own().
    const existing = await this.requests.findByKey(tx, userId, key);
    if (existing) {
      if (existing.type !== input.type)
        throw new DomainError('DATA_REQUEST_CONFLICT');
      return existing;
    }
    const deletion = await this.requests.openDeletion(tx, userId);
    if (input.type === 'delete' && deletion) {
      // Collapse to the one open deletion; never a second erasure job.
      if (deletion.status !== 'blocked' && deletion.status !== 'failed')
        return deletion;
      // Retry resumes from recorded receipts (completed_steps is kept).
      const requeued = await this.requests.update(tx, deletion.id, {
        status: 'queued',
        failureCode: null,
        updatedAt: this.clock.now(),
      });
      await this.events.created(tx, requeued);
      return requeued;
    }
    if (input.type === 'export') {
      if (
        deletion &&
        (deletion.status === 'queued' || deletion.status === 'processing')
      )
        throw new DomainError('DATA_REQUEST_CONFLICT');
      const active = await this.requests.activeExport(tx, userId);
      if (active) return active;
    }
    const now = this.clock.now();
    const row: StoredDataRequest = {
      id: this.ids.uuidv7(),
      userId,
      type: input.type,
      status: 'queued',
      idempotencyKey: key,
      policyVersion: null,
      completedSteps: {},
      artifactStorageKey: null,
      artifactExpiresAt: null,
      completionTokenHash: null,
      completionTokenExpiresAt: null,
      failureCode: null,
      requestedAt: now,
      updatedAt: now,
      completedAt: null,
    };
    await this.requests.insert(tx, row);
    await this.events.created(tx, row);
    return row;
  }

  /**
   * Presents the accepted request. A confirmed, unfinished deletion gets a
   * fresh request-bound completion capability; only its hash and expiry are
   * persisted, atomically replacing any previous one. Without an approved
   * capability lifetime (Q-32) none is issued.
   */
  private async accept(
    tx: TxContext,
    row: StoredDataRequest,
  ): Promise<Record<string, string>> {
    const base: Record<string, string> = {
      requestId: row.id,
      type: row.type,
      status: row.status,
      ...(row.failureCode ? { failureCode: row.failureCode } : {}),
      requestedAt: row.requestedAt.toISOString(),
    };
    const ttl = this.config.DATA_DELETION_COMPLETION_TTL_SECONDS;
    if (row.type !== 'delete' || row.status === 'completed' || !ttl)
      return base;
    const now = this.clock.now();
    const issued = this.tokens.issue('data-request-completion');
    const expiresAt = new Date(now.getTime() + ttl * 1000);
    await this.requests.update(tx, row.id, {
      completionTokenHash: issued.hash,
      completionTokenExpiresAt: expiresAt,
      updatedAt: now,
    });
    return {
      ...base,
      completionToken: issued.token,
      completionTokenExpiresAt: expiresAt.toISOString(),
    };
  }

  private async owned(
    tx: TxContext,
    session: SessionBinding,
    requestId: string,
  ): Promise<StoredDataRequest> {
    const userId = await this.access.own(tx, session);
    const row = await this.requests.lock(tx, requestId);
    // Another user's request is indistinguishable from a missing one.
    if (!row || row.userId !== userId)
      throw new DomainError('DATA_REQUEST_NOT_FOUND');
    return row;
  }

  private verify(token: string, hash: Uint8Array): boolean {
    try {
      return this.tokens.verify('data-request-completion', token, hash);
    } catch (error) {
      if (error instanceof InvalidOpaqueTokenError) return false;
      throw error;
    }
  }
}
