import type { AreaRef, CityRef } from '@apnatown/shared/admin';
import type { TxContext } from '../../../shared/persistence/ports';

export const GEO_SCOPE_REPOSITORY = Symbol('GEO_SCOPE_REPOSITORY');
export interface GeoScopeRepository {
  lockCity(tx: TxContext, cityId: string): Promise<boolean>;
  lockAreas(
    tx: TxContext,
    cityId: string,
    areaIds: readonly string[],
  ): Promise<string[]>;
  findAreas(tx: TxContext, areaIds: readonly string[]): Promise<AreaRef[]>;
  findCities(tx: TxContext, cityIds: readonly string[]): Promise<CityRef[]>;
}
