import type { CityStatus } from '@apnatown/shared/geo';

export const GEO_READ_REPOSITORY = Symbol('GEO_READ_REPOSITORY');

export interface GeoCity {
  readonly id: string;
  readonly slug: string;
  readonly nameEn: string;
  readonly nameHi: string;
  readonly status: CityStatus;
}

export interface GeoArea {
  readonly id: string;
  readonly cityId: string;
  readonly slug: string;
  readonly nameEn: string;
  readonly nameHi: string;
  readonly pinCode: string | null;
}

export interface CityPosition {
  readonly status: CityStatus;
  readonly nameEn: string;
  readonly id: string;
}

export interface AreaPosition {
  readonly nameEn: string;
  readonly id: string;
}

export interface AreaFilters {
  readonly cityId: string;
  readonly query: string;
  readonly pinCode: string | null;
}

export interface GeoReadRepository {
  listCities(input: {
    limit: number;
    after?: CityPosition;
  }): Promise<readonly GeoCity[]>;
  findCity(id: string): Promise<GeoCity | null>;
  listAreas(
    input: AreaFilters & {
      limit: number;
      after?: AreaPosition;
    },
  ): Promise<readonly GeoArea[]>;
}
