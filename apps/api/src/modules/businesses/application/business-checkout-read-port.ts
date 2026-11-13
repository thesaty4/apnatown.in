import type { BusinessKind, DeliveryMethod } from '@apnatown/shared/businesses';
import type { TxContext } from '../../../shared/persistence/ports';

export const BUSINESS_CHECKOUT_READ = Symbol('BUSINESS_CHECKOUT_READ');

/**
 * Businesses-owned checkout projection (`BusinessReadPort.forCheckout`,
 * cart-checkout BE spec). Only publicly visible (approved, live) businesses
 * are returned; `version` versions the business and its settings. Null
 * settings stay null: an unconfigured fulfilment mode is unavailable, never
 * a guessed default (rule 4).
 */
export interface CheckoutBusinessView {
  readonly businessId: string;
  readonly kind: BusinessKind;
  readonly slug: string;
  readonly nameEn: string;
  readonly nameHi: string | null;
  readonly cityId: string;
  readonly areaId: string;
  readonly areaNameEn: string | null;
  readonly areaNameHi: string | null;
  readonly addressText: string | null;
  readonly location: { readonly lat: number; readonly lng: number } | null;
  readonly version: number;
  readonly temporarilyClosed: boolean;
  readonly deliveryMethod: DeliveryMethod | null;
  readonly deliveryRadiusKm: number | null;
  /** Self-delivery flat fee only; platform rider fees come from Geo. */
  readonly deliveryFeePaise: number | null;
  readonly minimumOrderPaise: number | null;
  readonly pickupEnabled: boolean;
  readonly pickupInstructions: string | null;
}

export interface BusinessCheckoutReadPort {
  /** Unknown/non-public ids are omitted. `lock` row-locks the businesses. */
  forCheckout(
    tx: TxContext,
    businessIds: readonly string[],
    lock?: boolean,
  ): Promise<ReadonlyMap<string, CheckoutBusinessView>>;
}
