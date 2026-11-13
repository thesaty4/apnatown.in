import { Injectable } from '@nestjs/common';
import type { ScopeRef } from '@apnatown/shared/admin';
import type { BusinessKind } from '@apnatown/shared/businesses';
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
import type { ImagePlacement } from '../../media-videos/domain/images';

// ---------------------------------------------------------------------------
// Ports Catalog exposes to other modules (Search, Products, Services,
// Businesses, Notifications). Catalog never queries listing repositories.
// ---------------------------------------------------------------------------

export const CATALOG_READ = Symbol('CATALOG_READ');
export interface CatalogReadPort {
  /**
   * Taxonomy projection + revision (validation for products/services/businesses).
   * With `tx`, reads inside the caller's transaction (write-time recheck).
   */
  taxonomy(input: {
    categoryIds?: readonly string[];
    subcategoryIds?: readonly string[];
    kind?: CategoryKind;
    activeOnly: boolean;
  }, tx?: TxContext): Promise<TaxonomyRead>;
  /** Enabled mappings only; the query is normalized again server-side. */
  resolveKeywords(input: {
    normalizedQuery: string;
  }, tx?: TxContext): Promise<KeywordResolution>;
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
// Ports Catalog consumes. Owned here (consumer-defined); the owning module
// binds the implementation (Businesses) or an explicit "unavailable" adapter
// until it exists (Media).
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
   * inactive, deleted or area-unresolved business, and
   * BUSINESS_CONTEXT_REQUIRED when the user owns both kinds and `businessKind`
   * (the `X-Business-Kind` route context) is omitted.
   */
  resolveSuggester(
    tx: TxContext,
    input: { userId: string; businessKind?: BusinessKind },
  ): Promise<SuggesterContext>;
  /** Owner manager audience for a business (Notifications return path). */
  audienceRole(
    tx: TxContext,
    businessId: string,
  ): Promise<'vendor' | 'provider'>;
}


export const CATALOG_MEDIA_ASSETS = Symbol('CATALOG_MEDIA_ASSETS');
export interface CatalogMediaAssetPort {
  /**
   * An attached-ready, approved `catalog_taxonomy` asset; throws
   * CATALOG_IMAGE_INVALID otherwise.
   */
  requireTaxonomyImage(tx: TxContext, assetId: string, userId: string): Promise<void>;
  /** Currently public descriptors; missing ids fall back to the icon. */
  describe(
    tx: TxContext,
    placements: readonly ImagePlacement[],
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
