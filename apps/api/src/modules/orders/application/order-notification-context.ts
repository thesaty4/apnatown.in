import { Inject, Injectable } from '@nestjs/common';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  OrderNotificationContext,
  OrderNotificationContextPort,
} from '../../notifications/application/notification-ports';
import { ORDER_READS, type OrderReadRepository } from '../domain/order';
import type { OrderParties, OrderPartiesPort } from './order-ports';

/**
 * Orders' binding of Notifications' ORDER_NOTIFICATION_CONTEXT and Delivery's
 * ORDER_PARTIES (references and versions only; worker-safe).
 */
@Injectable()
export class OrderNotificationContextAdapter implements OrderNotificationContextPort, OrderPartiesPort {
  constructor(@Inject(ORDER_READS) private readonly reads: OrderReadRepository) {}

  async context(tx: TxContext, orderId: string): Promise<OrderNotificationContext | null> {
    const order = await this.reads.find(tx, orderId);
    if (!order) return null;
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerUserId: order.customerUserId,
      businessId: order.businessId,
    };
  }

  async parties(tx: TxContext, orderId: string): Promise<OrderParties | null> {
    const order = await this.reads.find(tx, orderId);
    if (!order) return null;
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerUserId: order.customerUserId,
      businessId: order.businessId,
      version: order.version,
      financialVersion: order.financialVersion,
    };
  }
}
