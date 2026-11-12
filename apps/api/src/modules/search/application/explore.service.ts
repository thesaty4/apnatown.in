import { Inject, Injectable } from '@nestjs/common';
import type { DiscoveryLocation, ExploreQuery, ExploreResponse } from '@apnatown/shared/search';
import { canonicalJson } from '@apnatown/shared';
import { IdSchema, TimestampSchema } from '@apnatown/shared/wire';
import { DomainError } from '../../../shared/errors/errors';
import { CURSOR_CODEC, CursorCodec, type CursorBinding } from '../../../shared/pagination/cursor';
import { CATALOG_READ, type CatalogReadPort } from '../../catalog/application/catalog-ports';
import { EXPLORE_REPOSITORY, type ExploreRepository } from './explore.repository';
import { normalizeExplore } from './explore-normalization';

@Injectable()
export class ExploreService {
  constructor(
    @Inject(EXPLORE_REPOSITORY) private readonly repository: ExploreRepository,
    @Inject(CATALOG_READ) private readonly catalog: CatalogReadPort,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
  ) {}

  explore(query: ExploreQuery, location: DiscoveryLocation | null = null): Promise<ExploreResponse> {
    return this.repository.snapshot(async (snapshot) => {
      const context = await snapshot.context(query, location);
      const normalized = normalizeExplore(query, context);
      const keywords = query.q
        ? await this.catalog.resolveKeywords({ normalizedQuery: query.q }, snapshot.tx) : null;
      const revision = await snapshot.revision();
      const selection = { ...normalized, location: context.location, keywords };
      const binding: CursorBinding = {
        operation: 'search.explore.v2', sort: query.sort,
        // canonicalJson removes undefined properties and fixes key order.
        filters: JSON.parse(canonicalJson(normalized.filters)),
        scope: { location: context.location, revision, keywords: keywords?.revision ?? null },
      };
      let asOf = context.asOf;
      let after: string[] | undefined;
      if (query.cursor) {
        const keys = this.cursors.decode(query.cursor, binding);
        if (!keys.every((key) => typeof key === 'string') || !TimestampSchema.safeParse(keys[0]).success
          || !IdSchema.safeParse(keys.at(-1)).success) throw new DomainError('COMMON_VALIDATION_FAILED');
        asOf = String(keys[0]);
        const age = Date.parse(context.asOf) - Date.parse(asOf);
        if (age < 0 || age > 15 * 60_000) throw new DomainError('COMMON_VALIDATION_FAILED');
        after = keys.slice(1) as string[];
      }
      const rows = await snapshot.page(selection, query.limit, after);
      const counts = await snapshot.counts(selection);
      const facets = await snapshot.facets(selection);
      const visible = rows.slice(0, query.limit);
      const last = visible.at(-1);
      const mapPins = [...new Map(visible.flatMap((row) => row.pin ? [[row.pin.businessId, row.pin] as const] : [])).values()];
      const relatedIds = new Set(context.relations.filter((r) =>
        context.categories.find((c) => c.slug === query.contextCategory)?.id === r.sourceId).map((r) => r.targetId));
      return {
        tab: query.tab, normalizedFilters: normalized.filters, counts, facets,
        page: {
          items: visible.map((row) => row.card),
          nextCursor: rows.length > query.limit && last
            ? this.cursors.encode(binding, [asOf, ...last.keys]) : null,
        },
        mapPins,
        relatedCategories: facets.categories.filter((f) =>
          query.contextCategory ? relatedIds.has(f.id) : f.count > 0 && !f.selected).slice(0, 6),
      };
    });
  }
}
