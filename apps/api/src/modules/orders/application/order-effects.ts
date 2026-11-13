import { Inject, Injectable } from '@nestjs/common';
import type { OrderStatus } from '@apnatown/shared/orders';
import type { TxContext } from '../../../shared/persistence/ports';
import { DELIVERY_CODES, type DeliveryCodesPort } from '../../delivery/application/delivery-codes-port';
import { DELIVERY_DISPATCH, type DeliveryDispatchPort } from '../../delivery/application/delivery-dispatch-port';
import { PAYMENT_ORDER, type PaymentOrderPort } from '../../payments/application/payment-order-port';
import { ORDER_WRITES, type OrderWriteRepository, type StoredOrder } from '../domain/order';
import { OrderAddressCipher } from './order-address-cipher';
import { OrderStock } from './order-stock';

export interface EffectInput {
  readonly before: StoredOrder;
  readonly after: StoredOrder;
  readonly at: Date;
  readonly correlationId: string;
}
type Effect = (tx: TxContext, input: EffectInput) => Promise<void>;

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
    @Inject(DELIVERY_DISPATCH) private readonly dispatch: DeliveryDispatchPort,
    @Inject(PAYMENT_ORDER) private readonly payments: PaymentOrderPort,
    private readonly addresses: OrderAddressCipher,
    private readonly stock: OrderStock,
  ) {
    this.byStatus = {
      // Pickup code at pickup-ready (delivery BE rule 6); platform-rider
      // orders get exactly one job + auto-assignment (rule 1).
      ready: async (tx, { after, at, correlationId }) => {
        if (after.mode === 'pickup') await this.codes.issue(tx, { orderId: after.id, kind: 'pickup_code', at });
        if (after.deliveryMethod === 'apna_town_rider') await this.requestRider(tx, after, at, correlationId);
      },
      // Self-dispatch or rider pickup issues the customer's delivery OTP.
      out_for_delivery: async (tx, { after, at }) => {
        await this.codes.issue(tx, { orderId: after.id, kind: 'delivery_otp', at });
      },
      cancelled: async (tx, { before, after, at }) => {
        // After rider pickup the goods are not back: hold allocations (no restock).
        if (before.status !== 'out_for_delivery')
          await this.stock.releaseOrder(tx, { orderId: after.id, reservationId: after.checkoutAttemptId, at });
        await this.payments.closeForCancellation(tx, after.id, at);
        await this.codes.invalidate(tx, after.id, at);
      },
      delivered: (tx, { after, at }) => this.fulfil(tx, after, at),
      picked_up: (tx, { after, at }) => this.fulfil(tx, after, at),
    };
  }

  run(tx: TxContext, input: EffectInput): Promise<void> {
    return this.byStatus[input.after.status]?.(tx, input) ?? Promise.resolve();
  }

  private requestRider(tx: TxContext, order: StoredOrder, at: Date, correlationId: string) {
    const address = order.address ? this.addresses.open(order.id, order.address) : null;
    return this.dispatch.ensureForReady(
      tx,
      {
        orderId: order.id,
        businessId: order.businessId,
        scope: { cityId: order.cityId, areaId: order.areaId },
        financialVersion: order.financialVersion,
        dropPoint: address?.location ?? null,
      },
      { at, correlationId },
    );
  }

  private fulfil(tx: TxContext, order: StoredOrder, at: Date) {
    return this.writes.settleAllocations(tx, { orderId: order.id, disposition: 'fulfilled', at });
  }
}
