import type { TxContext } from '../../../shared/persistence/ports';

export const GEO_SCOPE_REPOSITORY = Symbol('GEO_SCOPE_REPOSITORY');
export interface GeoScopeRepository {
  lockCity(tx: TxContext, cityId: string): Promise<boolean>;
  lockAreas(
    tx: TxContext,
    cityId: string,
    areaIds: readonly string[],
  ): Promise<string[]>;
}
