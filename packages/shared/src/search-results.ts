import { z } from 'zod';
import {
  EXPLORE_FILTER_KEYS, EXPLORE_TABS, ExploreCardSchema, ExploreQueryObject,
  ExploreQuerySchema, ExploreResponseSchema, validateDiscoveryFilters,
  type ExploreQuery, type ExploreTab,
} from './discovery.js';
import { CursorSchema, IdSchema } from './wire.js';
import { LocaleSchema } from './users.js';
import { PublicImageVariantSchema } from './media.js';

export const SEARCH_TABS = ['all', ...EXPLORE_TABS, 'videos'] as const;
export const SearchTabSchema = z.enum(SEARCH_TABS);
export type SearchTab = z.infer<typeof SearchTabSchema>;
export const SearchResultTabSchema = z.enum([...EXPLORE_TABS, 'videos']);
export type SearchResultTab = z.infer<typeof SearchResultTabSchema>;
export const SearchTextSchema = z.string().trim().max(200);
const SearchQueryObject = ExploreQueryObject.omit({ view: true }).extend({
  tab: SearchTabSchema.default('all'),
  q: SearchTextSchema.default(''),
});
function validateSearch(query: Record<string, unknown> & { tab: SearchTab }, ctx: z.RefinementCtx) {
  const active = EXPLORE_TABS.find((tab) => tab === query.tab) ?? null;
  validateDiscoveryFilters(query, active, ctx);
  if (query.tab === 'all' && query.cursor !== undefined)
    ctx.addIssue({ code: 'custom', path: ['cursor'], message: 'Page an individual result group' });
}
export const SearchQuerySchema = SearchQueryObject.superRefine(validateSearch);
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export const SearchFiltersSchema = SearchQueryObject.omit({ cursor: true, limit: true }).superRefine(validateSearch);
export type SearchFilters = z.infer<typeof SearchFiltersSchema>;

/** Promote one group's filters without losing any other group's state. */
export function searchListingQuery(query: SearchQuery, target: ExploreTab): ExploreQuery {
  const input: Record<string, unknown> = {
    tab: target, sort: 'relevance', view: 'list', limit: query.limit,
    ...(query.q ? { q: query.q } : {}),
    ...(query.contextCategory ? { contextCategory: query.contextCategory } : {}),
    ...(query.cityId ? { cityId: query.cityId } : {}),
    ...(query.areaId ? { areaId: query.areaId } : {}),
  };
  const values = query as Record<string, unknown>;
  for (const tab of EXPLORE_TABS) {
    const sourcePrefix = tab === query.tab ? '' : `${tab}.`;
    const targetPrefix = tab === target ? '' : `${tab}.`;
    for (const key of EXPLORE_FILTER_KEYS[tab]) {
      const value = values[`${sourcePrefix}${key}`];
      if (value !== undefined) input[`${targetPrefix}${key}`] = value;
    }
  }
  return ExploreQuerySchema.parse(input);
}

export const SearchVideoCardSchema = z.strictObject({
  kind: z.literal('video'), id: IdSchema,
  caption: z.string().max(300), hashtags: z.array(z.string()).max(10),
  provider: z.enum(['youtube', 'instagram']),
  business: ExploreCardSchema.shape.business,
  viewCount: z.number().int().safe().nonnegative(),
  image: PublicImageVariantSchema.nullable(),
  durationSeconds: z.number().nonnegative().nullable(),
  path: z.string().regex(/^\/videos\/[a-f0-9-]{36}$/),
});
export type SearchVideoCard = z.infer<typeof SearchVideoCardSchema>;
export const SearchCardSchema = z.discriminatedUnion('kind', [
  ExploreCardSchema, SearchVideoCardSchema,
]);
export type SearchCard = z.infer<typeof SearchCardSchema>;
const searchTarget = z.string().max(20000).regex(/^\/search\?/);
export const SearchGroupSchema = z.strictObject({
  tab: SearchResultTabSchema, total: z.number().int().safe().nonnegative(),
  items: z.array(SearchCardSchema).max(4), seeAll: searchTarget,
});
export const SearchResponseSchema = z.strictObject({
  tab: SearchTabSchema, query: SearchTextSchema, normalizedFilters: SearchFiltersSchema,
  counts: ExploreResponseSchema.shape.counts.extend({
    all: z.number().int().safe().nonnegative(), videos: z.number().int().safe().nonnegative(),
  }),
  page: z.strictObject({ items: z.array(SearchCardSchema).max(50), nextCursor: CursorSchema.nullable() }),
  groups: z.array(SearchGroupSchema).max(4),
  facets: ExploreResponseSchema.shape.facets,
  relatedCategories: ExploreResponseSchema.shape.relatedCategories,
  mappingExplanation: z.strictObject({
    terms: z.array(z.string()),
    relatedServices: z.boolean(),
  }).nullable(),
});
export type SearchResponse = z.infer<typeof SearchResponseSchema>;

export const SearchSuggestionsQuerySchema = z.strictObject({
  q: SearchTextSchema.refine((q) => q.length > 0, 'Query required'),
  locale: LocaleSchema.default('en'),
  cityId: IdSchema.optional(), areaId: IdSchema.optional(),
});
export type SearchSuggestionsQuery = z.infer<typeof SearchSuggestionsQuerySchema>;
export const SearchSuggestionSchema = z.strictObject({
  id: IdSchema.optional(), label: z.string().min(1), target: searchTarget,
});
export type SearchSuggestion = z.infer<typeof SearchSuggestionSchema>;
export const SearchSuggestionsSchema = z.strictObject({
  products: z.array(SearchSuggestionSchema).max(3),
  shops: z.array(SearchSuggestionSchema).max(3),
  services: z.array(SearchSuggestionSchema).max(3),
  categories: z.array(SearchSuggestionSchema).max(3),
  subcategories: z.array(SearchSuggestionSchema).max(3),
  relatedSearches: z.array(SearchSuggestionSchema).max(2),
});
export type SearchSuggestions = z.infer<typeof SearchSuggestionsSchema>;
export const SearchPopularSchema = z.strictObject({
  terms: z.array(SearchTextSchema), source: z.literal('curated_global'),
});
export type SearchPopular = z.infer<typeof SearchPopularSchema>;
