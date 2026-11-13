import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import type { BusinessKind } from '@apnatown/shared/businesses';
import type { SessionBinding } from '../../../shared/auth';
import { SESSION_ACCESS, type SessionAccess } from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import { EVENT_FACTORY, type EventFactory } from '../../../shared/events/event-factory';
import { OUTBOX_WRITER, type OutboxWriter } from '../../../shared/events/ports';
import { COMMAND_CONTEXT_FACTORY, HttpCommandContextFactory } from '../../../shared/idempotency/context';
import { RECEIPT_TTL_MS } from '../../../shared/idempotency/receipt-ttl';
import type { CommandContext, TxContext } from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import { ApprovedSellerAccess } from '../../businesses/application/approved-seller-access';
import {
  ORDERS_FULFILMENT,
  type FulfilmentOrder,
  type OrdersFulfilmentPort,
} from '../../orders/application/order-ports';

/** Authenticated handover caller; order/business ownership is server-side. */
export interface HandoverCommand {
  readonly session: SessionBinding;
  readonly actorId: string;
  readonly businessKind?: BusinessKind;
  readonly correlationId: string;
  readonly key?: unknown;
}

/**
 * Shared handover plumbing: idempotent command contexts, owner/customer
 * order authorization (foreign = ORDER_NOT_FOUND) and Delivery outbox
 * events (references only; never a code, address or phone).
 */
@Injectable()
export class HandoverSupport {
  constructor(
    @Inject(ORDERS_FULFILMENT) readonly orders: OrdersFulfilmentPort,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(COMMAND_CONTEXT_FACTORY) private readonly contexts: HttpCommandContextFactory,
    @Inject(EVENT_FACTORY) private readonly events: EventFactory,
    @Inject(OUTBOX_WRITER) private readonly outbox: OutboxWriter,
    @Inject(CLOCK) readonly clock: Clock,
    private readonly sellers: ApprovedSellerAccess,
  ) {}

  command(request: HandoverCommand, name: string, resource: string, payload: JsonValue): CommandContext {
    return this.contexts.create(
      { name, method: 'POST', scope: 'principal', successStatus: 200 },
      {
        actorId: request.actorId,
        correlationId: request.correlationId,
        resource,
        business: null,
        expiresAt: new Date(this.clock.now().getTime() + RECEIPT_TTL_MS),
      },
      { key: request.key, payload },
    );
  }

  /** Locks the order and requires the caller's approved owning business. */
  async ownedOrder(tx: TxContext, request: HandoverCommand, orderId: string): Promise<FulfilmentOrder> {
    await this.principal(tx, request);
    const order = await this.orders.read(tx, orderId);
    if (!order || !(await this.sellers.forBusiness(tx, request, order.businessId, true)))
      throw new DomainError('ORDER_NOT_FOUND');
    return order;
  }

  /** The order's own customer only (dedicated code channel). */
  async customerOrder(tx: TxContext, request: HandoverCommand, orderId: string): Promise<FulfilmentOrder> {
    const userId = await this.principal(tx, request);
    const order = await this.orders.read(tx, orderId);
    if (!order || order.customerUserId !== userId) throw new DomainError('ORDER_NOT_FOUND');
    return order;
  }

  publish(
    tx: TxContext,
    type: string,
    order: FulfilmentOrder,
    extra: { actorUserId: string; handoverId?: string },
    correlationId: string,
  ) {
    return this.outbox.append(
      tx,
      this.events.create(
        type,
        { type: 'order', id: order.id, version: order.version },
        {
          orderId: order.id,
          scope: order.scope,
          orderVersion: order.version,
          financialVersion: order.financialVersion,
          ...extra,
        },
        correlationId,
      ),
    );
  }

  private async principal(tx: TxContext, request: HandoverCommand): Promise<string> {
    const principal = await this.sessions.requirePrincipal(tx, request.session);
    if (principal.userId !== request.actorId) throw new DomainError('SESSION_EXPIRED');
    return principal.userId;
  }
}
