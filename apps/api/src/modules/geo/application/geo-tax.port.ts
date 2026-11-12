import type { TxContext } from '../../../shared/persistence/ports';

export const GEO_TAX = Symbol('GEO_TAX');
/**
 * Fiscal destination of the authoritative address city. Callers never
 * infer the state from client locale, phone or IP.
 */
export interface GeoTaxPort {
  /** CITY_NOT_FOUND for an unknown city; share-locks it inside a UoW. */
  stateForCity(
    input: { cityId: string },
    tx?: TxContext,
  ): Promise<{ stateCode: string; cityVersion: number }>;
}
