import {
  ExploreQuerySchema, SEARCH_HOME_SECTION_LIMITS,
  type DiscoveryLocation, type ExploreQuery, type SearchHome, type SearchHomeCardSection, type SearchHomeQuery,
} from '@apnatown/shared/search';
import type { DiscoveryContext, ExploreSnapshot } from './explore.repository';
import { normalizeExplore } from './explore-normalization';

type ListingSectionKey = 'nearbyShops' | 'featuredBusinesses' | 'featuredProducts';
export type HomeListingSections = Pick<SearchHome, ListingSectionKey>;

/**
 * Home listing sections are Explore selections (prototype `js4.js` V.home),
 * so cards, eligibility, featured status and ordering come from the same
 * owner projections/SQL as the matching Explore "View all" target.
 */
const LISTING_SECTIONS = {
  // Prototype: approved businesses by distance; "View all shops" sort=distance.
  nearbyShops: { tab: 'shops', sort: 'distance', filters: {}, needsLocation: true },
  // Prototype: featured approved businesses; "View all businesses" featured=true.
  // TODO(verify): whether provider businesses also belong here (Explore Shops excludes them).
  featuredBusinesses: { tab: 'shops', sort: 'relevance', filters: { featured: 'true' }, needsLocation: false },
  // Prototype: featured && avail products of approved businesses, slice(0,8).
  // TODO(verify): `avail` maps to Explore's inStock (excludes untracked-inventory products).
  featuredProducts: {
    tab: 'products', sort: 'relevance', filters: { featured: 'true', inStock: 'true' }, needsLocation: false,
  },
} satisfies Record<ListingSectionKey, {
  tab: ExploreQuery['tab']; sort: ExploreQuery['sort'];
  filters: Partial<Record<'featured' | 'inStock', 'true'>>; needsLocation: boolean;
}>;

/** Q-57: no approved popularity/ranking source exists; never guess one. */
export const unavailableSection = (): SearchHomeCardSection => ({ items: [], state: 'unavailable' });

/** Explore filters carrying only the public Home context (no category/query state). */
export function homeExploreQuery(
  query: SearchHomeQuery, extra: Partial<Record<string, string>> = {}, tab: ExploreQuery['tab'] = 'shops',
  sort: ExploreQuery['sort'] = 'relevance', limit = 1,
): ExploreQuery {
  return ExploreQuerySchema.parse({ tab, sort, limit, cityId: query.cityId, areaId: query.areaId, ...extra });
}

/** Reads the bounded listing sections inside one Explore read snapshot. */
export async function homeListingSections(
  snapshot: ExploreSnapshot, query: SearchHomeQuery, location: DiscoveryLocation | null,
): Promise<HomeListingSections> {
  const context = await snapshot.context(homeExploreQuery(query), location);
  const result = {} as HomeListingSections;
  // Sequential: all reads share the snapshot's single transaction client.
  for (const key of Object.keys(LISTING_SECTIONS) as ListingSectionKey[]) {
    result[key] = await readSection(snapshot, context, query, key);
  }
  return result;
}

async function readSection(
  snapshot: ExploreSnapshot, context: DiscoveryContext, query: SearchHomeQuery, key: ListingSectionKey,
): Promise<SearchHomeCardSection> {
  const { tab, sort, filters, needsLocation } = LISTING_SECTIONS[key];
  if (needsLocation && !context.location) return { items: [], state: 'location_required' };
  const limit = SEARCH_HOME_SECTION_LIMITS[key];
  const explore = homeExploreQuery(query, filters, tab, sort, limit);
  const normalized = normalizeExplore(explore, context);
  const rows = await snapshot.page({ ...normalized, location: context.location, keywords: null }, limit);
  const items = rows.slice(0, limit).map((row) => row.card);
  return { items, state: items.length ? 'ok' : 'empty' };
}
