import { Inject, Injectable } from '@nestjs/common';
import type { OrderStatus } from '@apnatown/shared/orders';
import type { TxContext } from '../../../shared/persistence/ports';
import { DELIVERY_CODES, type DeliveryCodesPort } from '../../delivery/application/delivery-codes-port';
import { PAYMENT_ORDER, type PaymentOrderPort } from '../../payments/application/payment-order-port';
import { ORDER_WRITES, type OrderWriteRepository, type StoredOrder } from '../domain/order';
import { OrderStock } from './order-stock';

type Effect = (tx: TxContext, order: StoredOrder, at: Date) => Promise<void>;

/**
 * Side effects keyed by the target status (open/closed: add an entry, not a
 * branch in the lifecycle). All run in the transition's UoW.
 */
@Injectable()
export class OrderEffects {
  private readonly byStatus: Partial<Record<OrderStatus, Effect>>;

  constructor(
    @Inject(ORDER_WRITES) private readonly writes: OrderWriteRepository,
    @Inject(DELIVERY_CODES) private readonly codes: DeliveryCodesPort,
    @Inject(PAYMENT_ORDER) private readonly payments: PaymentOrderPort,
    private readonly stock: OrderStock,
  ) {
    this.byStatus = {
      // Pickup code at pickup-ready (delivery BE rule 6); platform orders wait for rider jobs.
      ready: async (tx, order, at) => {
        if (order.mode === 'pickup') await this.codes.issue(tx, { orderId: order.id, kind: 'pickup_code', at });
      },
      // Self-dispatch issues the delivery OTP (no job exists).
      out_for_delivery: async (tx, order, at) => {
        await this.codes.issue(tx, { orderId: order.id, kind: 'delivery_otp', at });
      },
      cancelled: async (tx, order, at) => {
        await this.stock.releaseOrder(tx, { orderId: order.id, reservationId: order.checkoutAttemptId, at });
        await this.payments.closeForCancellation(tx, order.id, at);
        await this.codes.invalidate(tx, order.id, at);
      },
      delivered: (tx, order, at) => this.fulfil(tx, order, at),
      picked_up: (tx, order, at) => this.fulfil(tx, order, at),
    };
  }

  run(tx: TxContext, order: StoredOrder, at: Date): Promise<void> {
    return this.byStatus[order.status]?.(tx, order, at) ?? Promise.resolve();
  }

  private fulfil(tx: TxContext, order: StoredOrder, at: Date) {
    return this.writes.settleAllocations(tx, { orderId: order.id, disposition: 'fulfilled', at });
  }
}
