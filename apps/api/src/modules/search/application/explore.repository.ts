import type { KeywordResolution } from '@apnatown/shared/catalog';
import type { DiscoveryLocation, ExploreCard, ExploreFacet, ExploreFilters, ExploreMapPin, ExploreResponse, ExploreTab } from '@apnatown/shared/search';
import type { TxContext } from '../../../shared/persistence/ports';

export interface DiscoveryCategory {
  id: string; slug: string; nameEn: string; nameHi: string | null; kind: 'product' | 'service';
}
export interface DiscoverySubcategory extends DiscoveryCategory { categoryId: string }
export interface DiscoveryContext {
  categories: DiscoveryCategory[];
  subcategories: DiscoverySubcategory[];
  relations: { sourceId: string; targetId: string }[];
  location: DiscoveryLocation | null;
  cityId: string | null;
  asOf: string;
}
export interface ExploreSelection {
  filters: ExploreFilters;
  emptyServices: boolean;
  location: DiscoveryLocation | null;
  keywords: KeywordResolution | null;
}
export interface ExploreRow {
  card: ExploreCard;
  pin: ExploreMapPin | null;
  keys: string[];
}
export interface ExploreSnapshot {
  readonly tx: TxContext;
  context(filters: ExploreFilters, location: DiscoveryLocation | null): Promise<DiscoveryContext>;
  revision(): Promise<string>;
  page(selection: ExploreSelection, limit: number, after?: string[]): Promise<ExploreRow[]>;
  counts(selection: ExploreSelection): Promise<ExploreResponse['counts']>;
  facets(selection: ExploreSelection): Promise<ExploreResponse['facets']>;
}
export const EXPLORE_REPOSITORY = Symbol('EXPLORE_REPOSITORY');
export interface ExploreRepository {
  snapshot<T>(work: (snapshot: ExploreSnapshot) => Promise<T>): Promise<T>;
}
export type TabFilters = Partial<Record<string, string | number>>;
export type CategoryFacet = ExploreFacet & { kind?: ExploreTab };
