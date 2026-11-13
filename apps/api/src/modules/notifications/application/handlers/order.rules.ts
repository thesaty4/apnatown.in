import { Inject, Injectable } from '@nestjs/common';
import type { EventEnvelope } from '@apnatown/shared';
import {
  ORDER_EVENT_TYPES,
  OrderCancelledPayloadSchema,
  OrderCreatedPayloadSchema,
  OrderStatusChangedPayloadSchema,
  type OrderStatus,
} from '@apnatown/shared/orders';
import type { TxContext } from '../../../../shared/persistence/ports';
import {
  ORDER_NOTIFICATION_CONTEXT,
  type OrderNotificationContext,
  type OrderNotificationContextPort,
} from '../notification-ports';
import type { NotifyCommand } from '../notification-publisher';
import { NotificationRecipients } from '../notification-recipients';
import { payload, type NotificationRule } from '../notification-rule';

/** Business-driven progress the customer is told about (cancel handled separately). */
const CUSTOMER_STATUSES: ReadonlySet<OrderStatus> = new Set([
  'accepted',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'picked_up',
]);

/** Shared order lookups: immutable order number + B (live seller role). */
@Injectable()
export class OrderNotificationSupport {
  constructor(
    readonly recipients: NotificationRecipients,
    @Inject(ORDER_NOTIFICATION_CONTEXT)
    private readonly orders: OrderNotificationContextPort,
  ) {}

  context(tx: TxContext, orderId: string): Promise<OrderNotificationContext | null> {
    return this.orders.context(tx, orderId);
  }

  /** Owner notice to `/{vendor|provider}/orders/{id}`; null when the business is gone. */
  async owner(
    tx: TxContext,
    order: OrderNotificationContext,
    templateKey: 'order.new' | 'order.cancelled',
  ): Promise<NotifyCommand | null> {
    const business = await this.recipients.business(tx, order.businessId);
    if (!business) return null;
    return {
      templateKey,
      params: { orderNumber: order.orderNumber },
      link: `/${business.audienceRole}/orders/${order.orderId}`,
      recipients: [await this.recipients.owner(tx, business, true)],
    };
  }

  /** Customer progress notice to `/orders/{id}` (status code + order number only). */
  async customer(
    tx: TxContext,
    order: OrderNotificationContext,
    status: string,
  ): Promise<NotifyCommand> {
    return {
      templateKey: 'order.status',
      params: { status, orderNumber: order.orderNumber },
      link: `/orders/${order.orderId}`,
      recipients: [await this.recipients.user(tx, order.customerUserId, 'customer')],
    };
  }
}

/** `order.created` -> B `order.new` (no customer name, address or amount). */
@Injectable()
export class OrderPlacedRule implements NotificationRule {
  readonly name = 'order-placed';
  readonly eventTypes = [ORDER_EVENT_TYPES.created];
  constructor(private readonly support: OrderNotificationSupport) {}

  async command(tx: TxContext, event: EventEnvelope): Promise<NotifyCommand | null> {
    const input = payload(OrderCreatedPayloadSchema, event);
    const order = await this.support.context(tx, input.orderId);
    return order ? this.support.owner(tx, order, 'order.new') : null;
  }
}

/** `order.status_changed` (business/handover progress) -> customer `order.status`. */
@Injectable()
export class OrderProgressRule implements NotificationRule {
  readonly name = 'order-progress';
  readonly eventTypes = [ORDER_EVENT_TYPES.statusChanged];
  constructor(private readonly support: OrderNotificationSupport) {}

  async command(tx: TxContext, event: EventEnvelope): Promise<NotifyCommand | null> {
    const input = payload(OrderStatusChangedPayloadSchema, event);
    // The event's own target status, never the (possibly newer) current one.
    if (!CUSTOMER_STATUSES.has(input.toStatus)) return null;
    const order = await this.support.context(tx, input.orderId);
    if (!order) return null;
    const status =
      input.mode === 'pickup' && input.toStatus === 'ready' ? 'ready_for_pickup' : input.toStatus;
    return this.support.customer(tx, order, status);
  }
}

/**
 * `order.cancelled`: business reject -> customer `order.status` (rejected);
 * customer cancel -> B `order.cancelled`. Admin BR-20 alerts are deferred.
 */
@Injectable()
export class OrderCancelledRule implements NotificationRule {
  readonly name = 'order-cancelled';
  readonly eventTypes = [ORDER_EVENT_TYPES.cancelled];
  constructor(private readonly support: OrderNotificationSupport) {}

  async command(tx: TxContext, event: EventEnvelope): Promise<NotifyCommand | null> {
    const input = payload(OrderCancelledPayloadSchema, event);
    const order = await this.support.context(tx, input.orderId);
    if (!order) return null;
    if (input.cancellationSource === 'customer')
      return this.support.owner(tx, order, 'order.cancelled');
    return this.support.customer(
      tx,
      order,
      input.cancellationSource === 'business' ? 'rejected' : 'cancelled',
    );
  }
}
