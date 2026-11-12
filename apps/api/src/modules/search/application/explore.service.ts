import { Inject, Injectable } from '@nestjs/common';
import type { BusinessKind } from '@apnatown/shared/businesses';
import type {
  ExploreCard,
  ExploreQuery,
  ExploreResponse,
} from '@apnatown/shared/search';
import { IdSchema, TimestampSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import { DomainError } from '../../../shared/errors/errors';
import {
  CURSOR_CODEC,
  CursorCodec,
  type CursorBinding,
} from '../../../shared/pagination/cursor';
import {
  BUSINESS_DISCOVERY,
  type BusinessDiscovery,
} from '../../businesses/application/business-discovery';
import {
  CATALOG_READ,
  type CatalogReadPort,
} from '../../catalog/application/catalog-ports';

const positionSchema = z.tuple([TimestampSchema, IdSchema]);
const KIND_FOR_TAB = { shops: 'shop', services: 'provider' } as const;

/**
 * S-CUST-02 Explore over approved businesses: Shops = shop listings filtered
 * by business category, Services = provider businesses with the same category
 * memberships. Service-listing taxonomy waits for the Services module.
 */
@Injectable()
export class ExploreService {
  constructor(
    @Inject(BUSINESS_DISCOVERY) private readonly businesses: BusinessDiscovery,
    @Inject(CATALOG_READ) private readonly catalog: CatalogReadPort,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
  ) {}

  async explore(query: ExploreQuery): Promise<ExploreResponse> {
    const verified = query.verified === 'true';
    const { categories } = await this.catalog.taxonomy({
      kind: 'product',
      activeOnly: true,
    });
    const category = query.category
      ? categories.find((item) => item.slug === query.category)
      : undefined;
    if (query.category && !category)
      throw new DomainError('SEARCH_FILTER_INVALID', { field: 'category' });
    if (query.tab === 'services' && query.sort === 'newest')
      throw new DomainError('SEARCH_FILTER_INVALID', { field: 'sort' });
    if (query.tab === 'products' && verified)
      throw new DomainError('SEARCH_FILTER_INVALID', { field: 'verified' });
    const binding: CursorBinding = {
      operation: 'search.explore',
      sort: query.sort,
      filters: { tab: query.tab, category: query.category ?? null, verified },
      scope: null,
    };
    const after = query.cursor
      ? this.position(query.cursor, binding)
      : undefined;
    if (query.tab === 'products') {
      const counts = await this.counts();
      return { tab: query.tab, counts, items: [], nextCursor: null };
    }

    const kind: BusinessKind = KIND_FOR_TAB[query.tab];
    const filter = {
      kind,
      ...(category ? { categoryId: category.id } : {}),
      ...(verified ? { verified } : {}),
    };
    const [rows, active, counts] = await Promise.all([
      this.businesses.page({
        ...filter,
        newest: query.sort === 'newest',
        ...(after ? { after } : {}),
        limit: query.limit,
      }),
      this.businesses.count(filter),
      this.counts(),
    ]);
    const visible = rows.slice(0, query.limit);
    const byId = new Map(categories.map((item) => [item.id, item]));
    const items: ExploreCard[] = visible.map((row) => {
      const primary = row.categoryId ? byId.get(row.categoryId) : undefined;
      return {
        id: row.id,
        kind: row.kind,
        nameEn: row.nameEn,
        nameHi: row.nameHi,
        slug: row.slug,
        verified: row.verified,
        category: primary
          ? {
              slug: primary.slug,
              nameEn: primary.nameEn,
              nameHi: primary.nameHi,
            }
          : null,
        area: row.areaNameEn
          ? { nameEn: row.areaNameEn, nameHi: row.areaNameHi }
          : null,
      };
    });
    const last = visible.at(-1);
    return {
      tab: query.tab,
      counts: { ...counts, [query.tab]: active },
      items,
      nextCursor:
        rows.length > query.limit && last
          ? this.cursors.encode(binding, [last.createdAt, last.id])
          : null,
    };
  }

  private async counts() {
    const [shops, services] = await Promise.all([
      this.businesses.count({ kind: 'shop' }),
      this.businesses.count({ kind: 'provider' }),
    ]);
    return { products: 0, shops, services };
  }

  private position(cursor: string, binding: CursorBinding): [string, string] {
    const parsed = positionSchema.safeParse(
      this.cursors.decode(cursor, binding),
    );
    if (!parsed.success)
      throw new DomainError('VALIDATION_ERROR', { field: 'cursor' });
    return parsed.data;
  }
}
