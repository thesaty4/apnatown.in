import { Inject, Injectable } from '@nestjs/common';
import {
  SERVICE_STATUS_TRANSITIONS,
  ServiceOwnerSchema,
  servicePriceViolation,
  type ServiceOwner,
  type ServiceOwnerCreate,
  type ServiceOwnerPatch,
  type ServicePriceShape,
} from '@apnatown/shared/services';
import { DomainError } from '../../../shared/errors/errors';
import {
  capabilities,
  type StoredBusiness,
} from '../../businesses/domain/business';
import {
  CATALOG_READ,
  type CatalogReadPort,
} from '../../catalog/application/catalog-ports';
import type {
  ServiceFields,
  StoredService,
  StoredServiceMedia,
} from './service-owner-ports';

/** Owner listing DTO; `entitled` is Payments' current Premium entitlement. */
export function serviceOwnerDto(
  row: StoredService,
  business: StoredBusiness,
  entitled: boolean,
): ServiceOwner {
  // Effective featuring is derived at read time and never stored (rule 9).
  const featured =
    row.featuredSelected &&
    entitled &&
    row.status === 'active' &&
    capabilities(business, false).publicProfile;
  return ServiceOwnerSchema.parse({
    id: row.id,
    slug: row.slug,
    categoryId: row.categoryId,
    subcategoryId: row.subcategoryId,
    nameEn: row.nameEn,
    nameHi: row.nameHi,
    description: row.description,
    priceType: row.priceType,
    priceFromPaise: row.priceFromPaise,
    priceToPaise: row.priceToPaise,
    unit: row.unit,
    included: row.included,
    excluded: row.excluded,
    serviceArea: row.serviceArea,
    experienceYears: row.experienceYears,
    media: row.media,
    galleryVisible: row.galleryVisible,
    featuredSelected: row.featuredSelected,
    featured,
    status: row.status,
    allowedStatuses: SERVICE_STATUS_TRANSITIONS[row.status],
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

/** Create defaults: status active, unselected featuring (spec). */
export function createFields(
  input: ServiceOwnerCreate,
): Omit<ServiceFields, 'media' | 'galleryVisible'> {
  return {
    categoryId: input.categoryId,
    subcategoryId: input.subcategoryId,
    nameEn: input.nameEn,
    nameHi: input.nameHi ?? null,
    description: input.description ?? null,
    priceType: input.priceType,
    priceFromPaise: input.priceFromPaise ?? null,
    priceToPaise: input.priceToPaise ?? null,
    unit: input.unit ?? null,
    included: input.included ?? [],
    excluded: input.excluded ?? [],
    serviceArea: input.serviceArea ?? null,
    featuredSelected: input.featuredSelected ?? false,
    status: input.status ?? 'active',
  };
}

/** PATCH merge: omitted keeps the current value; `null` clears it. */
export function mergeFields(
  current: StoredService,
  input: ServiceOwnerPatch,
  media: StoredServiceMedia[],
): ServiceFields {
  const pick = <K extends keyof ServiceFields>(key: K): ServiceFields[K] => {
    const value = (input as Partial<ServiceFields>)[key];
    return value === undefined ? current[key] : value;
  };
  return {
    categoryId: pick('categoryId'),
    subcategoryId: pick('subcategoryId'),
    nameEn: pick('nameEn'),
    nameHi: pick('nameHi'),
    description: pick('description'),
    priceType: pick('priceType'),
    priceFromPaise: pick('priceFromPaise'),
    priceToPaise: pick('priceToPaise'),
    unit: pick('unit'),
    included: pick('included'),
    excluded: pick('excluded'),
    serviceArea: pick('serviceArea'),
    media,
    galleryVisible: pick('galleryVisible'),
    featuredSelected: pick('featuredSelected'),
    status: pick('status'),
  };
}

/** Price-type amounts as integer paise (rule 3); SERVICES_INVALID otherwise. */
export function assertServicePrice(price: ServicePriceShape): void {
  const field = servicePriceViolation(price);
  if (field) throw new DomainError('SERVICES_INVALID', { field });
}

/** Catalog taxonomy validation for a service's single subcategory (BR-08). */
@Injectable()
export class ServiceTaxonomyPolicy {
  constructor(@Inject(CATALOG_READ) private readonly catalog: CatalogReadPort) {}

  /**
   * The category must be an active service-kind category
   * (SERVICES_INVALID) and the subcategory active under it
   * (SERVICES_SUBCATEGORY_REQUIRED).
   */
  async assert(categoryId: string, subcategoryId: string): Promise<void> {
    const taxonomy = await this.catalog.taxonomy({
      categoryIds: [categoryId],
      subcategoryIds: [subcategoryId],
      kind: 'service',
      activeOnly: true,
    });
    const category = taxonomy.categories.find(
      (row) => row.id === categoryId && row.active && row.kind === 'service',
    );
    if (!category)
      throw new DomainError('SERVICES_INVALID', { field: 'categoryId' });
    const subcategory = taxonomy.subcategories.find(
      (row) =>
        row.id === subcategoryId && row.active && row.categoryId === categoryId,
    );
    if (!subcategory)
      throw new DomainError('SERVICES_SUBCATEGORY_REQUIRED', {
        field: 'subcategoryId',
      });
  }
}
