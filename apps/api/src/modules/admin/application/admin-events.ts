import { Inject, Injectable } from '@nestjs/common';
import {
  ADMIN_EVENT_TYPES,
  AdminAccountStatusChangedPayloadSchema,
  AdminScopeChangedPayloadSchema,
  RoleUpdatedPayloadSchema,
  type AdminAccountStatusChangedPayload,
  type AdminScopeChangedPayload,
  type RoleUpdatedPayload,
} from '@apnatown/shared/admin';
import {
  EVENT_FACTORY,
  type EventFactory,
} from '../../../shared/events/event-factory';
import { OUTBOX_WRITER, type OutboxWriter } from '../../../shared/events/ports';
import type { TxContext } from '../../../shared/persistence/ports';

/** Outbox events, appended in the command transaction; published after commit. */
@Injectable()
export class AdminEvents {
  constructor(
    @Inject(EVENT_FACTORY) private readonly events: EventFactory,
    @Inject(OUTBOX_WRITER) private readonly outbox: OutboxWriter,
  ) {}

  statusChanged(
    tx: TxContext,
    payload: AdminAccountStatusChangedPayload,
    correlationId: string,
  ): Promise<void> {
    const data = AdminAccountStatusChangedPayloadSchema.parse(payload);
    return this.outbox.append(
      tx,
      this.events.create(
        ADMIN_EVENT_TYPES.accountStatusChanged,
        { type: 'admin_account', id: data.userId, version: data.version },
        data,
        correlationId,
      ),
    );
  }

  scopeChanged(
    tx: TxContext,
    payload: AdminScopeChangedPayload,
    correlationId: string,
  ): Promise<void> {
    const data = AdminScopeChangedPayloadSchema.parse(payload);
    return this.outbox.append(
      tx,
      this.events.create(
        ADMIN_EVENT_TYPES.scopeChanged,
        { type: 'admin_account', id: data.userId, version: data.version },
        data,
        correlationId,
      ),
    );
  }

  roleUpdated(
    tx: TxContext,
    payload: RoleUpdatedPayload,
    correlationId: string,
  ): Promise<void> {
    const data = RoleUpdatedPayloadSchema.parse(payload);
    return this.outbox.append(
      tx,
      this.events.create(
        ADMIN_EVENT_TYPES.roleUpdated,
        { type: 'role', id: data.roleId, version: data.version },
        data,
        correlationId,
      ),
    );
  }
}
