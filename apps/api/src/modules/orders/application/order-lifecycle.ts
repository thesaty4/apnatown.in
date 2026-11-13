import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import { ID_PROVIDER, type IdProvider } from '../../../shared/runtime/providers';
import { ORDER_WRITES, type OrderWriteRepository, type StoredOrder } from '../domain/order';
import { findTransition, type OrderActorKind, type OrderEvent } from '../domain/order-state-machine';
import { OrderEffects } from './order-effects';
import { OrderEvents } from './order-events';

export interface TransitionInput {
  /** Locked (FOR UPDATE) current row. */
  readonly order: StoredOrder;
  readonly event: OrderEvent;
  readonly actor: { readonly kind: OrderActorKind; readonly userId: string | null };
  readonly expectedVersion: number;
  readonly reasonKey: string | null;
  readonly correlationId: string;
  readonly at: Date;
}

/**
 * The only order status writer (BR-04): registry lookup, actor/method guard,
 * optimistic version, append-only history, status effects and outbox in the
 * caller's UoW. Invalid edges fail before any write.
 */
@Injectable()
export class OrderLifecycle {
  constructor(
    @Inject(ORDER_WRITES) private readonly writes: OrderWriteRepository,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    private readonly effects: OrderEffects,
    private readonly events: OrderEvents,
  ) {}

  async apply(tx: TxContext, input: TransitionInput): Promise<StoredOrder> {
    const { order } = input;
    const handler = findTransition(order.mode, order.status, input.event);
    if (!handler || handler.actor !== input.actor.kind) throw new DomainError('ORDERS_INVALID_TRANSITION');
    if (handler.method && order.deliveryMethod !== handler.method) throw new DomainError('ORDERS_INVALID_TRANSITION');
    if (order.version !== input.expectedVersion) throw new DomainError('ORDER_VERSION_CONFLICT');
    const after = await this.writes.updateStatus(tx, {
      id: order.id,
      expectedVersion: order.version,
      status: handler.to,
      at: input.at,
    });
    if (!after) throw new DomainError('ORDER_VERSION_CONFLICT');
    await this.writes.insertHistory(tx, order.id, {
      id: this.ids.uuidv7(),
      fromStatus: order.status,
      toStatus: after.status,
      eventKey: `${input.event}:v${order.version}`,
      actorUserId: input.actor.userId,
      reasonKey: input.reasonKey,
      at: input.at,
    });
    await this.effects.run(tx, { before: order, after, at: input.at, correlationId: input.correlationId });
    await this.events.changed(tx, {
      before: order,
      after,
      reasonKey: input.reasonKey,
      source: input.actor.kind,
      correlationId: input.correlationId,
    });
    return after;
  }
}
