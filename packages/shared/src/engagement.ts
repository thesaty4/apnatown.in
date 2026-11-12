import { z } from 'zod';
import {
  CountSchema,
  CursorSchema,
  IdSchema,
  PageQuerySchema,
  TimestampSchema,
  VersionSchema,
} from './wire.js';

export const VideoLikeResultSchema = z.strictObject({
  liked: z.boolean(),
  likeCount: CountSchema,
});
export type VideoLikeResult = z.infer<typeof VideoLikeResultSchema>;

export const EngagementStateQuerySchema = z.strictObject({
  videoIds: z.string().max(1849).refine(
    (value) => z.array(IdSchema).min(1).max(50).safeParse(value.split(',')).success,
    'Expected at most 50 comma-separated video IDs',
  ).optional(),
});
export type EngagementStateQuery = z.infer<typeof EngagementStateQuerySchema>;

export const EngagementStateSchema = z.strictObject({
  likedVideoIds: z.array(IdSchema).max(50),
  videoCounts: z.array(z.strictObject({
    videoId: IdSchema,
    likeCount: CountSchema,
  })).max(50),
});
export type EngagementState = z.infer<typeof EngagementStateSchema>;

export const VideoCommentStatusSchema = z.enum(['pending', 'published', 'removed']);
export type VideoCommentStatus = z.infer<typeof VideoCommentStatusSchema>;
export const VideoCommentTextSchema = z.string().trim().min(1).max(500);
export const VideoCommentCreateSchema = z.strictObject({
  text: VideoCommentTextSchema,
});
export type VideoCommentCreate = z.infer<typeof VideoCommentCreateSchema>;

export const VideoCommentPublicQuerySchema = PageQuerySchema;
export const VideoCommentAdminQuerySchema = PageQuerySchema.extend({
  status: VideoCommentStatusSchema,
});
export type VideoCommentAdminQuery = z.infer<typeof VideoCommentAdminQuerySchema>;

export const VideoCommentSchema = z.strictObject({
  id: IdSchema,
  videoId: IdSchema,
  authorLabel: z.string().min(1).max(100),
  text: VideoCommentTextSchema,
  status: VideoCommentStatusSchema,
  reason: z.string().max(500).nullable(),
  version: VersionSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type VideoComment = z.infer<typeof VideoCommentSchema>;

export const VideoCommentPublicItemSchema = VideoCommentSchema.extend({
  canDelete: z.boolean(),
});
export type VideoCommentPublicItem = z.infer<
  typeof VideoCommentPublicItemSchema
>;

export const VideoCommentPublicPageSchema = z.strictObject({
  items: z.array(VideoCommentPublicItemSchema),
  nextCursor: CursorSchema.nullable(),
});
export type VideoCommentPublicPage = z.infer<typeof VideoCommentPublicPageSchema>;

export const VideoCommentAdminItemSchema = VideoCommentSchema.extend({
  businessId: IdSchema,
  allowedActions: z.array(z.enum(['publish', 'remove'])).max(2),
});
export const VideoCommentAdminPageSchema = z.strictObject({
  items: z.array(VideoCommentAdminItemSchema),
  counts: z.strictObject({
    pending: CountSchema,
    published: CountSchema,
    removed: CountSchema,
  }),
  nextCursor: CursorSchema.nullable(),
});
export type VideoCommentAdminPage = z.infer<typeof VideoCommentAdminPageSchema>;

export const VideoCommentDecisionSchema = z
  .strictObject({
    action: z.enum(['publish', 'remove']),
    reason: z.string().trim().min(1).max(500).optional(),
    expectedVersion: VersionSchema,
  })
  .superRefine((decision, context) => {
    if (decision.action === 'remove' && !decision.reason)
      context.addIssue({
        code: 'custom',
        path: ['reason'],
        message: 'A removal reason is required',
      });
  });
export type VideoCommentDecision = z.infer<typeof VideoCommentDecisionSchema>;

export const VideoCommentDecisionResultSchema = z.strictObject({
  comment: VideoCommentAdminItemSchema,
  publishedCommentCount: CountSchema,
});
export type VideoCommentDecisionResult = z.infer<
  typeof VideoCommentDecisionResultSchema
>;

export const VideoCommentEventPayloadSchema = z.strictObject({
  commentId: IdSchema,
  videoId: IdSchema,
  businessId: IdSchema,
  authorUserId: IdSchema,
  scope: z.strictObject({ cityId: IdSchema.nullable(), areaId: IdSchema.nullable() }),
  fromStatus: VideoCommentStatusSchema.nullable(),
  toStatus: VideoCommentStatusSchema,
  version: VersionSchema,
  publishedCountDelta: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
});
export type VideoCommentEventPayload = z.infer<
  typeof VideoCommentEventPayloadSchema
>;
