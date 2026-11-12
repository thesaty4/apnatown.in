import {
  EXPLORE_TABS, EXPLORE_FILTER_KEYS, EXPLORE_SORTS_BY_TAB,
  ExploreQuerySchema, type ExploreTab,
} from '@apnatown/shared/search';
export type { ExploreFilters } from '@apnatown/shared/search';
import type { ExploreFilters } from '@apnatown/shared/search';

export type FilterPatch = Record<string, string | number | null | undefined>;
export const sortsFor = (tab: ExploreTab) => EXPLORE_SORTS_BY_TAB[tab];
export const hasVerified = (tab: ExploreTab) => tab !== 'products';
export const selectedValues = (value: string | undefined) => value ? value.split(',') : [];

export function readFilters(params: URLSearchParams): ExploreFilters | null {
  for (const key of params.keys())
    if (params.getAll(key).length !== 1 || key === 'cursor' || key === 'limit') return null;
  const parsed = ExploreQuerySchema.safeParse(Object.fromEntries(params));
  if (!parsed.success) return null;
  const { cursor: _cursor, limit: _limit, ...filters } = parsed.data;
  return filters;
}

export function filterParams(filters: ExploreFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters))
    if (value !== undefined) params.set(key, String(value));
  return params;
}

export function withFilters(params: URLSearchParams, patch: FilterPatch) {
  const next = new URLSearchParams(params);
  for (const [key, value] of Object.entries(patch)) {
    if (value != null) next.set(key, String(value));
    else if (key === 'category' || key === 'subcategory') next.set(key, '');
    else if (key === 'sort') next.set(key, 'relevance');
    else next.delete(key);
  }
  next.delete('cursor');
  return next;
}

export function resetFilters(params: URLSearchParams) {
  const filters = readFilters(params);
  if (!filters) throw new Error('INVALID_EXPLORE_URL');
  const next = new URLSearchParams(params);
  for (const key of EXPLORE_FILTER_KEYS[filters.tab]) next.delete(key);
  next.set('sort', 'relevance');
  next.set('category', '');
  if (filters.tab !== 'shops') next.set('subcategory', '');
  return next;
}

export function withTab(params: URLSearchParams, tab: ExploreTab) {
  const current = readFilters(params);
  if (!current) throw new Error('INVALID_EXPLORE_URL');
  if (current.tab === tab) return new URLSearchParams(params);
  const next = new URLSearchParams(params);
  for (const key of EXPLORE_FILTER_KEYS[current.tab]) {
    const value = params.get(key);
    if (value !== null) next.set(`${current.tab}.${key}`, value);
    next.delete(key);
  }
  next.set(`${current.tab}.sort`, current.sort);
  for (const key of EXPLORE_FILTER_KEYS[tab]) {
    const value = params.get(`${tab}.${key}`);
    if (value !== null) next.set(key, value);
    next.delete(`${tab}.${key}`);
  }
  if (!current.contextCategory && current.tab !== 'services' && tab !== 'services' &&
      !params.has(`${tab}.sort`) && current.category)
    next.set('category', current.category);
  next.set('tab', tab);
  if (tab === 'products') { next.set('view', 'list'); next.delete('radiusKm'); }
  return next;
}

export function withContext(params: URLSearchParams, category: string | null) {
  const next = new URLSearchParams(params);
  if (category) next.set('contextCategory', category);
  else next.delete('contextCategory');
  for (const prefix of ['', ...EXPLORE_TABS.map((tab) => `${tab}.`)])
    for (const key of ['category', 'subcategory']) next.delete(`${prefix}${key}`);
  if (!category) {
    const active = params.get('tab') ?? 'products';
    for (const tab of EXPLORE_TABS) {
      const prefix = tab === active ? '' : `${tab}.`;
      next.set(`${prefix}category`, '');
      if (tab !== 'shops') next.set(`${prefix}subcategory`, '');
    }
  }
  return next;
}
