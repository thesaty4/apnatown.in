import type { CityStatus, ZoneStatus } from '@apnatown/shared/geo';
import type { AdminReadContext } from '../../../shared/auth/ports';
import type { TxContext } from '../../../shared/persistence/ports';

export const GEO_ADMIN_READ = Symbol('GEO_ADMIN_READ');
export type GeoScopeOption =
  | {
      readonly kind: 'city';
      readonly id: string;
      readonly nameEn: string;
      readonly nameHi: string;
      readonly status: CityStatus;
      readonly version: number;
    }
  | {
      readonly kind: 'area';
      readonly id: string;
      readonly cityId: string;
      readonly nameEn: string;
      readonly nameHi: string;
    }
  | {
      readonly kind: 'zone';
      readonly id: string;
      readonly cityId: string;
      readonly name: string;
      readonly status: ZoneStatus;
      readonly version: number;
    };
export interface GeoOptionPage {
  readonly items: readonly GeoScopeOption[];
  readonly nextCursor: string | null;
}
export interface ZoneScope {
  readonly id: string;
  readonly cityId: string;
  /**
   * Authoritative area relationships only. No zone-area mapping source is
   * supplied (open question), so this is always empty and the zone is
   * listed in `unresolved`; never inferred from centroids/PINs/same city.
   */
  readonly areaIds: readonly string[];
  readonly version: number;
}
export interface ZoneRef {
  readonly id: string;
  readonly cityId: string;
  readonly name: string;
}

/** Scoped geo reads for Admin; choices never grant authority. */
export interface GeoAdminReadPort {
  /**
   * Super admins see all; otherwise cities = whole-city grants plus cities of
   * granted areas, areas = granted areas plus areas of whole-city grants,
   * zones = zones of whole-city grants only. Limit <= 50.
   */
  options(
    ctx: AdminReadContext,
    input: {
      kind: 'city' | 'area' | 'zone';
      cityId?: string;
      q?: string;
      cursor?: string;
      limit?: number;
    },
  ): Promise<GeoOptionPage>;
  /** super_admin only (COMMON_FORBIDDEN otherwise). */
  summary(
    ctx: AdminReadContext,
  ): Promise<{ enabledCities: number; waitlistSignups: number }>;
  /** Unknown zone IDs are omitted from `zones`; `revision` hashes the result. */
  resolveZoneScope(
    input: { zoneIds: readonly string[] },
    tx?: TxContext,
  ): Promise<{
    zones: readonly ZoneScope[];
    revision: string;
    unresolved: readonly string[];
  }>;
  /** Zones located in the given cities (whole-city authority only). */
  zonesInCities(
    cityIds: readonly string[],
    tx?: TxContext,
  ): Promise<readonly ZoneRef[]>;
}
