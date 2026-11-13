import { z } from 'zod';
import { CatalogHomeSectionSchema } from './catalog.js';
import { ExploreCardSchema, ExploreQueryObject } from './discovery.js';
import { CursorSchema } from './wire.js';
import { LocaleSchema } from './users.js';

/**
 * `GET /search/home` query. Optional public `cityId`/`areaId` reuse Explore's
 * discovery context; precise coordinates travel only in the
 * `X-Discovery-Latitude`/`X-Discovery-Longitude` request headers.
 */
export const SearchHomeQuerySchema = z.strictObject({
  locale: LocaleSchema.default('en'),
  cityId: ExploreQueryObject.shape.cityId,
  areaId: ExploreQueryObject.shape.areaId,
});
export type SearchHomeQuery = z.infer<typeof SearchHomeQuerySchema>;

/**
 * - `ok`: items come from the owner projection (nonempty).
 * - `empty`: the owner source exists but has no eligible rows; omit on Home.
 * - `unavailable`: no approved source/integration exists (e.g. Q-57 popularity).
 * - `location_required`: the section needs a location/area context.
 */
export const SEARCH_HOME_SECTION_STATES = ['ok', 'empty', 'unavailable', 'location_required'] as const;
export const SearchHomeSectionStateSchema = z.enum(SEARCH_HOME_SECTION_STATES);
export type SearchHomeSectionState = z.infer<typeof SearchHomeSectionStateSchema>;

/** Bounded Home card section using the shared Explore public card projection. */
export const SearchHomeCardSectionSchema = z.strictObject({
  items: z.array(ExploreCardSchema),
  /** Home sections are bounded; "View all" opens Explore. Present only if paging is added. */
  nextCursor: CursorSchema.nullable().optional(),
  state: SearchHomeSectionStateSchema,
});
export type SearchHomeCardSection = z.infer<typeof SearchHomeCardSectionSchema>;

/** Prototype `js4.js` V.home bounds. TODO(verify): featured businesses are unbounded there. */
export const SEARCH_HOME_SECTION_LIMITS = {
  nearbyShops: 8,
  featuredBusinesses: 10,
  popularBusinesses: 10,
  featuredProducts: 8,
  popularProviders: 4,
} as const;

/**
 * `GET /search/home` composition. Only sections whose owning module exists
 * are present; Offers banners/offers/promotions are added when Offers ships
 * (omitted sections render nothing).
 */
export const SearchHomeSchema = z.strictObject({
  /** Catalog-owned dedicated/curated category sections, in position order. */
  categorySections: z.array(CatalogHomeSectionSchema),
  nearbyShops: SearchHomeCardSectionSchema,
  featuredBusinesses: SearchHomeCardSectionSchema,
  popularBusinesses: SearchHomeCardSectionSchema,
  featuredProducts: SearchHomeCardSectionSchema,
  popularProviders: SearchHomeCardSectionSchema,
});
export type SearchHome = z.infer<typeof SearchHomeSchema>;
