import type { TxContext } from '../../../shared/persistence/ports';

export const BUSINESS_CART_READ = Symbol('BUSINESS_CART_READ');

/**
 * Businesses-owned public shop summary for Cart grouping (cart-checkout BE
 * spec). Only publicly visible businesses are returned; fulfilment and the
 * delivery minimum are display estimates — the quote stays authoritative.
 */
export interface CartBusinessView {
  readonly businessId: string;
  readonly slug: string;
  readonly kind: string;
  readonly nameEn: string;
  readonly nameHi: string | null;
  readonly areaNameEn: string | null;
  readonly areaNameHi: string | null;
  readonly pickupEnabled: boolean;
  readonly deliveryAvailable: boolean;
  readonly temporarilyClosed: boolean;
  readonly minimumOrderPaise: number | null;
}

export interface BusinessCartReadPort {
  forCart(
    tx: TxContext,
    businessIds: readonly string[],
  ): Promise<ReadonlyMap<string, CartBusinessView>>;
}
