import { Inject, Injectable } from '@nestjs/common';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import {
  BUSINESS_REPOSITORY,
  type BusinessRepository,
  type DiscoveryFilter,
  type DiscoveryRow,
} from '../domain/business';

/** Public Explore listing read (approved, named, active-owner businesses). */
export const BUSINESS_DISCOVERY = Symbol('BUSINESS_DISCOVERY');
export interface BusinessDiscovery {
  page(
    input: DiscoveryFilter & {
      newest: boolean;
      after?: [string, string];
      limit: number;
    },
  ): Promise<DiscoveryRow[]>;
  count(input: DiscoveryFilter): Promise<number>;
}

@Injectable()
export class BusinessDiscoveryService implements BusinessDiscovery {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(BUSINESS_REPOSITORY)
    private readonly businesses: BusinessRepository,
  ) {}

  page(input: Parameters<BusinessDiscovery['page']>[0]) {
    return this.uow.run((tx) => this.businesses.discoveryPage(tx, input));
  }

  count(input: DiscoveryFilter) {
    return this.uow.run((tx) => this.businesses.discoveryCount(tx, input));
  }
}
