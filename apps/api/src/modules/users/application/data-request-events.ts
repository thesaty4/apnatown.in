import { Inject, Injectable } from '@nestjs/common';
import {
  DATA_REQUEST_EVENT_TYPES,
  DataRequestEventPayloadSchema,
  DataRequestFailedEventPayloadSchema,
  USER_ACCOUNT_EVENT_TYPES,
  UserAccountEventPayloadSchema,
} from '@apnatown/shared';
import {
  EVENT_FACTORY,
  OUTBOX_WRITER,
  type EventFactory,
  type OutboxWriter,
} from '../../../shared/events';
import { currentCorrelationId } from '../../../shared/logger/context';
import type { TxContext } from '../../../shared/persistence/ports';
import type { StoredDataRequest } from '../domain/data-request';
import type { UserIdentity } from '../domain/identity';

/** Outbox publication for data requests; IDs and codes only, never PII. */
@Injectable()
export class DataRequestEvents {
  constructor(
    @Inject(EVENT_FACTORY) private readonly events: EventFactory,
    @Inject(OUTBOX_WRITER) private readonly outbox: OutboxWriter,
  ) {}
  created(tx: TxContext, row: StoredDataRequest): Promise<void> {
    return this.request(tx, DATA_REQUEST_EVENT_TYPES.created, row);
  }
  completed(tx: TxContext, row: StoredDataRequest): Promise<void> {
    return this.request(tx, DATA_REQUEST_EVENT_TYPES.completed, row);
  }
  async failed(tx: TxContext, row: StoredDataRequest): Promise<void> {
    const payload = {
      requestId: row.id,
      userId: row.userId,
      type: row.type,
      status: row.status,
      failureCode: row.failureCode,
    };
    if (!DataRequestFailedEventPayloadSchema.safeParse(payload).success)
      throw new Error('INVALID_DATA_REQUEST_EVENT');
    await this.append(tx, DATA_REQUEST_EVENT_TYPES.failed, row.id, payload);
  }
  async accountDeleted(tx: TxContext, user: UserIdentity): Promise<void> {
    const payload = {
      userId: user.id,
      status: user.accountStatus,
      version: user.version,
    };
    if (!UserAccountEventPayloadSchema.safeParse(payload).success)
      throw new Error('INVALID_USER_ACCOUNT_EVENT');
    const correlationId = this.correlationId();
    await this.outbox.append(
      tx,
      this.events.create(
        USER_ACCOUNT_EVENT_TYPES.deleted,
        { type: 'user', id: user.id, version: user.version },
        payload,
        correlationId,
      ),
    );
  }
  private async request(
    tx: TxContext,
    type: string,
    row: StoredDataRequest,
  ): Promise<void> {
    const payload = { requestId: row.id, userId: row.userId, type: row.type };
    if (!DataRequestEventPayloadSchema.safeParse(payload).success)
      throw new Error('INVALID_DATA_REQUEST_EVENT');
    await this.append(tx, type, row.id, payload);
  }
  private async append(
    tx: TxContext,
    type: string,
    id: string,
    payload: { [key: string]: string | null },
  ): Promise<void> {
    await this.outbox.append(
      tx,
      this.events.create(
        type,
        { type: 'data_request', id, version: 1 },
        payload,
        this.correlationId(),
      ),
    );
  }
  private correlationId(): string {
    const correlationId = currentCorrelationId();
    if (!correlationId) throw new Error('MISSING_CORRELATION_CONTEXT');
    return correlationId;
  }
}
