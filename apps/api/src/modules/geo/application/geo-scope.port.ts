import type { AreaRef, CityRef } from '@apnatown/shared/admin';
import type { CityStatus } from '@apnatown/shared/geo';
import type { TxContext } from '../../../shared/persistence/ports';

export const GEO_SCOPE = Symbol('GEO_SCOPE');
export interface ResolvedScope {
  readonly cityId: string;
  readonly areaId: string;
  readonly cityStatus: CityStatus;
  /** Active zone covering `location`; area and zone IDs are not interchangeable. */
  readonly zoneId?: string;
}
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
  /**
   * Validates an area (AREA_NOT_FOUND) and, given a point, the active zone
   * in the area's city that covers it. The point is never stored or logged.
   */
  resolve(
    input: { areaId: string; location?: { lat: number; lng: number } },
    tx?: TxContext,
  ): Promise<ResolvedScope>;
}
