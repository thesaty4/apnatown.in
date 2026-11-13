import {
  EXPLORE_FILTER_KEYS,
  EXPLORE_TABS,
  SearchFiltersSchema,
  searchListingQuery,
  type ExploreFilters,
  type ExploreTab,
  type SearchFilters,
  type SearchTab,
} from '@apnatown/shared/search';
import type { FilterPatch } from '../explore';

export type SearchParams = Record<string, string | string[] | undefined>;
export const listingTab = (tab: SearchTab): ExploreTab | undefined =>
  EXPLORE_TABS.find((candidate) => candidate === tab);

export function readSearchFilters(params: URLSearchParams): SearchFilters | null {
  for (const key of params.keys())
    if (params.getAll(key).length !== 1 || key === 'cursor' || key === 'limit')
      return null;
  const parsed = SearchFiltersSchema.safeParse(Object.fromEntries(params));
  return parsed.success ? parsed.data : null;
}

export function searchParams(filters: SearchFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters).sort(([a], [b]) => a.localeCompare(b)))
    if (value !== undefined) params.set(key, String(value));
  return params;
}

/** Server-owned suggestion / See all URLs are still validated before use. */
export function readSearchTarget(target: string): SearchFilters | null {
  if (!target.startsWith('/search?') || /[\\\r\n]/.test(target)) return null;
  try {
    const url = new URL(target, 'https://search.invalid');
    if (url.origin !== 'https://search.invalid' || url.pathname !== '/search' || url.hash)
      return null;
    return readSearchFilters(url.searchParams);
  } catch {
    return null;
  }
}

export function changeSearchTab(filters: SearchFilters, tab: SearchTab) {
  if (filters.tab === tab) return searchParams(filters);
  const next = searchParams(filters);
  const previous = listingTab(filters.tab);
  if (previous) {
    for (const key of EXPLORE_FILTER_KEYS[previous]) {
      const value = next.get(key);
      if (value !== null) next.set(`${previous}.${key}`, value);
      next.delete(key);
    }
  }
  next.set('tab', tab);
  next.set('sort', 'relevance');
  const destination = listingTab(tab);
  if (destination) {
    for (const key of EXPLORE_FILTER_KEYS[destination]) {
      const saved = next.get(`${destination}.${key}`);
      if (saved !== null) next.set(key, saved);
      next.delete(`${destination}.${key}`);
    }
  }
  return next;
}

export function patchSearch(filters: SearchFilters, patch: FilterPatch) {
  const next = searchParams(filters);
  for (const [key, value] of Object.entries(patch)) {
    if (value != null) next.set(key, String(value));
    else if (key === 'category' || key === 'subcategory') next.set(key, '');
    else if (key === 'sort') next.set(key, 'relevance');
    else next.delete(key);
  }
  return next;
}

export function resetSearchFilters(filters: SearchFilters) {
  const next = searchParams(filters);
  const active = listingTab(filters.tab);
  const tabs = active ? [active] : filters.tab === 'all' ? EXPLORE_TABS : [];
  for (const tab of tabs) {
    const prefix = tab === active ? '' : `${tab}.`;
    for (const key of EXPLORE_FILTER_KEYS[tab]) next.delete(`${prefix}${key}`);
    next.set(`${prefix}sort`, 'relevance');
    next.set(`${prefix}category`, '');
    if (tab !== 'shops') next.set(`${prefix}subcategory`, '');
  }
  next.set('sort', 'relevance');
  return next;
}

/** Only presentation adapts to Explore; transport stays GET /search. */
export function listingFilters(
  filters: SearchFilters,
  tab = listingTab(filters.tab),
): ExploreFilters | undefined {
  if (!tab) return undefined;
  const { limit: _limit, cursor: _cursor, ...result } = searchListingQuery(
    { ...filters, limit: 20 },
    tab,
  );
  return result;
}
