import { Injectable } from '@nestjs/common';
import type { EventEnvelope } from '@apnatown/shared';
import {
  DELIVERY_EVENT_TYPES,
  DeliveryJobEventPayloadSchema,
  DeliveryOfferCreatedPayloadSchema,
} from '@apnatown/shared/delivery';
import type { TxContext } from '../../../../shared/persistence/ports';
import type { NotifyCommand } from '../notification-publisher';
import { payload, type NotificationRule } from '../notification-rule';
import { OrderNotificationSupport } from './order.rules';

/** `delivery.offer_created` -> rider `delivery.offer` (no address/amount/code). */
@Injectable()
export class DeliveryOfferRule implements NotificationRule {
  readonly name = 'delivery-offer';
  readonly eventTypes = [DELIVERY_EVENT_TYPES.offerCreated];
  constructor(private readonly support: OrderNotificationSupport) {}

  async command(tx: TxContext, event: EventEnvelope): Promise<NotifyCommand> {
    const input = payload(DeliveryOfferCreatedPayloadSchema, event);
    return {
      templateKey: 'delivery.offer',
      params: {},
      link: '/rider/requests',
      recipients: [await this.support.recipients.user(tx, input.riderUserId, 'rider')],
    };
  }
}

/** `delivery.assigned` / `delivery.unassigned` -> business owner (order number only). */
@Injectable()
export class DeliveryAssignmentRule implements NotificationRule {
  readonly name = 'delivery-assignment';
  readonly eventTypes = [DELIVERY_EVENT_TYPES.assigned, DELIVERY_EVENT_TYPES.unassigned];
  constructor(private readonly support: OrderNotificationSupport) {}

  async command(tx: TxContext, event: EventEnvelope): Promise<NotifyCommand | null> {
    const input = payload(DeliveryJobEventPayloadSchema, event);
    const order = await this.support.context(tx, input.orderId);
    if (!order) return null;
    return this.support.owner(
      tx,
      order,
      event.type === DELIVERY_EVENT_TYPES.assigned ? 'delivery.assigned' : 'delivery.unassigned',
    );
  }
}
