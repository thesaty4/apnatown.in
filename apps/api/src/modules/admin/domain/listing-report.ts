import type {
  AdminBusinessListingType,
  ListingReportReason,
  ListingReportStatus,
} from '@apnatown/shared/admin';
import { createHmac } from 'node:crypto';
import type { TxContext } from '../../../shared/persistence/ports';

export const LISTING_REPORT_REPOSITORY = Symbol('LISTING_REPORT_REPOSITORY');

const SUBJECT_KEY_LABEL = 'apnatown:listing-report-subject:v1';

/** Purpose-separated subkey: never equal to cursor or rate-limit MACs. */
export function listingReportSubjectKey(cursorSigningKey: string): Buffer {
  return createHmac('sha256', cursorSigningKey)
    .update(SUBJECT_KEY_LABEL)
    .digest();
}

/** Keyed reporter subject hash; shared by intake and the local demo seed. */
export function listingReportSubjectHash(
  subjectKey: Buffer,
  subject: string,
): Buffer {
  return createHmac('sha256', subjectKey).update(subject).digest();
}

/** Stored report; the subject hash is never read back out of the store. */
export interface StoredListingReport {
  id: string;
  targetType: AdminBusinessListingType;
  targetId: string;
  reporterUserId: string | null;
  reason: ListingReportReason;
  details: string | null;
  cityId: string;
  areaId: string;
  status: ListingReportStatus;
  resolution: 'dismissed' | 'action_taken' | null;
  resolutionNote: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  version: number;
}

export interface ReportVisibility {
  platformWide: boolean;
  cityIds: readonly string[];
  areaIds: readonly string[];
}

export interface ListingReportRepository {
  /** Inserts an open report or returns the subject's existing open one. */
  openOrExisting(
    tx: TxContext,
    row: {
      id: string;
      targetType: AdminBusinessListingType;
      targetId: string;
      reporterUserId: string | null;
      subjectHash: Buffer;
      reason: ListingReportReason;
      details: string | null;
      cityId: string;
      areaId: string;
      at: Date;
    },
  ): Promise<{ report: StoredListingReport; created: boolean }>;
  find(
    tx: TxContext,
    id: string,
    lock?: boolean,
  ): Promise<StoredListingReport | null>;
  /** Newest first, up to `limit + 1`, within the caller's visibility. */
  page(
    tx: TxContext,
    input: {
      visibility: ReportVisibility;
      status?: ListingReportStatus;
      targetId?: string;
      after?: [string, string];
      limit: number;
    },
  ): Promise<StoredListingReport[]>;
  /** Open report counts for at most 50 already-authorized targets. */
  openCounts(
    tx: TxContext,
    targetIds: readonly string[],
  ): Promise<Map<string, number>>;
  resolve(
    tx: TxContext,
    input: {
      id: string;
      expectedVersion: number;
      resolution: 'dismissed' | 'action_taken';
      note: string | null;
      resolvedBy: string;
      at: Date;
    },
  ): Promise<boolean>;
}
