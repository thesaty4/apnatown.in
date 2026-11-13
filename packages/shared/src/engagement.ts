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

export const EngagementTargetSchema = z.strictObject({
  targetType: z.enum(['photo', 'video']),
  targetId: IdSchema,
});
export type EngagementTarget = z.infer<typeof EngagementTargetSchema>;

export const ServiceBookmarkTargetTypeSchema = z.literal('service');
export const ServiceBookmarkTargetSchema = z.strictObject({
  targetType: ServiceBookmarkTargetTypeSchema,
  targetId: IdSchema,
});
export type ServiceBookmarkTarget = z.infer<typeof ServiceBookmarkTargetSchema>;
export const ServiceBookmarkResultSchema = z.strictObject({ bookmarked: z.boolean() });
export type ServiceBookmarkResult = z.infer<typeof ServiceBookmarkResultSchema>;

const EngagementTargetQuerySchema = z.string().min(1).max(2249).refine(
  (value) => value.split(',').length <= 50 && value.split(',').every((target) => {
    const [targetType, targetId, ...extra] = target.split(':');
    return (
      extra.length === 0 &&
      (targetType === 'photo' || targetType === 'video' || targetType === 'service') &&
      IdSchema.safeParse(targetId).success
    );
  }),
  'Expected at most 50 comma-separated typed target IDs',
);

const EngagementBusinessQuerySchema = z.string().min(1).max(1849).refine(
  (value) => z.array(IdSchema).min(1).max(50).safeParse(value.split(',')).success,
  'Expected at most 50 comma-separated business IDs',
);

export const EngagementStateQuerySchema = z.strictObject({
  videoIds: z.string().max(1849).refine(
    (value) => z.array(IdSchema).min(1).max(50).safeParse(value.split(',')).success,
    'Expected at most 50 comma-separated video IDs',
  ).optional(),
  targets: EngagementTargetQuerySchema.optional(),
  businessIds: EngagementBusinessQuerySchema.optional(),
}).superRefine((query, context) => {
  const videoIds = query.videoIds?.toLowerCase().split(',') ?? [];
  const targets = query.targets?.toLowerCase().split(',').map((target) => {
    const [targetType, targetId] = target.split(':');
    return `${targetType}:${targetId}`;
  }) ?? [];
  const businessIds = query.businessIds?.toLowerCase().split(',') ?? [];
  if (
    new Set([
      ...videoIds.map((id) => `video:${id}`),
      ...targets,
      ...businessIds.map((id) => `business:${id}`),
    ]).size > 50
  )
    context.addIssue({ code: 'custom', path: ['targets'], message: 'At most 50 engagement targets are allowed' });
});
export type EngagementStateQuery = z.infer<typeof EngagementStateQuerySchema>;

export const EngagementBusinessStateSchema = z.strictObject({
  businessId: IdSchema,
  following: z.boolean(),
  bellOn: z.boolean(),
});

export const EngagementStateSchema = z.strictObject({
  likedVideoIds: z.array(IdSchema).max(50),
  videoCounts: z.array(z.strictObject({
    videoId: IdSchema,
    likeCount: CountSchema,
  })).max(50),
  heartedTargets: z.array(EngagementTargetSchema).max(50).default([]),
  bookmarkedServiceIds: z.array(IdSchema).max(50).default([]),
  businessStates: z.array(EngagementBusinessStateSchema).max(50).default([]),
});
export type EngagementState = z.infer<typeof EngagementStateSchema>;

export const FollowUpdateSchema = z.strictObject({
  sourceVideoId: IdSchema,
  bellOn: z.boolean().optional(),
});
export type FollowUpdate = z.infer<typeof FollowUpdateSchema>;

export const FollowResultSchema = z.strictObject({
  following: z.boolean(),
  bellOn: z.boolean(),
  followerCount: CountSchema,
});
export type FollowResult = z.infer<typeof FollowResultSchema>;

export const VideoHeartTargetTypeSchema = z.literal('video');
export const VideoHeartResultSchema = z.strictObject({ hearted: z.boolean() });
export type VideoHeartResult = z.infer<typeof VideoHeartResultSchema>;

export const VideoShareChannelSchema = z.enum(['whatsapp', 'copy', 'native']);
export type VideoShareChannel = z.infer<typeof VideoShareChannelSchema>;

export const VideoShareCreateSchema = z.strictObject({
  targetType: z.literal('video'),
  targetId: IdSchema,
  channel: VideoShareChannelSchema,
});
export type VideoShareCreate = z.infer<typeof VideoShareCreateSchema>;

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

// ---------------------------------------------------------------------------
// Owner followers + announcements (S-VEND-15 / S-PROV-11, F-VD-015, F-NT-003).
// ---------------------------------------------------------------------------

const IstDate = z.iso.date();

export const FOLLOWER_ANNOUNCEMENT_KINDS = ['product', 'service', 'offer', 'video'] as const;
export const FollowerAnnouncementKindSchema = z.enum(FOLLOWER_ANNOUNCEMENT_KINDS);
export type FollowerAnnouncementKind = z.infer<typeof FollowerAnnouncementKindSchema>;

export const FollowerAnnouncementSchema = z.strictObject({
  id: IdSchema,
  kind: FollowerAnnouncementKindSchema,
  messageEn: z.string().nullable(),
  messageHi: z.string().nullable(),
  createdAt: TimestampSchema,
});
export type FollowerAnnouncement = z.infer<typeof FollowerAnnouncementSchema>;

/**
 * Eight Monday-based IST weeks (oldest first, current partial week last).
 * `gained` = first-ever follows; `total` = closing active followers, known
 * only for the current week until daily snapshots exist (never reconstructed).
 */
export const FollowerInsightsSchema = z.strictObject({
  followers: CountSchema,
  gainedThisWeek: CountSchema,
  approvedVideos: CountSchema,
  growth: z
    .array(
      z.strictObject({
        start: IstDate,
        end: IstDate,
        total: CountSchema.nullable(),
        gained: CountSchema,
      }),
    )
    .length(8),
  asOf: TimestampSchema,
  definitionVersion: z.literal('reporting-v1'),
  unavailable: z.array(z.enum(['weekly_totals_history'])),
  recentAnnouncements: z.array(FollowerAnnouncementSchema).max(3),
});
export type FollowerInsights = z.infer<typeof FollowerInsightsSchema>;

/** Target picking from a listing is not available yet, so no `targetId`. */
export const FollowerAnnouncementCreateSchema = z.strictObject({
  kind: FollowerAnnouncementKindSchema,
  messageEn: z.string().trim().min(1).max(200),
  messageHi: z.string().trim().min(1).max(200).optional(),
});
export type FollowerAnnouncementCreate = z.infer<typeof FollowerAnnouncementCreateSchema>;

/** Queued for followers with the bell on; not a claim of delivery. */
export const FollowerAnnouncementResultSchema = z.strictObject({
  announcementId: IdSchema,
  status: z.literal('queued'),
  eligibleRecipients: CountSchema,
});
export type FollowerAnnouncementResult = z.infer<typeof FollowerAnnouncementResultSchema>;

export const FOLLOWER_ANNOUNCEMENT_CREATED = 'engagement.announcement_created';
export const FollowerAnnouncementCreatedPayloadSchema = z.strictObject({
  announcementId: IdSchema,
  businessId: IdSchema,
  kind: FollowerAnnouncementKindSchema,
  source: z.literal('owner_announcement'),
});
export type FollowerAnnouncementCreatedPayload = z.infer<
  typeof FollowerAnnouncementCreatedPayloadSchema
>;
