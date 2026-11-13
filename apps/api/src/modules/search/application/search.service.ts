import { Inject, Injectable } from '@nestjs/common';
import { canonicalJson } from '@apnatown/shared';
import type { KeywordResolution } from '@apnatown/shared/catalog';
import {
  EXPLORE_TABS, SearchQuerySchema, searchListingQuery,
  type DiscoveryLocation, type ExploreTab, type SearchFilters, type SearchPopular,
  type SearchQuery, type SearchResponse, type SearchSuggestions, type SearchSuggestionsQuery,
} from '@apnatown/shared/search';
import { DomainError } from '../../../shared/errors/errors';
import { CURSOR_CODEC, CursorCodec, type CursorBinding } from '../../../shared/pagination/cursor';
import { CATALOG_READ, type CatalogReadPort } from '../../catalog/application/catalog-ports';
import type { DiscoveryContext, ExploreSelection } from './explore.repository';
import { SEARCH_REPOSITORY, type SearchRepository, type SearchSnapshot } from './search.repository';
import { normalizeSearch, searchListingFilters } from './search-normalization';
import { discoveryPosition } from './discovery-cursor';
import { keysetPage, relatedCategories } from './discovery-results';
import {
  EMPTY_FACETS, RELATED_SEARCH_SIZE, SEARCH_GROUP_SIZE, SEARCH_POPULAR_TERMS, SUGGESTION_GROUP_SIZE,
  localizedLabel, mappingExplanation, searchGroup, termSuggestion,
} from './search-composition';

/** One request's normalized state inside a single read-only snapshot. */
interface SearchRun {
  snapshot: SearchSnapshot;
  query: SearchQuery;
  context: DiscoveryContext;
  filters: SearchFilters;
  emptyServices: boolean;
  keywords: KeywordResolution | null;
}
type SearchBody = Pick<SearchResponse, 'page' | 'groups' | 'facets' | 'relatedCategories'>;
type SearchCounts = SearchResponse['counts'];

/** Each group keeps its own typed filters; text/keywords use the Search predicate. */
const selectionFor = (run: SearchRun, tab: ExploreTab): ExploreSelection => ({
  filters: searchListingFilters(run.filters, tab),
  emptyServices: run.emptyServices,
  location: run.context.location,
  keywords: run.keywords,
  search: true,
});

/** SR1–SR10 read composition. No query history, popularity or ranking is stored or invented. */
@Injectable()
export class SearchService {
  constructor(
    @Inject(SEARCH_REPOSITORY) private readonly repository: SearchRepository,
    @Inject(CATALOG_READ) private readonly catalog: CatalogReadPort,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
  ) {}

  search(query: SearchQuery, location: DiscoveryLocation | null = null): Promise<SearchResponse> {
    return this.repository.snapshot(async (snapshot) => {
      const run = await this.prepare(snapshot, query, location);
      if (!query.q) return emptySearch(run);
      if (query.tab === 'all') {
        const counts = await this.counts(run);
        return respond(run, counts, await this.groups(run, counts));
      }
      // Validate the cursor binding before any count work.
      const body = query.tab === 'videos' ? await this.videos(run) : await this.listing(run, query.tab);
      return respond(run, await this.counts(run), body);
    });
  }

  suggestions(input: SearchSuggestionsQuery): Promise<SearchSuggestions> {
    const query = SearchQuerySchema.parse({
      tab: 'all', q: input.q,
      ...(input.cityId ? { cityId: input.cityId } : {}),
      ...(input.areaId ? { areaId: input.areaId } : {}),
    });
    return this.repository.snapshot(async (snapshot) => {
      const run = await this.prepare(snapshot, query, null);
      const label = (nameEn: string, nameHi: string | null) => localizedLabel(input.locale, nameEn, nameHi);
      const result: SearchSuggestions = {
        products: [], shops: [], services: [], categories: [], subcategories: [], relatedSearches: [],
      };
      for (const tab of EXPLORE_TABS) {
        const rows = await snapshot.page(selectionFor(run, tab), SUGGESTION_GROUP_SIZE);
        result[tab] = rows.slice(0, SUGGESTION_GROUP_SIZE).map(({ card }) =>
          termSuggestion(run.filters, label(card.nameEn, card.nameHi), card.id));
      }
      const taxonomy = await snapshot.taxonomySuggestions(selectionFor(run, 'products'));
      for (const kind of ['category', 'subcategory'] as const) {
        result[kind === 'category' ? 'categories' : 'subcategories'] = taxonomy
          .filter((row) => row.kind === kind).slice(0, SUGGESTION_GROUP_SIZE)
          .map((row) => termSuggestion(run.filters, label(row.nameEn, row.nameHi), row.id));
      }
      result.relatedSearches = (mappingExplanation(run.keywords, run.context)?.terms ?? [])
        .slice(0, RELATED_SEARCH_SIZE).map((term) => termSuggestion(run.filters, term));
      return result;
    });
  }

  popular(): SearchPopular {
    return { terms: [...SEARCH_POPULAR_TERMS], source: 'curated_global' };
  }

  private async prepare(
    snapshot: SearchSnapshot, query: SearchQuery, location: DiscoveryLocation | null,
  ): Promise<SearchRun> {
    // Context reads only public city/area scope, so any listing proxy works.
    const context = await snapshot.context(searchListingQuery(query, 'products'), location);
    const { filters, emptyServices } = normalizeSearch(query, context);
    const keywords = query.q
      ? await this.catalog.resolveKeywords({ normalizedQuery: query.q }, snapshot.tx) : null;
    return { snapshot, query, context, filters, emptyServices, keywords };
  }

  private async counts(run: SearchRun): Promise<SearchCounts> {
    const selection = selectionFor(run, 'products');
    const listings = await run.snapshot.counts(selection);
    const videos = await run.snapshot.videoCount(selection);
    return { all: listings.products + listings.shops + listings.services + videos, ...listings, videos };
  }

  /** All: up to four items per nonempty group from the same predicates as each tab. */
  private async groups(run: SearchRun, counts: SearchCounts): Promise<SearchBody> {
    const groups: SearchResponse['groups'] = [];
    for (const tab of EXPLORE_TABS) {
      if (counts[tab] === 0) continue;
      const rows = await run.snapshot.page(selectionFor(run, tab), SEARCH_GROUP_SIZE);
      groups.push(searchGroup(run.filters, tab, counts[tab], rows.map((row) => row.card)));
    }
    if (counts.videos > 0) {
      const rows = await run.snapshot.videoPage(selectionFor(run, 'products'), SEARCH_GROUP_SIZE);
      groups.push(searchGroup(run.filters, 'videos', counts.videos, rows.map((row) => row.card)));
    }
    return { page: { items: [], nextCursor: null }, groups, facets: EMPTY_FACETS, relatedCategories: [] };
  }

  private async listing(run: SearchRun, tab: ExploreTab): Promise<SearchBody> {
    const selection = selectionFor(run, tab);
    const binding = await this.binding(run);
    const { asOf, after } = discoveryPosition(this.cursors, run.query.cursor, binding, run.context.asOf);
    const rows = await run.snapshot.page(selection, run.query.limit, after);
    const facets = await run.snapshot.facets(selection);
    return {
      page: keysetPage(this.cursors, rows, run.query.limit, binding, asOf),
      groups: [],
      facets,
      relatedCategories: relatedCategories(run.context, run.filters.contextCategory, facets),
    };
  }

  /** Approved, Reels-eligible videos in Media's deterministic owner order (relevance only). */
  private async videos(run: SearchRun): Promise<SearchBody> {
    const binding = await this.binding(run);
    const { asOf, after } = discoveryPosition(this.cursors, run.query.cursor, binding, run.context.asOf);
    const rows = await run.snapshot.videoPage(selectionFor(run, 'products'), run.query.limit, after);
    return {
      page: keysetPage(this.cursors, rows, run.query.limit, binding, asOf),
      groups: [], facets: EMPTY_FACETS, relatedCategories: [],
    };
  }

  private async binding(run: SearchRun): Promise<CursorBinding> {
    return {
      operation: 'search.search.v1',
      sort: run.filters.sort,
      // canonicalJson removes undefined properties and fixes key order.
      filters: JSON.parse(canonicalJson(run.filters)),
      scope: {
        location: run.context.location,
        revision: await run.snapshot.revision(),
        keywords: run.keywords?.revision ?? null,
      },
    };
  }
}

function respond(run: SearchRun, counts: SearchCounts, body: SearchBody): SearchResponse {
  return {
    tab: run.query.tab, query: run.query.q, normalizedFilters: run.filters, counts, ...body,
    mappingExplanation: mappingExplanation(run.keywords, run.context),
  };
}

/** Empty query: validated filters, empty groups and zero counts; recent terms stay client-side. */
function emptySearch(run: SearchRun): SearchResponse {
  // No cursor is ever issued for an empty query.
  if (run.query.cursor) throw new DomainError('COMMON_VALIDATION_FAILED');
  return respond(run, { all: 0, products: 0, shops: 0, services: 0, videos: 0 }, {
    page: { items: [], nextCursor: null }, groups: [], facets: EMPTY_FACETS, relatedCategories: [],
  });
}
