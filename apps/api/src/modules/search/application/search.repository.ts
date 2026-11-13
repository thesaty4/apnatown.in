import type { SearchVideoCard } from '@apnatown/shared/search';
import type { ExploreSelection, ExploreSnapshot } from './explore.repository';

export const SEARCH_REPOSITORY = Symbol('SearchRepository');
export interface SearchVideoRow { card: SearchVideoCard; keys: string[] }
export interface SearchSnapshot extends ExploreSnapshot {
  videoCount(selection: ExploreSelection): Promise<number>;
  videoPage(selection: ExploreSelection, limit: number, after?: string[]): Promise<SearchVideoRow[]>;
  taxonomySuggestions(selection: ExploreSelection): Promise<TaxonomySuggestionRow[]>;
}
export interface TaxonomySuggestionRow {
  id: string;
  kind: 'category' | 'subcategory';
  nameEn: string;
  nameHi: string | null;
}
export interface SearchRepository {
  snapshot<T>(work: (snapshot: SearchSnapshot) => Promise<T>): Promise<T>;
}
