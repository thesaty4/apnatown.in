import { createHash } from 'node:crypto';
import type {
  OwnerReviewFilter,
  ReviewPublicTargetType,
  ReviewReport,
} from '@apnatown/shared/reviews';
import type { TxContext } from '../../../shared/persistence/ports';
import type { PublicReviewRow, PublicReviewSummaryRow } from './reviews';

export interface OwnerReviewRow extends PublicReviewRow {
  targetType: ReviewPublicTargetType;
  targetNameEn: string | null;
  targetNameHi: string | null;
  reportedByMe: boolean;
}

export interface OwnerReviewPageRows {
  summary: PublicReviewSummaryRow;
  counts: { all: number; needs_reply: number; reported: number };
  rows: OwnerReviewRow[];
}

export interface OwnerReviewPageInput {
  businessId: string;
  subjectHash: Buffer;
  filter: OwnerReviewFilter;
  rating: number | undefined;
  take: number;
  after: { createdAt: string; id: string } | null;
}

export const REVIEW_OWNER_REPOSITORY = Symbol('REVIEW_OWNER_REPOSITORY');

/**
 * Owner side of one business's visible reviews (published/reported, not
 * deleted). Every write is scoped by `businessId`; a foreign or invisible
 * review simply matches no row.
 */
export interface ReviewOwnerRepository {
  page(tx: TxContext, input: OwnerReviewPageInput): Promise<OwnerReviewPageRows>;
  find(
    tx: TxContext,
    input: { reviewId: string; businessId: string; subjectHash: Buffer },
  ): Promise<OwnerReviewRow | null>;
  /** Business of a visible review, for owner authorization; null if none. */
  businessOf(tx: TxContext, reviewId: string): Promise<string | null>;
  /** Overwrites (text) or clears (null) the reply; false when no visible row. */
  setReply(
    tx: TxContext,
    input: { reviewId: string; businessId: string; text: string | null; at: Date },
  ): Promise<boolean>;
  /** Idempotent per subject; moves published -> reported (stays public). */
  report(
    tx: TxContext,
    input: {
      id: string;
      reviewId: string;
      reporterUserId: string;
      subjectHash: Buffer;
      report: ReviewReport;
      at: Date;
    },
  ): Promise<void>;
}

/** Stable reporter subject for a signed-in user (uniqueness key only). */
export function reporterSubject(userId: string): Buffer {
  return createHash('sha256').update(`review-report:user:${userId}`).digest();
}
