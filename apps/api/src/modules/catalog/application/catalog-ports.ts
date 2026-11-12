import { Injectable } from '@nestjs/common';
import type { ScopeRef } from '@apnatown/shared/admin';
import type {
  CatalogHomeSection,
  CategoryKind,
  KeywordResolution,
  SuggestionStatus,
  TaxonomyImage,
  TaxonomyRead,
} from '@apnatown/shared/catalog';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';

// ---------------------------------------------------------------------------
// Ports Catalog exposes to other modules (Search, Products, Services,
// Businesses, Notifications). Catalog never queries listing repositories.
// ---------------------------------------------------------------------------

export const CATALOG_READ = Symbol('CATALOG_READ');
export interface CatalogReadPort {
  /** Taxonomy projection + revision (validation for products/services/businesses). */
  taxonomy(input: {
    categoryIds?: readonly string[];
    subcategoryIds?: readonly string[];
    kind?: CategoryKind;
    activeOnly: boolean;
  }): Promise<TaxonomyRead>;
  /** Enabled mappings only; the query is normalized again server-side. */
  resolveKeywords(input: {
    normalizedQuery: string;
  }): Promise<KeywordResolution>;
  /** Ordered active directed related categories (seeded RELP/RELS). */
  relatedCategories(input: {
    categoryId: string;
  }): Promise<{ id: string; slug: string }[]>;
  /** Committed decision context for Notifications. */
  suggestionNotice(input: {
    suggestionId: string;
    version: number;
  }): Promise<SuggestionNotice>;
}
export interface SuggestionNotice {
  suggestionId: string;
  businessId: string;
  submitterUserId: string;
  audienceRole: 'vendor' | 'provider';
  scope: ScopeRef;
  status: SuggestionStatus;
  nameEn: string;
  nameHi?: string;
  reason?: string;
  subcategoryId?: string;
  returnPath: string;
}

export const CATALOG_HOME_READ = Symbol('CATALOG_HOME_READ');
export interface CatalogHomeReadPort {
  /**
   * Active Home sections as of `at`, localized for `locale` (all displayed
   * text is localized at request time), with ineligible sections omitted.
   */
  list(input: { at: Date; locale: 'en' | 'hi' }): Promise<CatalogHomeSection[]>;
}

// ---------------------------------------------------------------------------
// Ports Catalog consumes. Owned here (consumer-defined) and bound to explicit
// "unavailable" adapters until the owning modules exist.
// ---------------------------------------------------------------------------

export const CATALOG_BUSINESS_CONTEXT = Symbol('CATALOG_BUSINESS_CONTEXT');
export interface SuggesterContext {
  businessId: string;
  cityId: string;
  areaId: string;
}
export interface CatalogBusinessContextPort {
  /**
   * Trusted owned business with the `business.taxonomy-suggest` capability
   * and a resolved area. Throws COMMON_FORBIDDEN for a non-owner, suspended,
   * inactive, deleted or area-unresolved business.
   */
  resolveSuggester(
    tx: TxContext,
    input: { userId: string },
  ): Promise<SuggesterContext>;
  /** Owner manager audience for a business (Notifications return path). */
  audienceRole(
    tx: TxContext,
    businessId: string,
  ): Promise<'vendor' | 'provider'>;
}

/**
 * Binding point: the Businesses module rebinds CATALOG_BUSINESS_CONTEXT
 * (CatalogModule provider) to its real adapter. Until then no owner can be
 * resolved, so suggestions are denied rather than accepted on guessed scope.
 */
@Injectable()
export class UnavailableBusinessContext implements CatalogBusinessContextPort {
  resolveSuggester(): Promise<SuggesterContext> {
    return Promise.reject(new DomainError('COMMON_FORBIDDEN'));
  }

  audienceRole(): Promise<'vendor' | 'provider'> {
    return Promise.reject(new DomainError('COMMON_UNAVAILABLE'));
  }
}

export const CATALOG_MEDIA_ASSETS = Symbol('CATALOG_MEDIA_ASSETS');
export interface CatalogMediaAssetPort {
  /**
   * An attached-ready, approved `catalog_taxonomy` asset; throws
   * CATALOG_IMAGE_INVALID otherwise.
   */
  requireTaxonomyImage(tx: TxContext, assetId: string): Promise<void>;
  /** Currently public descriptors; missing ids fall back to the icon. */
  describe(
    tx: TxContext,
    assetIds: readonly string[],
  ): Promise<Map<string, TaxonomyImage>>;
}

/**
 * Binding point: the Media module rebinds CATALOG_MEDIA_ASSETS (CatalogModule
 * provider). Until then every image asset id is rejected and no descriptor
 * is returned (tiles fall back to icon, then the shared placeholder).
 */
@Injectable()
export class UnavailableMediaAssets implements CatalogMediaAssetPort {
  requireTaxonomyImage(): Promise<void> {
    return Promise.reject(
      new DomainError('CATALOG_IMAGE_INVALID', { field: 'imageAssetId' }),
    );
  }

  describe(): Promise<Map<string, TaxonomyImage>> {
    return Promise.resolve(new Map());
  }
}
