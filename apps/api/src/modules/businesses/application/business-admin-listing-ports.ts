import type {
  AdminBusinessListing,
  AdminListingCreate,
  AdminListingEdit,
  AdminListingRemove,
  ScopeRef,
} from '@apnatown/shared/admin';
import type {
  BusinessDecisionAction,
  BusinessKind,
  BusinessStatus,
} from '@apnatown/shared/businesses';
import type { SessionBinding } from '../../../shared/auth';
import type { AdminReadContext } from '../../../shared/auth/ports';
import type { TxContext } from '../../../shared/persistence/ports';

/**
 * Businesses-owned Admin Listings reads (F-AD-003): `catalog:view` over the
 * caller's server-derived scope, including non-public (non-draft) records.
 */
export const BUSINESS_ADMIN_LISTING_READ = Symbol(
  'BUSINESS_ADMIN_LISTING_READ',
);
export interface BusinessListingTarget {
  id: string;
  kind: BusinessKind;
  ownerUserId: string;
  cityId: string;
  areaId: string;
}
export interface BusinessAdminListingReadPort {
  list(
    ctx: AdminReadContext,
    input: {
      kind: BusinessKind;
      status?: BusinessStatus;
      q?: string;
      cursor?: string;
      limit: number;
    },
  ): Promise<{ items: AdminBusinessListing[]; nextCursor: string | null }>;
  /** Re-authorizes `catalog:view` over the stored area in the transaction. */
  detail(
    tx: TxContext,
    ctx: AdminReadContext,
    input: { businessId: string; kind: BusinessKind },
  ): Promise<{
    listing: AdminBusinessListing;
    /** ST-approval actions valid for the stored status. */
    decisionActions: BusinessDecisionAction[];
  }>;
  /**
   * Live, publicly visible (approved) listing with a resolved area, or null.
   * For listing-report intake; no contact fields.
   */
  publicTarget(
    tx: TxContext,
    input: { businessId: string; kind: BusinessKind },
  ): Promise<BusinessListingTarget | null>;
  /** Stored scope of a live listing (unresolved area -> null city/area). */
  scopeOf(
    tx: TxContext,
    businessId: string,
  ): Promise<{ scope: ScopeRef; ownerUserId: string } | null>;
}

/** Same shape as the approvals decision command (Idempotency-Key bound). */
export interface BusinessAdminListingCommand {
  session: SessionBinding;
  actorId: string;
  correlationId: string;
  key: unknown;
}
export interface BusinessAdminListingResult {
  businessId: string;
  status: BusinessStatus;
  deleted: boolean;
  version: number;
}

/** Owning versioned admin commands; never direct status assignment. */
export const BUSINESS_ADMIN_LISTINGS = Symbol('BUSINESS_ADMIN_LISTINGS');
export interface BusinessAdminListingsPort {
  /** Blocked until ADM-Q1: always ADMIN_CREATION_POLICY_REQUIRED, no row. */
  adminCreate(
    command: BusinessAdminListingCommand,
    input: AdminListingCreate,
  ): Promise<never>;
  /**
   * `catalog:edit` over source and destination; `statusAction` additionally
   * needs `approvals:edit` and follows the ST-approval decision edges.
   */
  adminUpdate(
    command: BusinessAdminListingCommand,
    input: { businessId: string; kind: BusinessKind } & AdminListingEdit,
  ): Promise<BusinessAdminListingResult>;
  /** Versioned soft delete with audit; hides the listing, stops new selling. */
  adminRemove(
    command: BusinessAdminListingCommand,
    input: { businessId: string; kind: BusinessKind } & AdminListingRemove,
  ): Promise<BusinessAdminListingResult>;
}
