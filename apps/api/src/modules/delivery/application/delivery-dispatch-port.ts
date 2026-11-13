import type { OrderDeliveryBlock } from '@apnatown/shared/delivery';
import type { TxContext } from '../../../shared/persistence/ports';
import type { GeoPoint } from '../domain/delivery-job';

export const DELIVERY_DISPATCH = Symbol('DELIVERY_DISPATCH');

/** Facts Orders hands over when a platform-rider order becomes ready. */
export interface ReadyOrderFacts {
  readonly orderId: string;
  readonly businessId: string;
  readonly scope: { readonly cityId: string; readonly areaId: string };
  readonly financialVersion: number;
  /** Decrypted address point; null blocks dispatch (DELIVERY_DISTANCE_UNAVAILABLE). */
  readonly dropPoint: GeoPoint | null;
}

export interface DispatchContext {
  readonly at: Date;
  readonly correlationId: string;
  readonly actorUserId?: string;
}

/**
 * Orders → Delivery dispatch contract in the caller's UoW (delivery BE rule
 * 1; orders BE "delivery.job_created"): `ready` ensures exactly one job and
 * starts auto-assignment; order detail reads the nonsecret job projection.
 */
export interface DeliveryDispatchPort {
  ensureForReady(tx: TxContext, facts: ReadyOrderFacts, ctx: DispatchContext): Promise<void>;
  orderBlock(
    tx: TxContext,
    orderId: string,
    viewer: 'customer' | 'business' | 'admin',
    now: Date,
  ): Promise<OrderDeliveryBlock | null>;
}
