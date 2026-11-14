import { z } from 'zod';
import {
  CountSchema,
  CursorSchema,
  IdSchema,
  TimestampSchema,
} from './wire.js';

// Public review read contract (specs/reviews/be/reviews.md, GET /reviews).
// Rider reviews have no public listing (RV-Q3), so `rider` is not accepted.
export const REVIEW_PUBLIC_TARGET_TYPES = ['product', 'service', 'business'] as const;
export const ReviewPublicTargetTypeSchema = z.enum(REVIEW_PUBLIC_TARGET_TYPES);
export type ReviewPublicTargetType = z.infer<typeof ReviewPublicTargetTypeSchema>;

export const REVIEW_SORTS = ['recent', 'helpful'] as const;
export const ReviewSortSchema = z.enum(REVIEW_SORTS);
export type ReviewSort = z.infer<typeof ReviewSortSchema>;

// Only these statuses are ever publicly visible; `reported` stays public.
export const ReviewPublicStatusSchema = z.enum(['published', 'reported']);
export type ReviewPublicStatus = z.infer<typeof ReviewPublicStatusSchema>;

export const ReviewRatingSchema = z.number().int().min(1).max(5);

export const ReviewListQuerySchema = z.strictObject({
  targetType: ReviewPublicTargetTypeSchema,
  targetId: IdSchema,
  sort: ReviewSortSchema.default('recent'),
  cursor: CursorSchema.optional(),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});
export type ReviewListQuery = z.infer<typeof ReviewListQuerySchema>;

export const ReviewCardSchema = z.strictObject({
  id: IdSchema,
  // First name + last initial only (e.g. "Sunita G."); never a phone number.
  authorLabel: z.string().min(1).max(64),
  rating: ReviewRatingSchema,
  text: z.string().min(1).max(1000),
  tags: z.array(z.string().min(1).max(40)).max(10),
  helpfulCount: CountSchema,
  ownerReply: z.string().min(1).max(1000).nullable(),
  ownerRepliedAt: TimestampSchema.nullable(),
  createdAt: TimestampSchema,
  status: ReviewPublicStatusSchema,
});
export type ReviewCard = z.infer<typeof ReviewCardSchema>;

export const ReviewSummarySchema = z.strictObject({
  // One decimal place; null when there are no visible reviews.
  average: z.number().min(1).max(5).nullable(),
  count: CountSchema,
  // Counts indexed by star: [1★, 2★, 3★, 4★, 5★].
  breakdown: z.array(CountSchema).length(5),
});
export type ReviewSummary = z.infer<typeof ReviewSummarySchema>;

export const ReviewPageSchema = z.strictObject({
  summary: ReviewSummarySchema,
  items: z.array(ReviewCardSchema),
  nextCursor: CursorSchema.nullable(),
});
export type ReviewPage = z.infer<typeof ReviewPageSchema>;

/** "Sunita Gupta" -> "Sunita G."; a single name stays as is. */
export function reviewAuthorLabel(displayName: string | null | undefined): string {
  const parts = (displayName ?? '').trim().split(/\s+/u).filter(Boolean);
  const first = parts[0];
  if (!first || /\d{3,}/u.test(displayName ?? '')) return 'Customer';
  const last = parts.length > 1 ? parts.at(-1) : undefined;
  const initial = last ? Array.from(last)[0]?.toLocaleUpperCase('en-IN') : undefined;
  return (initial ? `${first} ${initial}.` : first).slice(0, 64);
}

// ---------------------------------------------------------------------------
// Owner reviews (S-VEND-09 / S-PROV-10, F-VD-010, F-RV-007). The business is
// resolved from the session; the client never names it.
// ---------------------------------------------------------------------------

export const OWNER_REVIEW_FILTERS = ['all', 'needs_reply', 'reported'] as const;
export const OwnerReviewFilterSchema = z.enum(OWNER_REVIEW_FILTERS);
export type OwnerReviewFilter = z.infer<typeof OwnerReviewFilterSchema>;

export const OwnerReviewQuerySchema = z.strictObject({
  filter: OwnerReviewFilterSchema.default('all'),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  cursor: CursorSchema.optional(),
  limit: z.coerce.number().int().min(1).max(20).default(20),
});
export type OwnerReviewQuery = z.infer<typeof OwnerReviewQuerySchema>;

export const OwnerReviewCardSchema = ReviewCardSchema.extend({
  targetType: ReviewPublicTargetTypeSchema,
  /** Product/service name (EN/HI); null for the business/profile itself. */
  targetNameEn: z.string().nullable(),
  targetNameHi: z.string().nullable(),
  /** The caller already reported this review (Reported reflects open reports). */
  reportedByMe: z.boolean(),
});
export type OwnerReviewCard = z.infer<typeof OwnerReviewCardSchema>;

export const OwnerReviewPageSchema = z.strictObject({
  summary: ReviewSummarySchema,
  counts: z.strictObject({
    all: CountSchema,
    needs_reply: CountSchema,
    reported: CountSchema,
  }),
  items: z.array(OwnerReviewCardSchema),
  nextCursor: CursorSchema.nullable(),
});
export type OwnerReviewPage = z.infer<typeof OwnerReviewPageSchema>;

/** Plain text; editing a reply overwrites it (rule 5). */
export const OwnerReviewReplySchema = z.strictObject({
  text: z.string().trim().min(1).max(1000),
});
export type OwnerReviewReply = z.infer<typeof OwnerReviewReplySchema>;

export const REVIEW_REPORT_REASONS = ['abusive', 'spam', 'fake', 'other'] as const;
export const ReviewReportSchema = z.strictObject({
  reason: z.enum(REVIEW_REPORT_REASONS),
  details: z.string().trim().max(500).optional(),
});
export type ReviewReport = z.infer<typeof ReviewReportSchema>;
export const ReviewReportResultSchema = z.strictObject({
  reported: z.literal(true),
});

// ---------------------------------------------------------------------------
// Customer self list (S-CUST-23 / account "My reviews"). Read-only: includes
// pending/hidden items the customer wrote, with the current target label.
// ---------------------------------------------------------------------------

export const MY_REVIEW_STATUSES = [
  'pending',
  'published',
  'reported',
  'hidden',
] as const;
export const MyReviewStatusSchema = z.enum(MY_REVIEW_STATUSES);
export type MyReviewStatus = z.infer<typeof MyReviewStatusSchema>;

export const MyReviewSchema = z.strictObject({
  id: IdSchema,
  targetType: z.enum(['product', 'service', 'business', 'rider']),
  targetId: IdSchema,
  targetNameEn: z.string().nullable(),
  targetNameHi: z.string().nullable(),
  /** Same-origin listing path; null for rider reviews or removed targets. */
  targetPath: z.string().min(1).max(2048).nullable(),
  rating: ReviewRatingSchema,
  text: z.string().min(1).max(1000),
  status: MyReviewStatusSchema,
  helpfulCount: CountSchema,
  ownerReply: z.string().min(1).max(1000).nullable(),
  createdAt: TimestampSchema,
});
export type MyReview = z.infer<typeof MyReviewSchema>;

export const MyReviewPageSchema = z.strictObject({
  items: z.array(MyReviewSchema).max(50),
});
export type MyReviewPage = z.infer<typeof MyReviewPageSchema>;
