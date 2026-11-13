import type { OrderPaymentSummary, PaymentMethod } from '@apnatown/shared/orders';
import type { TxContext } from '../../../shared/persistence/ports';

export const PAYMENT_ORDER = Symbol('PAYMENT_ORDER');

export interface CashAllocation {
  readonly id: string;
  readonly businessId: string;
  readonly amountPaise: number;
}

/**
 * Payments-owned order allocation contract (payments BE spec
 * `startOrderPayment` cash path, `recordCashCollection`,
 * `PaymentOrderReadPort.summary`). This slice supports cash only: no
 * provider charge, capture, refund or compensation exists yet.
 */
export interface PaymentOrderPort {
  /** One pending cash allocation per shop, bound to attempt/quote/round. */
  createCashAllocations(
    tx: TxContext,
    input: {
      checkoutAttemptId: string;
      quoteId: string;
      paymentRound: number;
      initiatedBy: string;
      idempotencyKey: string;
      requestHash: string;
      at: Date;
      allocations: readonly CashAllocation[];
    },
  ): Promise<void>;
  linkOrder(tx: TxContext, input: { paymentAttemptId: string; orderId: string; at: Date }): Promise<void>;
  summary(tx: TxContext, orderId: string, lock?: boolean): Promise<OrderPaymentSummary | null>;
  /** Method/status per order for list cards. */
  listing(
    tx: TxContext,
    orderIds: readonly string[],
  ): Promise<ReadonlyMap<string, { method: PaymentMethod; status: OrderPaymentSummary['status'] }>>;
  /**
   * Verified-handover cash collection in the caller's UoW: rereads the
   * current outstanding amount under lock; exactly one collection key per
   * handover. Throws DELIVERY_VERSION_CONFLICT (caller's handover contract)
   * when the allocation is no longer pending or its financial version moved.
   */
  recordCashCollection(
    tx: TxContext,
    input: {
      orderId: string;
      collectionKey: string;
      verifiedHandoverId: string;
      expectedFinancialVersion: number;
      actorUserId: string;
      correlationId: string;
      at: Date;
    },
  ): Promise<OrderPaymentSummary>;
  /** Closes an unpaid allocation when its order is cancelled (no refund). */
  closeForCancellation(tx: TxContext, orderId: string, at: Date): Promise<void>;
}
