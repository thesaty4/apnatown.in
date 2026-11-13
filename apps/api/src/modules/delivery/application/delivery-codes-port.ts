import type { DeliveryCodeKind, HandoverMeta } from '@apnatown/shared/delivery';
import type { TxContext } from '../../../shared/persistence/ports';

export const DELIVERY_CODES = Symbol('DELIVERY_CODES');

/**
 * Trusted Orders → Delivery code contract in the caller's unit of work
 * (delivery BE rule 6/10; `DeliveryOrderReadPort.handoverState`). Returns
 * nonsecret metadata only; plaintext stays inside Delivery.
 */
export interface DeliveryCodesPort {
  /** Issues a fresh generation (idempotent while one is live). */
  issue(tx: TxContext, input: { orderId: string; kind: DeliveryCodeKind; at: Date }): Promise<HandoverMeta>;
  /** Invalidates every live generation (order cancelled). */
  invalidate(tx: TxContext, orderId: string, at: Date): Promise<void>;
  handoverState(tx: TxContext, orderId: string, now: Date): Promise<HandoverMeta>;
}
