import {
  EXPLORE_TABS, SearchFiltersSchema, searchListingQuery,
  type ExploreFilters, type ExploreTab, type SearchFilters, type SearchQuery,
} from '@apnatown/shared/search';
import type { DiscoveryContext } from './explore.repository';
import { normalizeExplore, tabFilters } from './explore-normalization';

function promote(filters: ExploreFilters, tab: SearchQuery['tab'], q: string): SearchFilters {
  const { cityId, areaId, contextCategory } = filters;
  const result: Record<string, unknown> = { tab, q, sort: 'relevance' };
  if (cityId) result.cityId = cityId;
  if (areaId) result.areaId = areaId;
  if (contextCategory) result.contextCategory = contextCategory;
  for (const kind of EXPLORE_TABS) {
    const prefix = tab === kind ? '' : `${kind}.`;
    for (const [key, value] of Object.entries(tabFilters(filters, kind))) {
      result[`${prefix}${key}`] = value;
    }
  }
  return SearchFiltersSchema.parse(result);
}
export function normalizeSearch(query: SearchQuery, context: DiscoveryContext) {
  const proxy = EXPLORE_TABS.find((tab) => tab === query.tab) ?? 'products';
  const normalized = normalizeExplore(searchListingQuery(query, proxy), context);
  return {
    ...normalized,
    filters: promote(normalized.filters, query.tab, query.q),
  };
}
export function searchListingFilters(filters: SearchFilters, tab: ExploreTab): ExploreFilters {
  const { limit: _limit, cursor: _cursor, ...listing } = searchListingQuery({ ...filters, limit: 20 }, tab);
  return listing;
}
export function searchTarget(filters: SearchFilters, tab: SearchQuery['tab']): string {
  const normalized = promote(searchListingFilters(filters, 'products'), tab, filters.q);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(normalized)) {
    if (value !== undefined) params.set(key, String(value));
  }
  return `/search?${params.toString()}`;
}
