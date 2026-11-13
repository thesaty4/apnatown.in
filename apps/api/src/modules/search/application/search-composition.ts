import type { KeywordResolution } from '@apnatown/shared/catalog';
import type {
  SearchCard, SearchFilters, SearchResponse, SearchResultTab, SearchSuggestion,
} from '@apnatown/shared/search';
import type { DiscoveryContext } from './explore.repository';
import { searchTarget } from './search-normalization';

/**
 * Q-56 pending: the prototype's curated global list (js23 `POP`). It is not
 * derived from customer queries, city or popularity analytics.
 */
export const SEARCH_POPULAR_TERMS = [
  'AC', 'iPhone 15', 'DJ', 'tent', 'plumber', 'mobile repair', 'एसी',
] as const;
export const SEARCH_GROUP_SIZE = 4;
export const SUGGESTION_GROUP_SIZE = 3;
export const RELATED_SEARCH_SIZE = 2;
const QUERY_MAX_LENGTH = 200;

/** All/Videos have no listing facets; never fabricate options or counts. */
export const EMPTY_FACETS: SearchResponse['facets'] = {
  categories: [], subcategories: [], brands: [], priceRange: null,
};

export function searchGroup(
  filters: SearchFilters, tab: SearchResultTab, total: number, items: SearchCard[],
): SearchResponse['groups'][number] {
  return { tab, total, items: items.slice(0, SEARCH_GROUP_SIZE), seeAll: searchTarget(filters, tab) };
}

/** Catalog-configured mapping terms only; null when no enabled mapping matched. */
export function mappingExplanation(
  keywords: KeywordResolution | null, context: DiscoveryContext,
): SearchResponse['mappingExplanation'] {
  const matches = keywords?.matches ?? [];
  if (matches.length === 0) return null;
  const serviceTaxonomy = new Set([...context.categories, ...context.subcategories]
    .filter((taxonomy) => taxonomy.kind === 'service').map((taxonomy) => taxonomy.id));
  const relatedServices = matches.some((match) => match.targets.some((target) =>
    (target.kind === 'category' && serviceTaxonomy.has(target.categoryId))
    || (target.kind === 'subcategory' && serviceTaxonomy.has(target.subcategoryId))));
  return { terms: [...new Set(matches.map((match) => match.canonicalTerm))], relatedServices };
}

export function localizedLabel(locale: 'en' | 'hi', nameEn: string, nameHi: string | null) {
  return locale === 'hi' && nameHi ? nameHi : nameEn;
}

/** Selecting a suggestion submits its label as `q` (js4 `sq`) on the All tab. */
export function termSuggestion(filters: SearchFilters, label: string, id?: string): SearchSuggestion {
  const q = label.trim().slice(0, QUERY_MAX_LENGTH).trim();
  return { ...(id ? { id } : {}), label, target: searchTarget({ ...filters, q }, 'all') };
}
