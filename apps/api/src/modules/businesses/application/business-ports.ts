import { Injectable } from '@nestjs/common';
import type { ScopeRef } from '@apnatown/shared/admin';
import type {
  BusinessApplicationCard,
  BusinessDecisionAction,
  BusinessDocumentKind,
  BusinessHoursEntry,
  BusinessKind,
  BusinessLocation,
  BusinessOverview,
  BusinessPublic,
  BusinessStatus,
  DeliveryMethod,
} from '@apnatown/shared/businesses';
import type { SupplierTaxProfile } from '@apnatown/shared/settings';
import type { AdminReadContext } from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';

// ---------------------------------------------------------------------------
// Ports Businesses exposes to other modules. Purpose-limited projections only;
// no other module reads businesses tables.
// ---------------------------------------------------------------------------

export const BUSINESS_READ = Symbol('BUSINESS_READ');
export interface BusinessCheckoutContext {
  businessId: string;
  status: BusinessStatus;
  cityId: string | null;
  areaId: string | null;
  location: BusinessLocation | null;
  hours: BusinessHoursEntry[];
  temporarilyClosed: boolean;
  /** Null until configured; never a default fee/mode (null is not zero). */
  deliveryMethod: DeliveryMethod | null;
  deliveryRadiusKm: number | null;
  deliveryFeePaise: number | null;
  minimumOrderPaise: number | null;
  pickupEnabled: boolean;
  pickupInstructions: string | null;
  version: number;
}
export interface BusinessReadPort {
  /** Current approved, non-deleted public DTOs (Search, Products, Services). */
  publicProjection(input: {
    businessIds?: readonly string[];
    kind?: BusinessKind;
    categoryIds?: readonly string[];
    cursor?: string;
    limit?: number;
  }): Promise<{ items: BusinessPublic[]; nextCursor: string | null }>;
  /** Fulfilment eligibility for checkout/delivery use-cases only. */
  forCheckout(
    input: { businessIds: readonly string[] },
    tx?: TxContext,
  ): Promise<BusinessCheckoutContext[]>;
  /** Owner dashboard summary; BUSINESS_NOT_OWNED for another actor. */
  ownerSummary(input: {
    businessId: string;
    actorUserId: string;
  }): Promise<BusinessOverview>;
}

export const BUSINESS_BILLING = Symbol('BUSINESS_BILLING');
export type BusinessBillingSnapshot =
  | { state: 'ready'; profile: SupplierTaxProfile }
  | {
      state: 'configuration_required';
      reason: 'missing' | 'pending_review' | 'not_approved';
    };
export interface BusinessBillingPort {
  /**
   * Current approved fiscal version for new quotes/purchases, or explicit
   * configuration-required status (a pending new version blocks).
   */
  snapshot(
    input: { businessId: string },
    tx?: TxContext,
  ): Promise<BusinessBillingSnapshot>;
}

export const BUSINESS_ADMIN_READ = Symbol('BUSINESS_ADMIN_READ');
export type BusinessAdminView = 'applications' | 'listings';
export interface BusinessAdminDetail extends BusinessApplicationCard {
  ownerUserId: string;
  phoneE164: string;
  addressText: string | null;
  logoAssetId: string | null;
  coverAssetId: string | null;
  /** Only for approval viewers; never public URLs. */
  documents: { documentId: string; kind: BusinessDocumentKind; assetId: string }[];
}
export interface BusinessAdminReadPort {
  list(
    ctx: AdminReadContext,
    input: {
      view: BusinessAdminView;
      kind?: BusinessKind;
      status?: BusinessStatus;
      q?: string;
      cursor?: string;
      limit?: number;
    },
  ): Promise<{ items: BusinessApplicationCard[]; nextCursor: string | null }>;
  detail(
    ctx: AdminReadContext,
    input: { businessId: string; view: BusinessAdminView },
  ): Promise<BusinessAdminDetail>;
  summary(
    ctx: AdminReadContext,
    input: { from: Date; toExclusive: Date },
  ): Promise<{
    pendingCount: number;
    approvedShopCount: number;
    approvedProviderCount: number;
    topPending: BusinessApplicationCard[];
  }>;
}

export const BUSINESS_ADMIN_LISTINGS = Symbol('BUSINESS_ADMIN_LISTINGS');
export interface BusinessAdminListingCommand {
  ctx: AdminReadContext;
  correlationId: string;
  note?: string;
}
export interface BusinessAdminListingsPort {
  /** Blocked until ADM-Q1: always ADMIN_CREATION_POLICY_REQUIRED, no row. */
  adminCreate(
    command: BusinessAdminListingCommand,
    input: {
      kind: BusinessKind;
      nameEn: string;
      nameHi?: string;
      phoneE164: string;
      areaId: string;
    },
  ): Promise<never>;
  /** `catalog:edit` over source and destination; status needs approvals:edit. */
  adminUpdate(
    command: BusinessAdminListingCommand,
    input: {
      businessId: string;
      expectedVersion: number;
      nameEn?: string;
      nameHi?: string | null;
      phoneE164?: string;
      areaId?: string;
      categoryId?: string;
      statusAction?: BusinessDecisionAction;
    },
  ): Promise<{ businessId: string; status: BusinessStatus; version: number }>;
  /** Versioned soft delete with audit; hides the listing, stops new selling. */
  adminRemove(
    command: BusinessAdminListingCommand,
    input: { businessId: string; expectedVersion: number },
  ): Promise<{ businessId: string; version: number }>;
}

export const BUSINESS_NOTIFICATION_READ = Symbol('BUSINESS_NOTIFICATION_READ');
export interface BusinessNotificationReadPort {
  /**
   * Recipient-scoped decision context. The business row must still carry
   * `eventVersion` (no status history yet); otherwise BUSINESS_VERSION_CONFLICT
   * so the consumer never reports an unrelated later status.
   */
  context(input: { businessId: string; eventVersion: number }): Promise<{
    ownerUserId: string;
    ownerRole: 'vendor' | 'provider';
    scope: ScopeRef;
    nameEn: string | null;
    nameHi: string | null;
    status: BusinessStatus;
    reason: string | null;
  }>;
}

export const BUSINESS_MEDIA_READ = Symbol('BUSINESS_MEDIA_READ');
export interface BusinessMediaReadPort {
  context(
    input: { businessId: string },
    tx?: TxContext,
  ): Promise<{
    id: string;
    ownerUserId: string;
    kind: BusinessKind;
    status: BusinessStatus;
    scope: ScopeRef;
    categoryId: string | null;
    slug: string | null;
    name: { en: string | null; hi: string | null };
    verified: boolean;
    logoAssetId: string | null;
    coverAssetId: string | null;
    galleryMediaDefault: boolean;
    /** Approved, non-deleted only; unknown consent policy never grants. */
    galleryAllowed: boolean;
    hours: BusinessHoursEntry[];
    location: BusinessLocation | null;
    version: number;
  }>;
}

// ---------------------------------------------------------------------------
// Port Businesses consumes from Media (consumer-defined, narrow).
// ---------------------------------------------------------------------------

export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
}
export const BUSINESS_MEDIA_ASSETS = Symbol('BUSINESS_MEDIA_ASSETS');
export interface BusinessMediaAssetPort {
  /** Validates content/size and registers a logo/cover asset for the owner. */
  uploadProfileImage(
    tx: TxContext,
    input: {
      businessId: string;
      ownerUserId: string;
      purpose: 'logo' | 'cover';
      file: UploadedFile;
    },
  ): Promise<{ assetId: string; status: 'processing' | 'ready' }>;
  /** Private KYC document; never public. Throws BUSINESS_DOCUMENT_INVALID. */
  uploadPrivateDocument(
    tx: TxContext,
    input: {
      businessId: string;
      ownerUserId: string;
      documentKind: BusinessDocumentKind;
      file: UploadedFile;
    },
  ): Promise<{ assetId: string; status: 'processing' | 'ready' }>;
  /** Own, ready, purpose-matching asset; throws BUSINESS_MEDIA_INVALID. */
  requireAttachableImage(
    tx: TxContext,
    input: {
      assetId: string;
      businessId: string;
      ownerUserId: string;
      purpose: 'logo' | 'cover';
    },
  ): Promise<void>;
  /** Resolved public descriptors of attached ready assets (no raw keys). */
  describePublic(
    assetIds: readonly string[],
  ): Promise<
    Map<string, { assetId: string; publicUrl: string; width: number; height: number }>
  >;
}

/**
 * Binding point: the Media module (media-videos) rebinds
 * BUSINESS_MEDIA_ASSETS (BusinessesModule provider) to its validated asset
 * registry. Until then uploads and attachments are refused with the stable
 * BUSINESS_MEDIA_INVALID / BUSINESS_DOCUMENT_INVALID codes and public
 * profiles show no logo/cover (UI placeholder).
 */
@Injectable()
export class UnavailableBusinessMediaAssets implements BusinessMediaAssetPort {
  uploadProfileImage(): Promise<never> {
    return Promise.reject(
      new DomainError('BUSINESS_MEDIA_INVALID', { field: 'file' }),
    );
  }

  uploadPrivateDocument(): Promise<never> {
    return Promise.reject(
      new DomainError('BUSINESS_DOCUMENT_INVALID', { field: 'file' }),
    );
  }

  requireAttachableImage(
    _tx: TxContext,
    input: { purpose: 'logo' | 'cover' },
  ): Promise<void> {
    return Promise.reject(
      new DomainError('BUSINESS_MEDIA_INVALID', {
        field: input.purpose === 'logo' ? 'logoAssetId' : 'coverAssetId',
      }),
    );
  }

  describePublic(): Promise<
    Map<string, { assetId: string; publicUrl: string; width: number; height: number }>
  > {
    return Promise.resolve(new Map());
  }
}
