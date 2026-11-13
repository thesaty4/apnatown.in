import { z } from 'zod';
import {
  CountSchema,
  CursorSchema,
  IdSchema,
  TimestampSchema,
  VersionSchema,
} from './wire.js';
import {
  MediaGatewayPathSchema,
  MediaReportReasonSchema,
  PublicImageVariantSchema,
  SafeVideoPlaybackSchema,
  VideoSchema,
  VideoSourceInputSchema,
} from './media.js';

/**
 * Business Gallery, public business videos, linked videos and the owner
 * Gallery/Videos manager (Media BE spec endpoints F-PF-009/010, F-PD-005,
 * F-SV-004, F-VD-012). Image paths are same-origin Media gateway paths that
 * reauthorize the exact current placement on every read.
 */

/** Live gallery-only photos per business. TODO(verify) product limit. */
export const GALLERY_PHOTOS_MAX = 200;
/** Upper bound of an owner manager order array (videos or gallery). */
export const MEDIA_MANAGER_LIST_MAX = 500;

const limit = (max: number, fallback: number) =>
  z.preprocess(
    (value) =>
      typeof value === 'string' && /^[1-9]\d{0,2}$/.test(value)
        ? Number(value)
        : value,
    z.number().int().min(1).max(max).default(fallback),
  );

export const MediaLinkTargetSchema = z.strictObject({
  targetType: z.enum(['product', 'service']),
  targetId: IdSchema,
});
export type MediaLinkTarget = z.infer<typeof MediaLinkTargetSchema>;

/** Report/queue placement vocabulary for a public photo. */
export const MediaPhotoPlacementTypeSchema = z.enum([
  'gallery_photo',
  'product_image',
  'service_image',
]);
export type MediaPhotoPlacementType = z.infer<typeof MediaPhotoPlacementTypeSchema>;

/** Public, placement-bound image: intrinsic size plus gateway variants. */
export const MediaPublicImageSchema = z.strictObject({
  assetId: IdSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  variants: z.array(PublicImageVariantSchema).min(1).max(4),
});
export type MediaPublicImage = z.infer<typeof MediaPublicImageSchema>;

/** Public video card (no moderation status, version or consent flags). */
export const PublicVideoCardSchema = z.strictObject({
  videoId: IdSchema,
  businessId: IdSchema,
  provider: z.enum(['youtube', 'instagram']),
  providerKind: z.enum(['watch', 'shorts', 'share', 'reel', 'p']),
  providerId: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/),
  caption: z.string().max(300),
  hashtags: z.array(z.string().max(40)).max(10),
  playback: SafeVideoPlaybackSchema,
  thumbnail: MediaPublicImageSchema.nullable(),
  viewCount: CountSchema,
  createdAt: TimestampSchema,
});
export type PublicVideoCard = z.infer<typeof PublicVideoCardSchema>;

export const PublicVideoCardPageSchema = z.strictObject({
  items: z.array(PublicVideoCardSchema).max(50),
  nextCursor: CursorSchema.nullable(),
});
export type PublicVideoCardPage = z.infer<typeof PublicVideoCardPageSchema>;

export const BusinessVideosQuerySchema = z.strictObject({
  cursor: CursorSchema.optional(),
  limit: limit(50, 20),
});
export type BusinessVideosQuery = z.infer<typeof BusinessVideosQuerySchema>;

export const LinkedVideosQuerySchema = z.strictObject({
  targetType: z.enum(['product', 'service']),
  targetId: IdSchema,
  cursor: CursorSchema.optional(),
  limit: limit(20, 10),
});
export type LinkedVideosQuery = z.infer<typeof LinkedVideosQuerySchema>;

export const BusinessGalleryFilterSchema = z.enum([
  'all',
  'photos',
  'videos',
  'product',
  'service',
]);
export type BusinessGalleryFilter = z.infer<typeof BusinessGalleryFilterSchema>;

export const BusinessGalleryQuerySchema = z.strictObject({
  filter: BusinessGalleryFilterSchema.default('all'),
  cursor: CursorSchema.optional(),
  limit: limit(50, 24),
});
export type BusinessGalleryQuery = z.infer<typeof BusinessGalleryQuerySchema>;

export const GalleryPhotoItemSchema = z.strictObject({
  kind: z.literal('photo'),
  assetId: IdSchema,
  placementType: MediaPhotoPlacementTypeSchema,
  /** gallery_photos row ID, Product ID or Service ID respectively. */
  placementId: IdSchema,
  businessId: IdSchema,
  caption: z.string().max(300).nullable(),
  linkedTarget: MediaLinkTargetSchema.nullable(),
  publicPath: MediaGatewayPathSchema,
  image: MediaPublicImageSchema,
});
export const GalleryVideoItemSchema = PublicVideoCardSchema.extend({
  kind: z.literal('video'),
});
export const GalleryItemSchema = z.discriminatedUnion('kind', [
  GalleryPhotoItemSchema,
  GalleryVideoItemSchema,
]);
export type GalleryItem = z.infer<typeof GalleryItemSchema>;

export const BusinessGalleryPageSchema = z.strictObject({
  filter: BusinessGalleryFilterSchema,
  items: z.array(GalleryItemSchema).max(50),
  nextCursor: CursorSchema.nullable(),
});
export type BusinessGalleryPage = z.infer<typeof BusinessGalleryPageSchema>;

const uniqueLinks = (
  links: readonly MediaLinkTarget[] | undefined,
  context: z.RefinementCtx,
) => {
  const keys = new Set(links?.map((l) => `${l.targetType}:${l.targetId}`));
  if (links && keys.size !== links.length)
    context.addIssue({ code: 'custom', path: ['links'], message: 'Duplicate link target' });
};

/** Owner `PATCH /businesses/me/videos/{id}`; never accepts a file source. */
export const VideoEditSchema = z
  .strictObject({
    source: VideoSourceInputSchema.optional(),
    /** null clears the thumbnail; the asset must be own `video_thumbnail`. */
    thumbnailAssetId: IdSchema.nullable().optional(),
    caption: z.string().trim().max(300).optional(),
    hashtags: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
    links: z.array(MediaLinkTargetSchema).max(10).optional(),
    showInGallery: z.boolean().optional(),
    showInReels: z.boolean().optional(),
    resubmit: z.literal(true).optional(),
    expectedVersion: VersionSchema,
  })
  .superRefine((edit, context) => uniqueLinks(edit.links, context));
export type VideoEdit = z.infer<typeof VideoEditSchema>;

export const ExpectedVersionBodySchema = z.strictObject({
  expectedVersion: VersionSchema,
});
export type ExpectedVersionBody = z.infer<typeof ExpectedVersionBodySchema>;

/** Owner preview reference; previewPath is the owner-only preview route. */
export const OwnerMediaPreviewSchema = z.strictObject({
  assetId: IdSchema,
  previewPath: MediaGatewayPathSchema,
});

export const OwnerVideoDetailSchema = z.strictObject({
  video: VideoSchema,
  thumbnail: OwnerMediaPreviewSchema.nullable(),
  links: z.array(MediaLinkTargetSchema).max(10),
  decisionReason: z.string().max(500).nullable(),
  ownerDeleted: z.boolean(),
});
export type OwnerVideoDetail = z.infer<typeof OwnerVideoDetailSchema>;

export const CreateGalleryPhotoSchema = z.strictObject({
  assetId: IdSchema,
  caption: z.string().trim().max(200).optional(),
  linkedTarget: MediaLinkTargetSchema.optional(),
});
export type CreateGalleryPhoto = z.infer<typeof CreateGalleryPhotoSchema>;

export const UpdateGalleryPhotoSchema = z.strictObject({
  caption: z.string().trim().max(200).nullable().optional(),
  linkedTarget: MediaLinkTargetSchema.nullable().optional(),
  expectedVersion: VersionSchema,
});
export type UpdateGalleryPhoto = z.infer<typeof UpdateGalleryPhotoSchema>;

export const OwnerGalleryPhotoSchema = z.strictObject({
  id: IdSchema,
  businessId: IdSchema,
  assetId: IdSchema,
  caption: z.string().max(200).nullable(),
  linkedTarget: MediaLinkTargetSchema.nullable(),
  preview: OwnerMediaPreviewSchema,
  moderationState: z.enum(['allowed', 'removed']),
  version: VersionSchema,
  createdAt: TimestampSchema,
});
export type OwnerGalleryPhoto = z.infer<typeof OwnerGalleryPhotoSchema>;

export const OwnerGalleryPageSchema = z.strictObject({
  items: z.array(OwnerGalleryPhotoSchema).max(50),
  nextCursor: CursorSchema.nullable(),
});
export type OwnerGalleryPage = z.infer<typeof OwnerGalleryPageSchema>;

export const MediaOrderSchema = z.strictObject({
  orderedIds: z.array(IdSchema).max(MEDIA_MANAGER_LIST_MAX),
  orderVersion: VersionSchema,
});
export type MediaOrder = z.infer<typeof MediaOrderSchema>;

export const UpdateMediaOrderSchema = z
  .strictObject({
    orderedIds: z.array(IdSchema).max(MEDIA_MANAGER_LIST_MAX),
    expectedOrderVersion: VersionSchema,
  })
  .superRefine((body, context) => {
    if (new Set(body.orderedIds).size !== body.orderedIds.length)
      context.addIssue({ code: 'custom', path: ['orderedIds'], message: 'Duplicate ID' });
  });
export type UpdateMediaOrder = z.infer<typeof UpdateMediaOrderSchema>;

export const CreatePhotoReportSchema = z.strictObject({
  placementType: MediaPhotoPlacementTypeSchema,
  placementId: IdSchema,
  reason: MediaReportReasonSchema,
  details: z.string().trim().max(500).optional(),
});
export type CreatePhotoReport = z.infer<typeof CreatePhotoReportSchema>;

/** Path params of owner `/businesses/me/{videos|gallery}/{id}` routes. */
export const MediaItemParamsSchema = z.strictObject({ id: IdSchema });
export type MediaItemParams = z.infer<typeof MediaItemParamsSchema>;

/** Path params of `POST /media/photos/{assetId}/reports`. */
export const MediaPhotoParamsSchema = z.strictObject({ assetId: IdSchema });
export type MediaPhotoParams = z.infer<typeof MediaPhotoParamsSchema>;
