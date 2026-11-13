import type {
  CategoryKind,
  HomeSectionKind,
  KeywordTarget,
  SuggestionStatus,
} from '@apnatown/shared/catalog';
import type { TxContext } from '../../../shared/persistence/ports';

export const TAXONOMY_REPOSITORY = Symbol('TAXONOMY_REPOSITORY');
export const HOME_SECTION_REPOSITORY = Symbol('HOME_SECTION_REPOSITORY');
export const SUGGESTION_REPOSITORY = Symbol('SUGGESTION_REPOSITORY');
export const KEYWORD_MAPPING_REPOSITORY = Symbol('KEYWORD_MAPPING_REPOSITORY');

export interface StoredCategory {
  id: string;
  kind: CategoryKind;
  slug: string;
  nameEn: string;
  nameHi: string;
  icon: string | null;
  imageAssetId: string | null;
  active: boolean;
  sortOrder: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoredSubcategory {
  id: string;
  categoryId: string;
  slug: string;
  nameEn: string;
  nameHi: string;
  normalizedName: string;
  serviceTypes: string[];
  imageAssetId: string | null;
  active: boolean;
  sortOrder: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoredRelation {
  sourceCategoryId: string;
  relatedCategoryId: string;
  sortOrder: number;
}

export interface SimilarSubcategory {
  id: string;
  slug: string;
  nameEn: string;
  nameHi: string;
  similarity: number;
}

/** Partial update; undefined fields are left unchanged. */
export interface CategoryChange {
  nameEn?: string | undefined;
  nameHi?: string | undefined;
  icon?: string | null | undefined;
  imageAssetId?: string | null | undefined;
  active?: boolean | undefined;
  sortOrder?: number | undefined;
}

/** Partial update; undefined fields are left unchanged. */
export interface SubcategoryChange {
  nameEn?: string | undefined;
  nameHi?: string | undefined;
  normalizedName?: string | undefined;
  serviceTypes?: string[] | undefined;
  imageAssetId?: string | null | undefined;
  active?: boolean | undefined;
  sortOrder?: number | undefined;
}

export interface CategoryFilter {
  kind?: CategoryKind;
  activeOnly: boolean;
  ids?: readonly string[];
}

export interface SubcategoryFilter {
  kind?: CategoryKind;
  activeOnly: boolean;
  categoryIds?: readonly string[];
  ids?: readonly string[];
}

/** Categories, subcategories and directed relations. */
export interface TaxonomyRepository {
  /** Applies the database `unaccent` step of the shared normalization. */
  unaccent(tx: TxContext, values: readonly string[]): Promise<string[]>;
  listCategories(
    tx: TxContext,
    filter: CategoryFilter,
  ): Promise<StoredCategory[]>;
  findCategory(
    tx: TxContext,
    id: string,
    lock?: boolean,
  ): Promise<StoredCategory | null>;
  findCategoryBySlug(
    tx: TxContext,
    slug: string,
  ): Promise<StoredCategory | null>;
  /** false on a slug conflict. */
  insertCategory(
    tx: TxContext,
    row: Omit<StoredCategory, 'version' | 'createdAt' | 'updatedAt'> & {
      at: Date;
    },
  ): Promise<boolean>;
  /** false when the version is stale. */
  updateCategory(
    tx: TxContext,
    input: { id: string; expectedVersion: number; at: Date } & CategoryChange,
  ): Promise<boolean>;
  listSubcategories(
    tx: TxContext,
    filter: SubcategoryFilter,
  ): Promise<StoredSubcategory[]>;
  findSubcategory(
    tx: TxContext,
    id: string,
    lock?: boolean,
  ): Promise<StoredSubcategory | null>;
  findSubcategoryBySlug(
    tx: TxContext,
    categoryId: string,
    slug: string,
  ): Promise<StoredSubcategory | null>;
  /** Exact normalized-name (or slug) clash within the category. */
  findSubcategoryClash(
    tx: TxContext,
    input: {
      categoryId: string;
      normalizedNames: readonly string[];
      slug?: string;
      excludeId?: string;
    },
  ): Promise<StoredSubcategory | null>;
  /** Ranked pg_trgm candidates in the category (extension threshold). */
  similarSubcategories(
    tx: TxContext,
    categoryId: string,
    normalizedName: string,
    limit: number,
  ): Promise<SimilarSubcategory[]>;
  nextSubcategorySortOrder(tx: TxContext, categoryId: string): Promise<number>;
  /** false on a slug/normalized-name unique conflict. */
  insertSubcategory(
    tx: TxContext,
    row: Omit<StoredSubcategory, 'version' | 'createdAt' | 'updatedAt'> & {
      at: Date;
    },
  ): Promise<boolean>;
  /** false when the version is stale. */
  updateSubcategory(
    tx: TxContext,
    input: {
      id: string;
      expectedVersion: number;
      at: Date;
    } & SubcategoryChange,
  ): Promise<boolean>;
  relations(
    tx: TxContext,
    sourceCategoryIds?: readonly string[],
  ): Promise<StoredRelation[]>;
  /** Changes whenever any category/subcategory row changes. */
  revision(tx: TxContext): Promise<string>;
}

export interface StoredHomeSection {
  id: string;
  kind: HomeSectionKind;
  contentKind: CategoryKind;
  categoryId: string | null;
  headingEn: string | null;
  headingHi: string | null;
  supportingTextEn: string | null;
  supportingTextHi: string | null;
  initialCategoryId: string | null;
  position: number;
  active: boolean;
  removedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  categories: { categoryId: string; position: number }[];
}

export type HomeSectionContent = Pick<
  StoredHomeSection,
  | 'categoryId'
  | 'headingEn'
  | 'headingHi'
  | 'supportingTextEn'
  | 'supportingTextHi'
  | 'initialCategoryId'
  | 'position'
  | 'categories'
>;

export interface HomeSectionRepository {
  /** Live (not removed) sections ordered by position, id. */
  list(
    tx: TxContext,
    input: { activeOnly: boolean; limit: number },
  ): Promise<StoredHomeSection[]>;
  find(
    tx: TxContext,
    id: string,
    lock?: boolean,
  ): Promise<StoredHomeSection | null>;
  /** false when a live dedicated section already exists for the category. */
  insert(
    tx: TxContext,
    row: HomeSectionContent & {
      id: string;
      kind: HomeSectionKind;
      contentKind: CategoryKind;
      actorId: string;
      at: Date;
    },
  ): Promise<boolean>;
  /** Content edit (pills replaced). */
  update(
    tx: TxContext,
    input: HomeSectionContent & {
      id: string;
      expectedVersion: number;
      actorId: string;
      at: Date;
    },
  ): Promise<'ok' | 'stale' | 'conflict'>;
  setState(
    tx: TxContext,
    input: {
      id: string;
      expectedVersion: number;
      active: boolean;
      removed: boolean;
      actorId: string;
      at: Date;
    },
  ): Promise<boolean>;
}

export interface StoredSuggestion {
  id: string;
  businessId: string;
  submitterUserId: string;
  cityId: string;
  areaId: string;
  categoryId: string;
  nameEn: string;
  nameHi: string | null;
  normalizedName: string;
  reason: string | null;
  status: SuggestionStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  subcategoryId: string | null;
  mergedIntoSubcategoryId: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SuggestionVisibility {
  platformWide: boolean;
  cityIds: readonly string[];
  areaIds: readonly string[];
}

export interface SuggestionPosition {
  createdAt: string;
  id: string;
}

export interface SuggestionRepository {
  find(
    tx: TxContext,
    id: string,
    lock?: boolean,
  ): Promise<StoredSuggestion | null>;
  /** Pending suggestion with one of the normalized names in the category. */
  findPendingByName(
    tx: TxContext,
    categoryId: string,
    normalizedNames: readonly string[],
  ): Promise<StoredSuggestion | null>;
  /** false on the pending (category, normalized_name) unique conflict. */
  insert(
    tx: TxContext,
    row: Pick<
      StoredSuggestion,
      | 'id'
      | 'businessId'
      | 'submitterUserId'
      | 'cityId'
      | 'areaId'
      | 'categoryId'
      | 'nameEn'
      | 'nameHi'
      | 'normalizedName'
      | 'reason'
    > & { at: Date },
  ): Promise<boolean>;
  /** Compare-and-set from pending; false when stale or no longer pending. */
  decide(
    tx: TxContext,
    input: {
      id: string;
      expectedVersion: number;
      status: Exclude<SuggestionStatus, 'pending'>;
      reviewedBy: string;
      rejectionReason: string | null;
      subcategoryId: string | null;
      mergedIntoSubcategoryId: string | null;
      at: Date;
    },
  ): Promise<boolean>;
  scopedPage(
    tx: TxContext,
    input: {
      status: SuggestionStatus;
      visibility: SuggestionVisibility;
      limit: number;
      after?: SuggestionPosition;
    },
  ): Promise<StoredSuggestion[]>;
  businessPage(
    tx: TxContext,
    input: { businessId: string; limit: number; after?: SuggestionPosition },
  ): Promise<StoredSuggestion[]>;
}

export interface StoredKeywordMapping {
  id: string;
  enabled: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  canonicalTerm: string;
  synonyms: string[];
  targets: KeywordTarget[];
}

export interface KeywordTermRow {
  term: string;
  normalizedTerm: string;
  kind: 'primary' | 'synonym';
}

export interface KeywordMatchRow {
  mappingId: string;
  matchedTerm: string;
  exact: boolean;
}

export interface KeywordMappingRepository {
  find(
    tx: TxContext,
    id: string,
    lock?: boolean,
  ): Promise<StoredKeywordMapping | null>;
  page(
    tx: TxContext,
    input: { limit: number; afterId?: string },
  ): Promise<StoredKeywordMapping[]>;
  findMany(
    tx: TxContext,
    ids: readonly string[],
  ): Promise<StoredKeywordMapping[]>;
  /** Normalized terms already used by another mapping. */
  takenTerms(
    tx: TxContext,
    normalizedTerms: readonly string[],
    excludeMappingId?: string,
  ): Promise<string[]>;
  insert(tx: TxContext, input: { id: string; at: Date }): Promise<void>;
  /** Bumps the version; false when stale. */
  touch(
    tx: TxContext,
    input: { id: string; expectedVersion: number; at: Date },
  ): Promise<boolean>;
  /** Replaces all terms; false on a normalized-term unique conflict. */
  replaceTerms(
    tx: TxContext,
    input: {
      mappingId: string;
      terms: readonly (KeywordTermRow & { id: string })[];
      at: Date;
    },
  ): Promise<boolean>;
  replaceTargets(
    tx: TxContext,
    input: {
      mappingId: string;
      targets: readonly (KeywordTarget & { id: string })[];
    },
  ): Promise<void>;
  delete(
    tx: TxContext,
    input: { id: string; expectedVersion: number },
  ): Promise<boolean>;
  /** Enabled mappings only: exact terms, otherwise ranked trigram matches. */
  match(
    tx: TxContext,
    normalizedQuery: string,
    limit: number,
  ): Promise<KeywordMatchRow[]>;
  revision(tx: TxContext): Promise<string>;
}
