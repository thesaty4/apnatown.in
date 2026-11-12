import { z } from 'zod';
import {
  CountSchema,
  CursorSchema,
  IdSchema,
  PageQuerySchema,
  TimestampSchema,
} from './wire.js';
import { ImagePolicySchema } from './settings.js';

/**
 * Browser-facing image paths stay on the application origin so Media can
 * reauthorize the current placement instead of exposing provider URLs.
 */
export const MediaGatewayPathSchema = z
  .string()
  .min(2)
  .max(2048)
  .regex(
    /^\/(?!\/)(?!.*%(?![A-Fa-f0-9]{2}))[A-Za-z0-9._~!$&'()*+,;=:@%/-]+(?:\?[A-Za-z0-9._~%=&-]+)?$/u,
    'Expected a same-origin media path',
  )
  .describe(
    'Root-relative same-origin Media gateway path; provider URLs are invalid.',
  );

export const TaxonomyUploadBodySchema = z.strictObject({
  purpose: z.literal('catalog_taxonomy'),
});
export const PublicImageVariantSchema = z.strictObject({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  mimeType: z.literal('image/webp'),
  bytes: z.number().int().positive().max(122880),
  path: MediaGatewayPathSchema,
});
export const MediaUploadResultSchema = z.strictObject({
  assetId: IdSchema,
  status: z.literal('ready'),
  purpose: z.literal('catalog_taxonomy'),
  visibility: z.literal('public'),
  mimeType: z.literal('image/webp'),
  bytes: z.number().int().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  previewPath: MediaGatewayPathSchema,
});
export type MediaUploadResult = z.infer<typeof MediaUploadResultSchema>;
export const MediaPolicyResultSchema = z.strictObject({
  purpose: z.literal('catalog_taxonomy'),
  policy: ImagePolicySchema,
});
export const MediaAssetParamsSchema = z.strictObject({ assetId: IdSchema });
export const MediaPublicQuerySchema = z.strictObject({
  placementType: z.enum(['catalog_category', 'catalog_subcategory']),
  placementId: IdSchema,
  surface: z.enum(['card', 'detail', 'home']),
  variantWidth: z.coerce.number().int().min(1).max(640),
  assetVersion: z.coerce.number().int().positive(),
});
export type MediaPublicQuery = z.infer<typeof MediaPublicQuerySchema>;

const VideoIdSchema = z.string().regex(/^[A-Za-z0-9_-]{11}$/);
const InstagramCodeSchema = z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/);
const HttpsUrlSchema = z.string().url().refine((value) => {
  const url = new URL(value);
  return url.protocol === 'https:' && !url.username && !url.password && !url.port;
});

export const VideoSourceSchema = z.discriminatedUnion('provider', [
  z.strictObject({
    provider: z.literal('youtube'),
    kind: z.enum(['watch', 'shorts', 'share']),
    providerId: VideoIdSchema,
  }),
  z.strictObject({
    provider: z.literal('instagram'),
    kind: z.enum(['reel', 'p']),
    providerId: InstagramCodeSchema,
  }),
]);
export type VideoSource = z.infer<typeof VideoSourceSchema>;

export const VideoPlaybackSchema = z.discriminatedUnion('render', [
  z.strictObject({
    provider: z.literal('youtube'),
    render: z.literal('iframe'),
    embedUrl: HttpsUrlSchema.regex(/^https:\/\/www\.youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]{11}$/),
    openUrl: HttpsUrlSchema.regex(/^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/),
  }),
  z.strictObject({
    provider: z.literal('instagram'),
    render: z.literal('instagram'),
    permalink: HttpsUrlSchema.regex(/^https:\/\/www\.instagram\.com\/(?:reel|p)\/[A-Za-z0-9_-]{1,64}\/$/),
    openUrl: HttpsUrlSchema.regex(/^https:\/\/www\.instagram\.com\/(?:reel|p)\/[A-Za-z0-9_-]{1,64}\/$/),
  }),
  z.strictObject({
    provider: z.enum(['youtube', 'instagram']),
    render: z.literal('fallback'),
    openUrl: HttpsUrlSchema,
    reason: z.enum(['disabled', 'unavailable']),
  }),
]);
export const SafeVideoPlaybackSchema = VideoPlaybackSchema.superRefine((value, context) => {
  if (value.render !== 'fallback') return;
  const valid = value.provider === 'youtube'
    ? /^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/.test(value.openUrl)
    : /^https:\/\/www\.instagram\.com\/(?:reel|p)\/[A-Za-z0-9_-]{1,64}\/$/.test(value.openUrl);
  if (!valid) context.addIssue({ code: 'custom', path: ['openUrl'], message: 'Expected canonical provider URL' });
});
export type VideoPlayback = z.infer<typeof SafeVideoPlaybackSchema>;

export const VideoSourceInputSchema = z.strictObject({
  kind: z.enum(['youtube', 'instagram']),
  url: z.string().trim().min(1).max(2048),
});

export const CreateVideoSchema = z.strictObject({
  source: VideoSourceInputSchema,
  caption: z.string().trim().max(300).default(''),
  hashtags: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
  showInGallery: z.boolean().default(false),
  showInReels: z.boolean().default(false),
});
export type CreateVideo = z.infer<typeof CreateVideoSchema>;

export const VideoStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'removed',
]);

const VideoBaseSchema = z.strictObject({
  id: IdSchema,
  businessId: IdSchema,
  provider: z.enum(['youtube', 'instagram']),
  kind: z.enum(['watch', 'shorts', 'share', 'reel', 'p']),
  providerId: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/),
  status: VideoStatusSchema,
  caption: z.string().max(300),
  hashtags: z.array(z.string().max(40)).max(10),
  showInGallery: z.boolean(),
  showInReels: z.boolean(),
  version: z.number().int().min(1).max(2147483647),
  createdAt: TimestampSchema,
  playback: SafeVideoPlaybackSchema,
});

function refineVideo(video: z.infer<typeof VideoBaseSchema>, context: z.RefinementCtx) {
  const validKind =
    video.provider === 'youtube'
      ? ['watch', 'shorts', 'share'].includes(video.kind)
      : ['reel', 'p'].includes(video.kind);
  if (!validKind)
    context.addIssue({
      code: 'custom',
      path: ['kind'],
      message: 'Video kind must match its provider',
    });
  if (video.playback.provider !== video.provider)
    context.addIssue({
      code: 'custom',
      path: ['playback', 'provider'],
      message: 'Playback provider must match the video provider',
    });
}

export const VideoSchema = VideoBaseSchema.superRefine(refineVideo);
export type Video = z.infer<typeof VideoSchema>;

export const VideoFeedPillSchema = z.enum([
  'for_you',
  'following',
  'nearby',
  'category',
]);
export type VideoFeedPill = z.infer<typeof VideoFeedPillSchema>;
export const VideoFeedQuerySchema = z
  .strictObject({
    pill: VideoFeedPillSchema.default('for_you'),
    category: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    lat: z.coerce.number().finite().min(-90).max(90).optional(),
    lng: z.coerce.number().finite().min(-180).max(180).optional(),
    snapshotId: IdSchema.optional(),
    cursor: CursorSchema.optional(),
    limit: z.coerce.number().int().min(1).max(10).default(10),
  })
  .superRefine((query, context) => {
    if (query.pill === 'category' && !query.category)
      context.addIssue({
        code: 'custom',
        path: ['category'],
        message: 'A category is required for the category filter',
      });
    if (query.pill !== 'category' && query.category)
      context.addIssue({
        code: 'custom',
        path: ['category'],
        message: 'Category is valid only for the category filter',
      });
    if (query.pill === 'nearby' && (query.lat === undefined || query.lng === undefined))
      context.addIssue({
        code: 'custom',
        path: ['lat'],
        message: 'Nearby requires both coordinates',
      });
    if ((query.lat === undefined) !== (query.lng === undefined))
      context.addIssue({
        code: 'custom',
        path: ['lng'],
        message: 'Coordinates must be supplied together',
      });
    if (query.cursor && !query.snapshotId)
      context.addIssue({
        code: 'custom',
        path: ['snapshotId'],
        message: 'A cursor requires its snapshot',
      });
  });
export type VideoFeedQuery = z.infer<typeof VideoFeedQuerySchema>;

export const VideoFeedItemSchema = VideoBaseSchema.extend({
  businessNameEn: z.string().max(200).nullable(),
  businessNameHi: z.string().max(200).nullable(),
  verified: z.boolean(),
  distanceKm: z.number().finite().nonnegative().nullable(),
  isOpen: z.boolean().nullable(),
  viewCount: CountSchema,
  likeCount: CountSchema,
  commentCount: CountSchema,
  shareCount: CountSchema,
}).superRefine(refineVideo);
export type VideoFeedItem = z.infer<typeof VideoFeedItemSchema>;

export const VideoFeedPageSchema = z.strictObject({
  snapshotId: IdSchema,
  expiresAt: TimestampSchema,
  effectiveFilter: VideoFeedPillSchema,
  items: z.array(VideoFeedItemSchema).max(10),
  nextCursor: CursorSchema.nullable(),
});
export type VideoFeedPage = z.infer<typeof VideoFeedPageSchema>;

export const VideoPageSchema = z.strictObject({
  items: z.array(VideoSchema).max(50),
  nextCursor: z.string().max(2048).nullable(),
});

export const VideoModerationTabSchema = VideoStatusSchema.or(
  z.literal('reported'),
);
export type VideoModerationTab = z.infer<typeof VideoModerationTabSchema>;

export const VideoModerationQuerySchema = PageQuerySchema.extend({
  tab: VideoModerationTabSchema.default('pending'),
});
export type VideoModerationQuery = z.infer<typeof VideoModerationQuerySchema>;

export const VideoModerationItemSchema = VideoBaseSchema.extend({
  decisionReason: z.string().max(500).nullable(),
  businessNameEn: z.string().max(200).nullable(),
  businessNameHi: z.string().max(200).nullable(),
}).superRefine(refineVideo);
export type VideoModerationItem = z.infer<typeof VideoModerationItemSchema>;

export const MediaReportReasonSchema = z.enum([
  'inappropriate',
  'misleading',
  'spam',
  'copyright',
  'other',
]);
export const CreateVideoReportSchema = z.strictObject({
  reason: MediaReportReasonSchema,
  details: z.string().trim().max(500).optional(),
});
export type CreateVideoReport = z.infer<typeof CreateVideoReportSchema>;

export const VideoReportAcceptedSchema = z.strictObject({
  reportId: IdSchema,
});
export type VideoReportAccepted = z.infer<typeof VideoReportAcceptedSchema>;

export const VideoReportQueueItemSchema = z.strictObject({
  queueItemType: z.literal('report'),
  reportId: IdSchema,
  targetKind: z.literal('video'),
  videoId: IdSchema,
  reason: MediaReportReasonSchema,
  details: z.string().max(500).nullable(),
  status: z.literal('open'),
  reportVersion: z.number().int().positive(),
  targetVersion: z.number().int().positive(),
  createdAt: TimestampSchema,
  allowedActions: z.array(z.enum(['dismiss', 'remove'])).min(1).max(2),
  video: VideoModerationItemSchema,
});
export type VideoReportQueueItem = z.infer<typeof VideoReportQueueItemSchema>;

export const VideoModerationQueueItemSchema = z.discriminatedUnion(
  'queueItemType',
  [
    VideoModerationItemSchema.extend({
      queueItemType: z.literal('video'),
    }),
    VideoReportQueueItemSchema,
  ],
);
export type VideoModerationQueueItem = z.infer<
  typeof VideoModerationQueueItemSchema
>;

export const VideoModerationCountsSchema = z.strictObject({
  pending: z.number().int().min(0),
  approved: z.number().int().min(0),
  rejected: z.number().int().min(0),
  removed: z.number().int().min(0),
  reported: z.number().int().min(0),
});

export const VideoModerationPageSchema = z.strictObject({
  items: z.array(VideoModerationQueueItemSchema).max(50),
  nextCursor: z.string().max(2048).nullable(),
  counts: VideoModerationCountsSchema,
});
export type VideoModerationPage = z.infer<typeof VideoModerationPageSchema>;

export const MediaReportDecisionSchema = z.strictObject({
  action: z.enum(['dismiss', 'remove']),
  reason: z.string().trim().min(1).max(500).optional(),
  expectedVersion: z.number().int().min(1).max(2147483647),
  targetVersion: z.number().int().min(1).max(2147483647),
}).superRefine((decision, context) => {
  if (decision.action === 'remove' && !decision.reason)
    context.addIssue({
      code: 'custom',
      path: ['reason'],
      message: 'A removal reason is required',
    });
});
export type MediaReportDecision = z.infer<typeof MediaReportDecisionSchema>;

export const MediaReportDecisionResultSchema = z.strictObject({
  reportId: IdSchema,
  status: z.literal('resolved'),
  resolution: z.enum(['dismissed', 'removed']),
  reportVersion: z.number().int().positive(),
  targetStatus: VideoStatusSchema,
  targetVersion: z.number().int().positive(),
});
export type MediaReportDecisionResult = z.infer<
  typeof MediaReportDecisionResultSchema
>;

export const VideoModerationDecisionSchema = z.strictObject({
  action: z.enum(['approve', 'reject', 'remove']),
  reason: z.string().trim().min(1).max(500).optional(),
  expectedVersion: z.number().int().min(1).max(2147483647),
}).superRefine((decision, context) => {
  if (decision.action === 'reject' && !decision.reason)
    context.addIssue({
      code: 'custom',
      path: ['reason'],
      message: 'A rejection reason is required',
    });
});
export type VideoModerationDecision = z.infer<typeof VideoModerationDecisionSchema>;
