import { Inject, Injectable } from '@nestjs/common';
import type { BusinessKind } from '@apnatown/shared/businesses';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  CatalogBusinessContextPort,
  SuggesterContext,
} from '../../catalog/application/catalog-ports';
import {
  BUSINESS_REPOSITORY,
  ROLE_FOR_KIND,
  type BusinessRepository,
} from '../domain/business';
import { BusinessOwnerContext } from './business-owner-context';

const SUGGEST_STATUSES = new Set([
  'draft',
  'pending',
  'rejected',
  'changes_requested',
  'approved',
]);

/**
 * Businesses-owned `business.taxonomy-suggest` policy bound to Catalog's
 * CATALOG_BUSINESS_CONTEXT port. Ownership, editability and area come from
 * the stored business; an approved business also needs its live seller role.
 * The capability never authorizes Products, checkout or seller orders.
 */
@Injectable()
export class CatalogBusinessContextAdapter implements CatalogBusinessContextPort {
  constructor(
    private readonly owners: BusinessOwnerContext,
    @Inject(BUSINESS_REPOSITORY)
    private readonly businesses: BusinessRepository,
  ) {}

  async resolveSuggester(
    tx: TxContext,
    input: { userId: string; businessKind?: BusinessKind },
  ): Promise<SuggesterContext> {
    let business;
    try {
      business = await this.owners.resolve(tx, {
        userId: input.userId,
        ...(input.businessKind ? { kind: input.businessKind } : {}),
      });
    } catch (error) {
      if (
        error instanceof DomainError &&
        (error.code === 'BUSINESS_NOT_FOUND' ||
          error.code === 'BUSINESS_NOT_OWNED')
      )
        throw new DomainError('COMMON_FORBIDDEN');
      throw error;
    }
    if (
      !SUGGEST_STATUSES.has(business.status) ||
      !business.cityId ||
      !business.areaId ||
      (business.status === 'approved' &&
        !(await this.owners.sellerRole(tx, business)))
    )
      throw new DomainError('COMMON_FORBIDDEN');
    return {
      businessId: business.id,
      cityId: business.cityId,
      areaId: business.areaId,
    };
  }

  async audienceRole(
    tx: TxContext,
    businessId: string,
  ): Promise<'vendor' | 'provider'> {
    const business = await this.businesses.find(tx, businessId);
    if (!business) throw new DomainError('BUSINESS_NOT_FOUND');
    return ROLE_FOR_KIND[business.kind];
  }
}
