import type { CityStatus, FeeSlab, ZoneStatus } from '@apnatown/shared/geo';
import type { TxContext } from '../../../shared/persistence/ports';
import type { GeoArea } from './geo-read.repository';

export const GEO_ADMIN_REPOSITORY = Symbol('GEO_ADMIN_REPOSITORY');

export interface StoredCity {
  readonly id: string;
  readonly slug: string;
  readonly nameEn: string;
  readonly nameHi: string;
  readonly stateCode: string;
  readonly status: CityStatus;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly areaCount: number;
  readonly zoneCount: number;
  readonly waitlistCount: number;
}

export interface StoredZone {
  readonly id: string;
  readonly cityId: string;
  readonly name: string;
  readonly status: ZoneStatus;
  readonly version: number;
  /** ST_AsGeoJSON text of the stored polygon. */
  readonly polygon: string;
  readonly feeSlabs: readonly FeeSlab[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ZoneWrite {
  readonly name: string;
  readonly status: ZoneStatus;
  /** Canonical GeoJSON text (already validated by `checkPolygon`). */
  readonly polygon: string;
}

export type PolygonCheck = 'ok' | 'invalid';

export interface CityCursor {
  readonly status: CityStatus;
  readonly nameEn: string;
  readonly id: string;
}
export interface NamedCursor {
  readonly name: string;
  readonly id: string;
}

export interface CityOption {
  readonly id: string;
  readonly nameEn: string;
  readonly nameHi: string;
  readonly status: CityStatus;
  readonly version: number;
}
export interface AreaOption {
  readonly id: string;
  readonly cityId: string;
  readonly nameEn: string;
  readonly nameHi: string;
}
export interface ZoneOption {
  readonly id: string;
  readonly cityId: string;
  readonly name: string;
  readonly status: ZoneStatus;
  readonly version: number;
}
/** Visibility filter; `null` = platform-wide (super admin). */
export type OptionVisibility = {
  readonly cityIds: readonly string[];
  readonly areaIds: readonly string[];
} | null;

/** Super-admin city/zone storage plus scoped admin option reads. */
export interface GeoAdminRepository {
  listCities(
    tx: TxContext,
    input: { limit: number; after?: CityCursor },
  ): Promise<readonly StoredCity[]>;
  /** With `lock`, row-locks the city (serializes zone overlap checks). */
  findCity(
    tx: TxContext,
    id: string,
    lock?: boolean,
  ): Promise<StoredCity | null>;
  /** Returns null when the slug is already taken (no write). */
  insertCity(
    tx: TxContext,
    input: {
      id: string;
      slug: string;
      nameEn: string;
      nameHi: string;
      stateCode: string;
      status: CityStatus;
      at: Date;
    },
  ): Promise<boolean>;
  /** Version-guarded update; false when the version moved. */
  updateCity(
    tx: TxContext,
    input: {
      id: string;
      expectedVersion: number;
      status?: CityStatus;
      stateCode?: string;
      at: Date;
    },
  ): Promise<boolean>;
  cityAreas(
    tx: TxContext,
    cityId: string,
    limit: number,
  ): Promise<readonly GeoArea[]>;
  cityZones(
    tx: TxContext,
    cityId: string,
    limit: number,
  ): Promise<readonly StoredZone[]>;
  findZone(
    tx: TxContext,
    id: string,
    lock?: boolean,
  ): Promise<StoredZone | null>;
  /** PostGIS validity of a GeoJSON polygon (valid, non-empty, POLYGON). */
  checkPolygon(tx: TxContext, geoJson: string): Promise<PolygonCheck>;
  /** True when the polygon intersects another active zone in the city. */
  overlapsActiveZone(
    tx: TxContext,
    input: { cityId: string; geoJson: string; excludeZoneId: string | null },
  ): Promise<boolean>;
  insertZone(
    tx: TxContext,
    input: ZoneWrite & { id: string; cityId: string; at: Date },
  ): Promise<void>;
  updateZone(
    tx: TxContext,
    input: Partial<ZoneWrite> & {
      id: string;
      expectedVersion: number;
      at: Date;
    },
  ): Promise<boolean>;
  replaceFeeSlabs(
    tx: TxContext,
    zoneId: string,
    slabs: readonly FeeSlab[],
    at: Date,
  ): Promise<void>;
  /** Version-guarded delete (slabs cascade); false when the version moved. */
  deleteZone(
    tx: TxContext,
    input: { id: string; expectedVersion: number },
  ): Promise<boolean>;

  // Scoped admin reads (GeoAdminReadPort).
  cityOptions(
    tx: TxContext,
    input: {
      visibility: OptionVisibility;
      q: string;
      limit: number;
      after?: NamedCursor;
    },
  ): Promise<readonly CityOption[]>;
  areaOptions(
    tx: TxContext,
    input: {
      visibility: OptionVisibility;
      cityId: string | null;
      q: string;
      limit: number;
      after?: NamedCursor;
    },
  ): Promise<readonly AreaOption[]>;
  zoneOptions(
    tx: TxContext,
    input: {
      /** Whole-city grants only; null = platform-wide. */
      cityIds: readonly string[] | null;
      cityId: string | null;
      q: string;
      limit: number;
      after?: NamedCursor;
    },
  ): Promise<readonly ZoneOption[]>;
  zonesByIds(
    tx: TxContext,
    ids: readonly string[],
  ): Promise<readonly ZoneOption[]>;
  zonesInCities(
    tx: TxContext,
    cityIds: readonly string[],
  ): Promise<readonly ZoneOption[]>;
  summary(
    tx: TxContext,
  ): Promise<{ enabledCities: number; waitlistSignups: number }>;
}
