import { Inject, Injectable } from '@nestjs/common';
import {
  BusinessPublicProductsResponseSchema,
  type BusinessPublicProductPill,
  type BusinessPublicProductsQuery,
  type BusinessPublicProductsResponse,
} from '@apnatown/shared';
import type { ExploreCard } from '@apnatown/shared/search';
import { DomainError } from '../../../shared/errors/errors';
import {
  decodeBusinessListingCursor,
  encodeBusinessListingCursor,
  type BusinessListingKeys,
} from '../../../shared/pagination/business-listing-cursor';
import { CURSOR_CODEC, CursorCodec, type CursorBinding } from '../../../shared/pagination/cursor';

export const PRODUCT_BUSINESS_PUBLIC = Symbol('PRODUCT_BUSINESS_PUBLIC');
export interface ProductBusinessPublicPort {
  /** Null when the slug is not an approved public business. */
  page(input: {
    slug: string;
    subcategorySlug: string | null;
    after: BusinessListingKeys | null;
    limit: number;
  }): Promise<{ items: ExploreCard[]; next: BusinessListingKeys | null; pills: BusinessPublicProductPill[] } | null>;
}

/** Products tab of a public business profile (F-PF-004; S-CUST-06/07). */
@Injectable()
export class ProductBusinessPublicService {
  constructor(
    @Inject(PRODUCT_BUSINESS_PUBLIC) private readonly products: ProductBusinessPublicPort,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
  ) {}

  async list(slug: string, query: BusinessPublicProductsQuery): Promise<BusinessPublicProductsResponse> {
    const subcategorySlug = query.subcategory ?? null;
    const binding: CursorBinding = {
      operation: 'products.business-public', sort: 'featured-name-id',
      filters: { subcategory: subcategorySlug }, scope: { slug },
    };
    const after = decodeBusinessListingCursor(this.cursors, query.cursor, binding);
    const result = await this.products.page({ slug, subcategorySlug, after, limit: query.limit });
    if (!result) throw new DomainError('PRODUCT_NOT_FOUND');
    return BusinessPublicProductsResponseSchema.parse({
      items: result.items,
      nextCursor: encodeBusinessListingCursor(this.cursors, result.next, binding),
      pills: result.pills,
    });
  }
}
