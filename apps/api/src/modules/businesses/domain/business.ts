import type {
  BillingDraft,
  BusinessCapabilities,
  BusinessDecisionAction,
  BusinessDocumentKind,
  BusinessHoursEntry,
  BusinessKind,
  BusinessSettings,
  BusinessStatus,
} from '@apnatown/shared/businesses';
import type { JsonValue } from '@apnatown/shared';
import type { TxContext } from '../../../shared/persistence/ports';

/** Business row as stored (timestamps are ISO-8601 UTC text). */
export interface StoredBusiness {
  id: string;
  ownerUserId: string;
  kind: BusinessKind;
  status: BusinessStatus;
  nameEn: string | null;
  nameHi: string | null;
  slug: string | null;
  description: string | null;
  cityId: string | null;
  areaId: string | null;
  addressText: string | null;
  lat: number | null;
  lng: number | null;
  phoneE164: string;
  whatsappE164: string | null;
  email: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  facebookUrl: string | null;
  logoAssetId: string | null;
  coverAssetId: string | null;
  verifiedAt: string | null;
  submittedAt: string | null;
  reviewReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  version: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoredCategoryLink {
  categoryId: string;
  isPrimary: boolean;
}

/** A business with its categories, weekly hours and settings. */
export interface BusinessAggregate {
  business: StoredBusiness;
  categories: StoredCategoryLink[];
  hours: BusinessHoursEntry[];
  settings: BusinessSettings;
}

export interface StoredDocument {
  id: string;
  businessId: string;
  documentKind: BusinessDocumentKind;
  assetId: string;
  createdAt: string;
}

export interface StoredBilling {
  businessId: string;
  draft: BillingDraft;
  approvedSnapshot: JsonValue | null;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  version: number;
  approvedVersion: number | null;
  reviewReason: string | null;
  verificationEvidenceRef: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

/** Owner-editable business columns (PATCH allow-list after validation). */
export interface BusinessChanges {
  kind?: BusinessKind;
  nameEn?: string | null;
  nameHi?: string | null;
  description?: string | null;
  cityId?: string | null;
  areaId?: string | null;
  addressText?: string | null;
  location?: { lat: number; lng: number } | null;
  phoneE164?: string;
  whatsappE164?: string | null;
  email?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  facebookUrl?: string | null;
  logoAssetId?: string | null;
  coverAssetId?: string | null;
}

export interface AdminVisibility {
  platformWide: boolean;
  cityIds: readonly string[];
  areaIds: readonly string[];
}

export interface DiscoveryFilter {
  kind: BusinessKind;
  categoryId?: string;
  verified?: boolean;
}
export interface DiscoveryRow {
  id: string;
  kind: BusinessKind;
  nameEn: string;
  nameHi: string | null;
  slug: string;
  verified: boolean;
  createdAt: string;
  categoryId: string | null;
  areaNameEn: string | null;
  areaNameHi: string | null;
}

export const BUSINESS_REPOSITORY = Symbol('BUSINESS_REPOSITORY');
export type BusinessSavedCard = {
  id: string;
  labelEn: string;
  labelHi: string | null;
  kind: 'shop' | 'provider';
  slug: string;
  categoryEn: string | null;
  categoryHi: string | null;
  rating: number | null;
  reviewCount: number;
};
export interface BusinessRepository {
  savedCards(
    tx: TxContext,
    ids: readonly string[],
  ): Promise<BusinessSavedCard[]>;
  find(
    tx: TxContext,
    id: string,
    lock?: boolean,
  ): Promise<StoredBusiness | null>;
  /** Live (non-deleted) businesses of an owner, optionally one kind. */
  ownedBy(
    tx: TxContext,
    input: { ownerUserId: string; kind?: BusinessKind; lock?: boolean },
  ): Promise<StoredBusiness[]>;
  /** Approved, non-deleted business by slug. */
  findPublicBySlug(tx: TxContext, slug: string): Promise<StoredBusiness | null>;
  aggregate(
    tx: TxContext,
    business: StoredBusiness,
  ): Promise<BusinessAggregate>;
  /** `business_settings.gallery_media_default`; null when no settings row. */
  galleryMediaDefault(
    tx: TxContext,
    businessId: string,
  ): Promise<boolean | null>;
  /** Inserts a draft + default settings; false on UNIQUE(owner,kind). */
  insertDraft(
    tx: TxContext,
    row: {
      id: string;
      ownerUserId: string;
      kind: BusinessKind;
      phoneE164: string;
      at: Date;
    },
  ): Promise<boolean>;
  /** Version-guarded profile write; bumps version. */
  updateProfile(
    tx: TxContext,
    input: {
      id: string;
      expectedVersion: number;
      changes: BusinessChanges;
      at: Date;
    },
  ): Promise<boolean>;
  replaceCategories(
    tx: TxContext,
    businessId: string,
    categoryIds: readonly string[],
    primaryCategoryId: string | null,
    at: Date,
  ): Promise<void>;
  replaceHours(
    tx: TxContext,
    businessId: string,
    hours: readonly BusinessHoursEntry[],
  ): Promise<void>;
  updateSettings(
    tx: TxContext,
    businessId: string,
    settings: BusinessSettings,
    at: Date,
  ): Promise<void>;
  /** Version-guarded status transition; bumps version. */
  transition(
    tx: TxContext,
    input: {
      id: string;
      expectedVersion: number;
      status: BusinessStatus;
      slug?: string;
      submittedAt?: Date;
      /** Reviewer decision, or `clear` on (re)submission. */
      review?: { reason: string | null; reviewedBy: string } | 'clear';
      at: Date;
    },
  ): Promise<boolean>;
  /** Version-guarded soft delete; bumps version. */
  softDelete(
    tx: TxContext,
    input: { id: string; expectedVersion: number; at: Date },
  ): Promise<boolean>;
  /** Lowest free slug for a base, serialized by a transaction lock. */
  allocateSlug(tx: TxContext, base: string): Promise<string>;
  insertDocument(
    tx: TxContext,
    row: {
      id: string;
      businessId: string;
      documentKind: BusinessDocumentKind;
      assetId: string;
      uploadedBy: string;
      at: Date;
    },
  ): Promise<StoredDocument>;
  documents(tx: TxContext, businessId: string): Promise<StoredDocument[]>;
  /** Scoped keyset page ordered by (created_at,id). */
  scopedPage(
    tx: TxContext,
    input: {
      statuses: readonly BusinessStatus[];
      kind?: BusinessKind;
      q?: string;
      visibility: AdminVisibility;
      after?: [string, string];
      limit: number;
    },
  ): Promise<StoredBusiness[]>;
  scopedCounts(
    tx: TxContext,
    visibility: AdminVisibility,
  ): Promise<{
    pending: number;
    approvedShop: number;
    approvedProvider: number;
  }>;
  primaryCategories(
    tx: TxContext,
    businessIds: readonly string[],
  ): Promise<Map<string, string>>;
  /** Approved, non-deleted public page ordered by (created_at,id). */
  publicPage(
    tx: TxContext,
    input: {
      businessIds?: readonly string[];
      kind?: BusinessKind;
      categoryIds?: readonly string[];
      after?: [string, string];
      limit: number;
    },
  ): Promise<StoredBusiness[]>;
  /** Public Explore page: approved, named, active-owner listings. */
  discoveryPage(
    tx: TxContext,
    input: DiscoveryFilter & {
      newest: boolean;
      after?: [string, string];
      limit: number;
    },
  ): Promise<DiscoveryRow[]>;
  discoveryCount(tx: TxContext, input: DiscoveryFilter): Promise<number>;
  findMany(tx: TxContext, ids: readonly string[]): Promise<StoredBusiness[]>;
  findBilling(
    tx: TxContext,
    businessId: string,
    lock?: boolean,
  ): Promise<StoredBilling | null>;
  /** Insert or replace the draft; resets review to pending. */
  saveBillingDraft(
    tx: TxContext,
    input: { businessId: string; draft: BillingDraft; at: Date },
  ): Promise<void>;
  /** Version-guarded review decision on a pending draft; bumps version. */
  decideBilling(
    tx: TxContext,
    input: {
      businessId: string;
      expectedVersion: number;
      approved: {
        snapshot: JsonValue;
        approvedVersion: number;
        evidenceRef: string;
      } | null;
      reason: string | null;
      reviewedBy: string;
      at: Date;
    },
  ): Promise<boolean>;
  /** Claims the dedup window; increments the IST daily aggregate once. */
  recordView(
    tx: TxContext,
    input: { businessId: string; subjectHash: Buffer; windowStart: Date },
  ): Promise<boolean>;
  /** Daily views keyed by IST date (YYYY-MM-DD), inclusive bounds. */
  dailyViews(
    tx: TxContext,
    input: { businessId: string; fromIstDate: string; toIstDate: string },
  ): Promise<Map<string, number>>;
  coverageStartedAt(tx: TxContext): Promise<string | null>;
  /** Deletes up to `limit` dedup claims created before `before`. */
  deleteViewClaims(tx: TxContext, before: Date, limit: number): Promise<number>;
}

/** Matching Users role for a business kind. */
export const ROLE_FOR_KIND = {
  shop: 'vendor',
  provider: 'provider',
} as const satisfies Record<BusinessKind, 'vendor' | 'provider'>;

/** ST-approval admin edges. */
export const DECISION_EDGES: Readonly<
  Record<
    BusinessDecisionAction,
    { from: readonly BusinessStatus[]; to: BusinessStatus }
  >
> = {
  approve: { from: ['pending'], to: 'approved' },
  reject: { from: ['pending'], to: 'rejected' },
  request_changes: { from: ['pending'], to: 'changes_requested' },
  suspend: { from: ['approved'], to: 'suspended' },
  restore: { from: ['suspended'], to: 'approved' },
  deactivate: { from: ['approved'], to: 'inactive' },
};

export function allowedActions(
  status: BusinessStatus,
): BusinessDecisionAction[] {
  return (Object.keys(DECISION_EDGES) as BusinessDecisionAction[]).filter(
    (action) => DECISION_EDGES[action].from.includes(status),
  );
}

const EDITABLE: readonly BusinessStatus[] = [
  'draft',
  'pending',
  'rejected',
  'changes_requested',
  'approved',
];
const SUBMITTABLE: readonly BusinessStatus[] = [
  'draft',
  'rejected',
  'changes_requested',
];
const DOCUMENT_UPLOAD: readonly BusinessStatus[] = [
  'draft',
  'pending',
  'rejected',
  'changes_requested',
];

/**
 * Server-derived owner capabilities (ST-approval): pending edits only;
 * rejected/changes_requested can resubmit; suspended cannot sell or edit;
 * inactive may reactivate. Selling also needs the live seller role.
 */
export function capabilities(
  business: StoredBusiness,
  sellerRole: boolean,
): BusinessCapabilities {
  const editable = EDITABLE.includes(business.status);
  return {
    editProfile: editable,
    changeKind: business.status === 'draft',
    submit: SUBMITTABLE.includes(business.status),
    reactivate: business.status === 'inactive',
    uploadDocuments: DOCUMENT_UPLOAD.includes(business.status),
    uploadMedia: editable,
    sell: business.status === 'approved' && sellerRole,
    publicProfile: business.status === 'approved' && business.slug !== null,
  };
}

/** True when delivery has every value checkout needs (null is not zero). */
export function deliveryConfigured(settings: BusinessSettings): boolean {
  return (
    settings.deliveryMethod !== null &&
    settings.deliveryRadiusKm !== null &&
    settings.minimumOrderPaise !== null &&
    (settings.deliveryMethod !== 'self' || settings.deliveryFeePaise !== null)
  );
}

export const DEFAULT_SETTINGS: BusinessSettings = {
  temporarilyClosed: false,
  deliveryMethod: null,
  deliveryRadiusKm: null,
  deliveryFeePaise: null,
  minimumOrderPaise: null,
  pickupEnabled: false,
  pickupInstructions: null,
  serviceRadiusKm: null,
  serviceArea: null,
  galleryMediaDefault: true,
};
