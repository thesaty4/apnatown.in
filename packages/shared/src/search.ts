import { z } from 'zod';
import { CatalogHomeSectionSchema, CatalogSlugSchema } from './catalog.js';
import { CursorSchema, IdSchema, PageQuerySchema } from './wire.js';
import { LocaleSchema } from './users.js';
import { PublicImageVariantSchema } from './media.js';

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
// Explore (S-CUST-02). Wire booleans remain strings; numbers are validated
// before coercion. Empty category/subcategory is an intentional clear marker.

export const EXPLORE_TABS = ['products', 'shops', 'services'] as const;
export const ExploreTabSchema = z.enum(EXPLORE_TABS);
export type ExploreTab = z.infer<typeof ExploreTabSchema>;
export const EXPLORE_SORTS = ['relevance', 'distance', 'price_asc', 'price_desc', 'rating', 'newest'] as const;
export const ExploreSortSchema = z.enum(EXPLORE_SORTS);
export type ExploreSort = z.infer<typeof ExploreSortSchema>;

export const EXPLORE_FILTER_KEYS = {
  products: ['category', 'subcategory', 'brand', 'priceMinPaise', 'priceMaxPaise', 'rating', 'offers', 'inStock', 'deliversToMe', 'pickup', 'featured', 'distanceKm', 'offerId', 'sort'],
  shops: ['category', 'distanceKm', 'radiusKm', 'rating', 'openNow', 'deliversToMe', 'offers', 'verified', 'featured', 'sort'],
  services: ['category', 'subcategory', 'distanceKm', 'radiusKm', 'rating', 'priceMinPaise', 'priceMaxPaise', 'priceOnEnquiry', 'availableToday', 'offers', 'verified', 'sort'],
} as const;
export const EXPLORE_SORTS_BY_TAB = {
  products: EXPLORE_SORTS,
  shops: ['relevance', 'distance', 'rating', 'newest'],
  services: ['relevance', 'distance', 'rating', 'price_asc'],
} as const satisfies Record<ExploreTab, readonly ExploreSort[]>;

const numericWire = <T extends z.ZodType>(schema: T) => z.preprocess(
  (value) => typeof value === 'string' && /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)
    ? Number(value) : value,
  schema,
);
const slugList = z.string().max(2000).refine((value) => {
  if (value === '') return true;
  const slugs = value.split(',');
  return slugs.length <= 50 && new Set(slugs).size === slugs.length
    && slugs.every((slug) => CatalogSlugSchema.safeParse(slug).success);
}, 'Expected unique comma-separated category slugs');
const bool = z.enum(['true', 'false']).optional();
const price = numericWire(z.number().int().safe().nonnegative()).optional();
const filterShape = {
  category: slugList.optional(),
  subcategory: slugList.optional(),
  brand: z.string().min(1).max(120).optional(),
  priceMinPaise: price,
  priceMaxPaise: price,
  rating: numericWire(z.union([z.literal(0), z.literal(3), z.literal(4), z.literal(4.5)])).optional(),
  offers: bool, inStock: bool, deliversToMe: bool, pickup: bool,
  featured: bool, openNow: bool, verified: bool, priceOnEnquiry: bool, availableToday: bool,
  distanceKm: numericWire(z.union([z.literal(0), z.literal(1), z.literal(3), z.literal(5), z.literal(10)])).optional(),
  radiusKm: numericWire(z.number().min(1).max(12)).optional(),
  offerId: IdSchema.optional(),
  sort: ExploreSortSchema.optional(),
};
type FilterShape = typeof filterShape;
type Namespaced<T extends ExploreTab> = {
  [K in typeof EXPLORE_FILTER_KEYS[T][number] as `${T}.${K}`]: FilterShape[K]
};
function namespace<T extends ExploreTab>(tab: T): Namespaced<T> {
  return Object.fromEntries(EXPLORE_FILTER_KEYS[tab].map((key) => [
    `${tab}.${key}`, filterShape[key],
  ])) as Namespaced<T>;
}
const ExploreQueryObject = PageQuerySchema.extend({
  ...filterShape,
  ...namespace('products'), ...namespace('shops'), ...namespace('services'),
  tab: ExploreTabSchema.default('products'),
  sort: ExploreSortSchema.default('relevance'),
  view: z.enum(['list', 'map']).default('list'),
  contextCategory: CatalogSlugSchema.optional(),
  cityId: IdSchema.optional(),
  areaId: IdSchema.optional(),
  q: z.string().trim().min(1).max(200).optional(),
});
function validateExplore(
  query: z.infer<typeof ExploreQueryObject> | Omit<z.infer<typeof ExploreQueryObject>, 'cursor' | 'limit'>,
  ctx: z.RefinementCtx,
) {
  const values = query as Record<string, unknown>;
  const issue = (key: string) => ctx.addIssue({ code: 'custom', path: [key], message: 'Incompatible Explore filter' });
  if (query.tab === 'products' && query.view === 'map') issue('view');
  for (const tab of EXPLORE_TABS) {
    const prefix = tab === query.tab ? '' : `${tab}.`;
    const allowed: readonly string[] = EXPLORE_FILTER_KEYS[tab];
    for (const key of Object.keys(filterShape)) {
      if (values[`${prefix}${key}`] !== undefined && !allowed.includes(key)) issue(`${prefix}${key}`);
      if (tab === query.tab && values[`${tab}.${key}`] !== undefined) issue(`${tab}.${key}`);
    }
    const sort = values[`${prefix}sort`];
    if (sort !== undefined && !(EXPLORE_SORTS_BY_TAB[tab] as readonly unknown[]).includes(sort)) issue(`${prefix}sort`);
    if (tab !== 'services') {
      for (const key of ['category', 'subcategory']) {
        if (String(values[`${prefix}${key}`] ?? '').includes(',')) issue(`${prefix}${key}`);
      }
    }
    const min = values[`${prefix}priceMinPaise`];
    const max = values[`${prefix}priceMaxPaise`];
    if (typeof min === 'number' && typeof max === 'number' && min > max) issue(`${prefix}priceMaxPaise`);
  }
}
export const ExploreQuerySchema = ExploreQueryObject.superRefine(validateExplore);
export type ExploreQuery = z.infer<typeof ExploreQuerySchema>;
export type ExploreFilters = Omit<ExploreQuery, 'cursor' | 'limit'>;
export const ExploreFiltersSchema = ExploreQueryObject.omit({ cursor: true, limit: true }).superRefine(validateExplore);

/** Request context only: never serialize precise location in a discovery URL. */
const coordinate = (min: number, max: number) => z.preprocess(
  (value) => typeof value === 'string' && /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value) ? Number(value) : value,
  z.number().finite().min(min).max(max),
);
export const DiscoveryLocationSchema = z.strictObject({
  latitude: coordinate(-90, 90),
  longitude: coordinate(-180, 180),
});
export type DiscoveryLocation = z.infer<typeof DiscoveryLocationSchema>;

const LocalizedRefSchema = z.strictObject({
  nameEn: z.string().min(1),
  nameHi: z.string().nullable(),
});

export const ExploreCardSchema = z.strictObject({
  id: IdSchema,
  kind: z.enum(['product', 'shop', 'service']),
  nameEn: z.string().min(1),
  nameHi: z.string().nullable(),
  slug: z.string().min(1),
  verified: z.boolean(),
  category: LocalizedRefSchema.extend({ slug: CatalogSlugSchema }).nullable(),
  subcategory: LocalizedRefSchema.extend({ slug: CatalogSlugSchema }).nullable(),
  area: LocalizedRefSchema.nullable(),
  business: LocalizedRefSchema.extend({
    id: IdSchema, slug: CatalogSlugSchema, kind: z.enum(['shop', 'provider']),
  }),
  image: PublicImageVariantSchema.nullable(),
  rating: z.number().min(0).max(5).nullable(),
  reviewCount: z.number().int().nonnegative(),
  pricePaise: z.number().int().safe().nonnegative().nullable(),
  mrpPaise: z.number().int().safe().nonnegative().nullable(),
  priceMaxPaise: z.number().int().safe().nonnegative().nullable(),
  priceType: z.enum(['from', 'fixed', 'range', 'enquiry']).nullable(),
  unit: z.string().nullable(),
  distanceKm: z.number().nonnegative().nullable(),
  featured: z.boolean(),
  openNow: z.boolean().nullable(),
  offers: z.boolean(),
  inStock: z.boolean().nullable(),
  pickup: z.boolean(),
  delivers: z.boolean().nullable(),
  /** Businesses' explicitly public contact, never the owner's login phone. */
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/).nullable(),
  path: z.string().regex(/^\/(?:product|service|shop|provider)\/[a-z0-9-]+$/),
});
export type ExploreCard = z.infer<typeof ExploreCardSchema>;

export const ExploreFacetSchema = z.strictObject({
  id: z.string(), value: z.string(), labelEn: z.string(), labelHi: z.string().nullable(),
  count: z.number().int().nonnegative(), selected: z.boolean(), disabled: z.boolean(),
  categoryId: IdSchema.optional(),
});
export type ExploreFacet = z.infer<typeof ExploreFacetSchema>;
export const ExploreMapPinSchema = z.strictObject({
  id: IdSchema, businessId: IdSchema, lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180), nameEn: z.string(), nameHi: z.string().nullable(),
  path: ExploreCardSchema.shape.path,
  distanceKm: z.number().nonnegative().nullable(), delivers: z.boolean().nullable(),
});
export type ExploreMapPin = z.infer<typeof ExploreMapPinSchema>;
export const ExploreResponseSchema = z.strictObject({
  tab: ExploreTabSchema,
  normalizedFilters: ExploreFiltersSchema,
  /** Each tab's own remembered filters, including Catalog context initialization. */
  counts: z.strictObject({
    products: z.number().int().nonnegative(),
    shops: z.number().int().nonnegative(),
    services: z.number().int().nonnegative(),
  }),
  page: z.strictObject({
    items: z.array(ExploreCardSchema), nextCursor: CursorSchema.nullable(),
  }),
  facets: z.strictObject({
    categories: z.array(ExploreFacetSchema),
    subcategories: z.array(ExploreFacetSchema),
    brands: z.array(ExploreFacetSchema),
    priceRange: z.strictObject({
      minPaise: z.number().int().safe().nonnegative(),
      maxPaise: z.number().int().safe().nonnegative(),
    }).nullable(),
  }),
  mapPins: z.array(ExploreMapPinSchema),
  relatedCategories: z.array(ExploreFacetSchema),
});
export type ExploreResponse = z.infer<typeof ExploreResponseSchema>;
