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
