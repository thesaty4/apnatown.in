import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../shared/errors/errors';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
  type TxContext,
} from '../../../shared/persistence/ports';
import {
  GEO_SCOPE_REPOSITORY,
  type GeoScopeRepository,
} from '../domain/geo-scope.repository';
import type { GeoScopePort } from './geo-scope.port';

@Injectable()
export class GeoScopeService implements GeoScopePort {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(GEO_SCOPE_REPOSITORY) private readonly scopes: GeoScopeRepository,
  ) {}

  assertAreasInCity(
    input: { cityId: string; areaIds: readonly string[] },
    tx?: TxContext,
  ) {
    const validate = async (transaction: TxContext) => {
      if (!(await this.scopes.lockCity(transaction, input.cityId)))
        throw new DomainError('CITY_NOT_FOUND');
      const ids = [...new Set(input.areaIds)].sort();
      if (
        ids.length &&
        (await this.scopes.lockAreas(transaction, input.cityId, ids)).length !==
          ids.length
      )
        throw new DomainError('AREA_NOT_FOUND');
    };
    return tx ? validate(tx) : this.uow.run(validate);
  }
}
