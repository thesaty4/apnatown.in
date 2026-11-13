import { Inject, Injectable } from '@nestjs/common';
import {
  BusinessPublicServicesResponseSchema,
  type BusinessPublicServicesQuery,
  type BusinessPublicServicesResponse,
} from '@apnatown/shared';
import type { ExploreCard } from '@apnatown/shared/search';
import { DomainError } from '../../../shared/errors/errors';
import {
  decodeBusinessListingCursor,
  encodeBusinessListingCursor,
  type BusinessListingKeys,
} from '../../../shared/pagination/business-listing-cursor';
import { CURSOR_CODEC, CursorCodec, type CursorBinding } from '../../../shared/pagination/cursor';

export const SERVICE_BUSINESS_PUBLIC = Symbol('SERVICE_BUSINESS_PUBLIC');
export interface ServiceBusinessPublicPort {
  /** Null when the slug is not an approved public business. */
  page(input: {
    slug: string;
    categorySlug: string | null;
    subcategorySlug: string | null;
    after: BusinessListingKeys | null;
    limit: number;
  }): Promise<(Omit<BusinessPublicServicesResponse, 'items' | 'nextCursor'>
    & { items: ExploreCard[]; next: BusinessListingKeys | null }) | null>;
}

/** Services tab of a public business profile (F-PF-004, F-SV-001). */
@Injectable()
export class ServiceBusinessPublicService {
  constructor(
    @Inject(SERVICE_BUSINESS_PUBLIC) private readonly services: ServiceBusinessPublicPort,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
  ) {}

  async list(slug: string, query: BusinessPublicServicesQuery): Promise<BusinessPublicServicesResponse> {
    const categorySlug = query.category ?? null;
    const subcategorySlug = query.subcategory ?? null;
    const binding: CursorBinding = {
      operation: 'services.business-public', sort: 'featured-name-id',
      filters: { category: categorySlug, subcategory: subcategorySlug }, scope: { slug },
    };
    const after = decodeBusinessListingCursor(this.cursors, query.cursor, binding);
    const result = await this.services.page({ slug, categorySlug, subcategorySlug, after, limit: query.limit });
    if (!result) throw new DomainError('COMMON_NOT_FOUND');
    return BusinessPublicServicesResponseSchema.parse({
      items: result.items,
      nextCursor: encodeBusinessListingCursor(this.cursors, result.next, binding),
      categories: result.categories,
      subcategories: result.subcategories,
    });
  }
}
