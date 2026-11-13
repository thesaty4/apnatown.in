import { Inject, Injectable } from '@nestjs/common';
import type { DiscoveryLocation, ExploreQuery, ExploreResponse } from '@apnatown/shared/search';
import { canonicalJson } from '@apnatown/shared';
import { CURSOR_CODEC, CursorCodec, type CursorBinding } from '../../../shared/pagination/cursor';
import { CATALOG_READ, type CatalogReadPort } from '../../catalog/application/catalog-ports';
import { EXPLORE_REPOSITORY, type ExploreRepository } from './explore.repository';
import { normalizeExplore } from './explore-normalization';
import { discoveryPosition } from './discovery-cursor';
import { keysetPage, relatedCategories } from './discovery-results';

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
      const { asOf, after } = discoveryPosition(this.cursors, query.cursor, binding, context.asOf);
      const rows = await snapshot.page(selection, query.limit, after);
      const counts = await snapshot.counts(selection);
      const facets = await snapshot.facets(selection);
      const visible = rows.slice(0, query.limit);
      const mapPins = [...new Map(visible.flatMap((row) => row.pin ? [[row.pin.businessId, row.pin] as const] : [])).values()];
      return {
        tab: query.tab, normalizedFilters: normalized.filters, counts, facets,
        page: keysetPage(this.cursors, rows, query.limit, binding, asOf),
        mapPins,
        relatedCategories: relatedCategories(context, query.contextCategory, facets),
      };
    });
  }
}
