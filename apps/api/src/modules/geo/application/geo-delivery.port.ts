import type { TxContext } from '../../../shared/persistence/ports';

export const GEO_DELIVERY = Symbol('GEO_DELIVERY');
export interface GeoPointInput {
  readonly lat: number;
  readonly lng: number;
}
export type DeliveryQuote =
  | {
      readonly status: 'quoted';
      readonly cityVersion: number;
      /** Straight-line (geodesic) distance; no road-routing provider is approved. */
      readonly distanceKm: number;
      readonly feePaise: number;
      /** `zone` = matching active zone slabs; `default` = settings schedule. */
      readonly source: 'zone' | 'default';
      readonly zoneId?: string;
      readonly zoneVersion?: number;
      readonly settingsVersion?: number;
    }
  | {
      readonly status: 'unserviceable';
      readonly reason: 'city_disabled' | 'outside_city';
    }
  /** Enabled city, no matching zone and no default schedule configured. */
  | { readonly status: 'configuration_required' };

/**
 * Platform-rider (`apna_town_rider`) delivery fee only. Self-delivery uses
 * the business flat fee and pickup is zero; those modes never call this.
 * Callers re-quote at checkout commitment and never accept a client fee;
 * the business delivery radius is enforced separately by the caller.
 */
export interface GeoDeliveryPort {
  quoteDeliveryFee(
    input: {
      cityId: string;
      destination: GeoPointInput;
      origin: GeoPointInput;
    },
    tx?: TxContext,
  ): Promise<DeliveryQuote>;
}
