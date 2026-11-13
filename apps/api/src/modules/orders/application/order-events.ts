import { Inject, Injectable } from '@nestjs/common';
import { ORDER_EVENT_TYPES } from '@apnatown/shared/orders';
import { EVENT_FACTORY, type EventFactory } from '../../../shared/events/event-factory';
import { OUTBOX_WRITER, type OutboxWriter } from '../../../shared/events/ports';
import type { TxContext } from '../../../shared/persistence/ports';
import type { StoredOrder } from '../domain/order';
import { OrderRealtime } from './order-realtime';

const scope = (order: StoredOrder) => ({ cityId: order.cityId, areaId: order.areaId });

/**
 * Orders event contracts (orders BE "Event contracts"): references only, no
 * address/contact/code. Appended in the same UoW as the state change,
 * together with the real-time hint to the customer and business owner.
 */
@Injectable()
export class OrderEvents {
  constructor(
    @Inject(EVENT_FACTORY) private readonly events: EventFactory,
    @Inject(OUTBOX_WRITER) private readonly outbox: OutboxWriter,
    private readonly realtime: OrderRealtime,
  ) {}

  async created(tx: TxContext, order: StoredOrder, correlationId: string) {
    await this.outbox.append(
      tx,
      this.events.create(
        ORDER_EVENT_TYPES.created,
        { type: 'order', id: order.id, version: order.version },
        {
          orderId: order.id,
          checkoutAttemptId: order.checkoutAttemptId,
          businessId: order.businessId,
          customerUserId: order.customerUserId,
          scope: scope(order),
          mode: order.mode,
          deliveryMethod: order.deliveryMethod,
          paymentAttemptId: order.paymentAttemptId,
          financialVersion: order.financialVersion,
          status: 'placed',
        },
        correlationId,
      ),
    );
    await this.realtime.changed(tx, order);
  }

  async changed(
    tx: TxContext,
    input: { before: StoredOrder; after: StoredOrder; reasonKey: string | null; source: string; correlationId: string },
  ) {
    const { before, after } = input;
    const base = {
      orderId: after.id,
      businessId: after.businessId,
      scope: scope(after),
      mode: after.mode,
      deliveryMethod: after.deliveryMethod,
      fromStatus: before.status,
      toStatus: after.status,
      financialVersion: after.financialVersion,
      ...(input.reasonKey ? { reasonKey: input.reasonKey } : {}),
    };
    const aggregate = { type: 'order', id: after.id, version: after.version };
    const events = [this.events.create(ORDER_EVENT_TYPES.statusChanged, aggregate, base, input.correlationId)];
    if (after.status === 'cancelled')
      events.push(
        this.events.create(
          ORDER_EVENT_TYPES.cancelled,
          aggregate,
          {
            ...base,
            cancellationSource: input.source,
            // Rider failure after collection keeps the goods in custody (no restock).
            custody: before.status === 'out_for_delivery' ? 'post_pickup' : 'pre_pickup',
          },
          input.correlationId,
        ),
      );
    await this.outbox.appendMany(tx, events);
    await this.realtime.changed(tx, after);
  }
}
