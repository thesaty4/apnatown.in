import type { AreaRef, CityRef } from '@apnatown/shared/admin';
import type { TxContext } from '../../../shared/persistence/ports';

export const GEO_SCOPE = Symbol('GEO_SCOPE');
/** Authoritative read-validation capability; no zone/centroid-derived authority. */
export interface GeoScopePort {
  /** Also validates the city when areaIds is empty. Locks references when joining a UoW. */
  assertAreasInCity(
    input: { cityId: string; areaIds: readonly string[] },
    tx?: TxContext,
  ): Promise<void>;
  /** Existing areas among `areaIds` (any city), share-locked inside a UoW. */
  describeAreas(areaIds: readonly string[], tx?: TxContext): Promise<AreaRef[]>;
  describeCities(
    cityIds: readonly string[],
    tx?: TxContext,
  ): Promise<CityRef[]>;
}
