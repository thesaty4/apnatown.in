import type { ReviewPublicTargetType, ReviewSort } from '@apnatown/shared/reviews';

/** Keyset position for the public list; tuple order matches each sort. */
export type ReviewPosition =
  | { sort: 'recent'; createdAt: string; id: string }
  | { sort: 'helpful'; helpfulCount: number; createdAt: string; id: string };

export interface PublicReviewRow {
  id: string;
  authorDisplayName: string | null;
  rating: number;
  text: string;
  tags: string[];
  helpfulCount: number;
  ownerReply: string | null;
  ownerRepliedAt: string | null;
  createdAt: string;
  status: 'published' | 'reported';
}

export interface PublicReviewSummaryRow {
  count: number;
  average: number | null;
  breakdown: [number, number, number, number, number];
}

export interface PublicReviewPageInput {
  targetType: ReviewPublicTargetType;
  targetId: string;
  sort: ReviewSort;
  /** Rows requested; callers ask for limit + 1 to detect a next page. */
  take: number;
  after: ReviewPosition | null;
}

export interface PublicReviewPageRows {
  summary: PublicReviewSummaryRow;
  rows: PublicReviewRow[];
}

export const REVIEW_PUBLIC_READ = Symbol('REVIEW_PUBLIC_READ');
export interface ReviewPublicReadRepository {
  /** `null` when the target itself is not publicly visible. */
  page(input: PublicReviewPageInput): Promise<PublicReviewPageRows | null>;
}
