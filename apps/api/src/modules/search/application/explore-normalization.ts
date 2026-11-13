import { EXPLORE_FILTER_KEYS, EXPLORE_TABS, ExploreFiltersSchema, type ExploreFilters, type ExploreQuery, type ExploreTab } from '@apnatown/shared/search';
import { DomainError } from '../../../shared/errors/errors';
import type { DiscoveryContext, TabFilters } from './explore.repository';

export function tabFilters(filters: ExploreFilters, tab: ExploreTab): TabFilters {
  const record = filters as Record<string, unknown>;
  const prefix = tab === filters.tab ? '' : `${tab}.`;
  return Object.fromEntries(EXPLORE_FILTER_KEYS[tab].flatMap((key) => {
    const value = record[`${prefix}${key}`];
    return typeof value === 'string' || typeof value === 'number' ? [[key, value]] : [];
  }));
}
const slugs = (value: string | number | undefined) => String(value ?? '').split(',').filter(Boolean);
const invalid = (field: string): never => { throw new DomainError('SEARCH_FILTER_INVALID', { field }); };

export function normalizeExplore(query: ExploreQuery, context: DiscoveryContext) {
  const { cursor: _cursor, limit: _limit, ...input } = query;
  const result: Record<string, unknown> = { ...input };
  const root = query.contextCategory
    ? context.categories.find((category) => category.slug === query.contextCategory)
    : undefined;
  if (query.contextCategory && !root) invalid('contextCategory');
  const related = root ? context.relations.filter((r) => r.sourceId === root.id)
    .map((r) => context.categories.find((c) => c.id === r.targetId)!) : [];
  let emptyServices = false;
  for (const tab of EXPLORE_TABS) {
    const prefix = tab === query.tab ? '' : `${tab}.`;
    result[`${prefix}sort`] ??= 'relevance';
    const categoryKey = `${prefix}category`;
    if (root && result[categoryKey] === undefined) {
      if (tab === 'services') {
        const selected = root.kind === 'service' ? [root] : related.filter((c) => c.kind === 'service');
        if (selected.length) result[categoryKey] = selected.map((c) => c.slug).join(',');
        else emptyServices = true; // absent is distinct from an explicitly cleared ''.
      } else {
        result[categoryKey] = root.kind === 'product' ? root.slug
          : related.find((c) => c.kind === 'product')?.slug ?? '';
      }
    }
    normalizeTaxonomy(tab, prefix, result, context);
  }
  if (context.cityId) result.cityId = context.cityId;
  const filters = ExploreFiltersSchema.parse(result);
  for (const tab of EXPLORE_TABS) {
    const f = tabFilters(filters, tab);
    if (!context.location && (f.sort === 'distance' || Number(f.distanceKm ?? 0) > 0
      || f.radiusKm !== undefined || f.deliversToMe === 'true'))
      throw new DomainError('SEARCH_LOCATION_REQUIRED');
  }
  return { filters, emptyServices };
}

function normalizeTaxonomy(tab: ExploreTab, prefix: string, values: Record<string, unknown>, context: DiscoveryContext) {
  const kind = tab === 'services' ? 'service' : 'product';
  const selected = slugs(values[`${prefix}category`] as string | undefined);
  const categories = context.categories.filter((c) => c.kind === kind && selected.includes(c.slug));
  if (categories.length !== selected.length) invalid(`${prefix}category`);
  const key = `${prefix}subcategory`;
  // Preserve absent and explicitly cleared values. Context defaults were
  // applied above; each inactive namespace uses its own category selection.
  if (!values[key]) return;
  const parents = new Map((selected.length ? categories : context.categories.filter((c) => c.kind === kind))
    .map((category) => [category.id, category]));
  const canonical = slugs(values[key] as string).map((value) => {
    const parts = value.split('/');
    const categorySlug = parts.length === 2 ? parts[0] : undefined;
    const slug = parts.at(-1);
    const matches = context.subcategories.filter((subcategory) => {
      const parent = parents.get(subcategory.categoryId);
      return subcategory.kind === kind && subcategory.slug === slug && parent
        && (categorySlug === undefined || parent.slug === categorySlug);
    });
    // Never choose a first match or disambiguate by current result counts.
    if (matches.length !== 1) return invalid(key);
    const subcategory = matches[0]!;
    return `${parents.get(subcategory.categoryId)!.slug}/${subcategory.slug}`;
  });
  if (new Set(canonical).size !== canonical.length) invalid(key);
  values[key] = canonical.join(',');
}
