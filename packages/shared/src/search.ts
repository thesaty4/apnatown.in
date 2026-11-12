import { z } from 'zod';
import { CatalogHomeSectionSchema, CatalogSlugSchema } from './catalog.js';
import { CursorSchema, IdSchema, PageQuerySchema } from './wire.js';
import { LocaleSchema } from './users.js';

export const SearchHomeQuerySchema = z.strictObject({
  locale: LocaleSchema.default('en'),
});
export type SearchHomeQuery = z.infer<typeof SearchHomeQuerySchema>;

/**
 * `GET /search/home` composition. Only sections whose owning module exists
 * are present; Offers/Products/Businesses discovery sections are added when
 * those modules ship (never fabricated).
 */
export const SearchHomeSchema = z.strictObject({
  /** Catalog-owned dedicated/curated category sections, in position order. */
  categorySections: z.array(CatalogHomeSectionSchema),
});
export type SearchHome = z.infer<typeof SearchHomeSchema>;

// ---------------------------------------------------------------------------
// Explore (S-CUST-02) — current subset over approved businesses. Products have
// no owning module yet, so that tab is always empty with a zero count.

export const EXPLORE_TABS = ['products', 'shops', 'services'] as const;
export const ExploreTabSchema = z.enum(EXPLORE_TABS);
export type ExploreTab = z.infer<typeof ExploreTabSchema>;
export const EXPLORE_SORTS = ['relevance', 'newest'] as const;
export const ExploreSortSchema = z.enum(EXPLORE_SORTS);
export type ExploreSort = z.infer<typeof ExploreSortSchema>;

export const ExploreQuerySchema = PageQuerySchema.extend({
  tab: ExploreTabSchema.default('products'),
  /** Existing business memberships use product-kind Catalog categories. */
  category: CatalogSlugSchema.optional(),
  verified: z.enum(['true', 'false']).optional(),
  sort: ExploreSortSchema.default('relevance'),
});
export type ExploreQuery = z.infer<typeof ExploreQuerySchema>;

const LocalizedRefSchema = z.strictObject({
  nameEn: z.string().min(1),
  nameHi: z.string().nullable(),
});

export const ExploreCardSchema = z.strictObject({
  id: IdSchema,
  kind: z.enum(['shop', 'provider']),
  nameEn: z.string().min(1),
  nameHi: z.string().nullable(),
  slug: z.string().min(1),
  verified: z.boolean(),
  category: LocalizedRefSchema.extend({ slug: CatalogSlugSchema }).nullable(),
  area: LocalizedRefSchema.nullable(),
});
export type ExploreCard = z.infer<typeof ExploreCardSchema>;

export const ExploreResponseSchema = z.strictObject({
  tab: ExploreTabSchema,
  /** Active tab: its filters applied; other tabs: all approved listings. */
  counts: z.strictObject({
    products: z.number().int().nonnegative(),
    shops: z.number().int().nonnegative(),
    services: z.number().int().nonnegative(),
  }),
  items: z.array(ExploreCardSchema),
  nextCursor: CursorSchema.nullable(),
});
export type ExploreResponse = z.infer<typeof ExploreResponseSchema>;
