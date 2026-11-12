import type { CityStatus, ZoneStatus } from '@apnatown/shared/geo';
import type { TxContext } from '../../../shared/persistence/ports';
import type { GeoArea, GeoCity } from './geo-read.repository';

export const GEO_LOCATION_REPOSITORY = Symbol('GEO_LOCATION_REPOSITORY');

/** WGS84 point; used for one query only and never persisted or logged. */
export interface GeoPoint {
  readonly lat: number;
  readonly lng: number;
}

export interface ZoneHit {
  readonly id: string;
  readonly cityId: string;
  readonly name: string;
  readonly status: ZoneStatus;
  readonly version: number;
}

export interface StoredFeeSlab {
  readonly upperDistanceKm: number;
  readonly feePaise: number;
}

export interface CityFiscal {
  readonly status: CityStatus;
  readonly stateCode: string;
  readonly version: number;
}

/** Public resolve, waitlist intake and internal quote/tax reads. */
export interface GeoLocationRepository {
  findCity(tx: TxContext, id: string): Promise<GeoCity | null>;
  /** City status/state code/version, share-locked for the caller's UoW. */
  cityFiscal(tx: TxContext, id: string): Promise<CityFiscal | null>;
  findArea(tx: TxContext, id: string): Promise<GeoArea | null>;
  /** Areas with this PIN, optionally within one city (bounded). */
  areasByPin(
    tx: TxContext,
    pinCode: string,
    cityId: string | null,
  ): Promise<readonly GeoArea[]>;
  /** Zones (any status) whose polygon covers the point, optionally per city. */
  zonesAt(
    tx: TxContext,
    point: GeoPoint,
    cityId: string | null,
  ): Promise<readonly ZoneHit[]>;
  feeSlabs(tx: TxContext, zoneId: string): Promise<readonly StoredFeeSlab[]>;
  /** Straight-line (geodesic) distance in kilometres. */
  distanceKm(tx: TxContext, from: GeoPoint, to: GeoPoint): Promise<number>;
  insertWaitlist(
    tx: TxContext,
    input: {
      id: string;
      cityId: string | null;
      phoneCiphertext: string;
      phoneLookupHash: Uint8Array;
      at: Date;
    },
  ): Promise<void>;
}
