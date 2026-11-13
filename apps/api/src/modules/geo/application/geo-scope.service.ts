import { Inject, Injectable } from '@nestjs/common';
import type { AreaRef, CityRef } from '@apnatown/shared/admin';
import { IdSchema } from '@apnatown/shared/wire';
import { DomainError } from '../../../shared/errors/errors';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
  type TxContext,
} from '../../../shared/persistence/ports';
import {
  GEO_LOCATION_REPOSITORY,
  type GeoLocationRepository,
} from '../domain/geo-location.repository';
import {
  GEO_SCOPE_REPOSITORY,
  type GeoScopeRepository,
} from '../domain/geo-scope.repository';
import type { GeoScopePort, ResolvedScope } from './geo-scope.port';
import type { GeoTaxPort } from './geo-tax.port';

@Injectable()
export class GeoScopeService implements GeoScopePort, GeoTaxPort {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(GEO_SCOPE_REPOSITORY) private readonly scopes: GeoScopeRepository,
    @Inject(GEO_LOCATION_REPOSITORY)
    private readonly locations: GeoLocationRepository,
  ) {}

  resolve(
    input: { areaId: string; location?: { lat: number; lng: number } },
    tx?: TxContext,
  ): Promise<ResolvedScope> {
    const read = async (transaction: TxContext): Promise<ResolvedScope> => {
      const area = IdSchema.safeParse(input.areaId).success
        ? await this.locations.findArea(transaction, input.areaId)
        : null;
      if (!area) throw new DomainError('AREA_NOT_FOUND');
      const city = await this.locations.cityFiscal(transaction, area.cityId);
      if (!city) throw new DomainError('CITY_NOT_FOUND');
      const zone = input.location
        ? (
            await this.locations.zonesAt(
              transaction,
              input.location,
              area.cityId,
            )
          ).find((hit) => hit.status === 'active')
        : undefined;
      return {
        cityId: area.cityId,
        areaId: area.id,
        cityStatus: city.status,
        ...(zone ? { zoneId: zone.id } : {}),
      };
    };
    return tx ? read(tx) : this.uow.run(read);
  }

  stateForCity(
    input: { cityId: string },
    tx?: TxContext,
  ): Promise<{ stateCode: string; cityVersion: number }> {
    const read = async (transaction: TxContext) => {
      const city = IdSchema.safeParse(input.cityId).success
        ? await this.locations.cityFiscal(transaction, input.cityId)
        : null;
      if (!city) throw new DomainError('CITY_NOT_FOUND');
      return { stateCode: city.stateCode, cityVersion: city.version };
    };
    return tx ? read(tx) : this.uow.run(read);
  }

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

  describeAreas(
    areaIds: readonly string[],
    tx?: TxContext,
  ): Promise<AreaRef[]> {
    const ids = [...new Set(areaIds)].sort();
    if (!ids.length) return Promise.resolve([]);
    const read = (transaction: TxContext) =>
      this.scopes.findAreas(transaction, ids);
    return tx ? read(tx) : this.uow.run(read);
  }

  describeCities(
    cityIds: readonly string[],
    tx?: TxContext,
  ): Promise<CityRef[]> {
    const ids = [...new Set(cityIds)].sort();
    if (!ids.length) return Promise.resolve([]);
    const read = (transaction: TxContext) =>
      this.scopes.findCities(transaction, ids);
    return tx ? read(tx) : this.uow.run(read);
  }
}
