import { z } from 'zod';
import { CursorSchema, IdSchema, PageQuerySchema, TimestampSchema, VersionSchema } from './wire.js';
import { MediaReportReasonSchema, VideoReportQueueItemSchema } from './media.js';
import { MediaPhotoPlacementTypeSchema, MediaPublicImageSchema } from './media-gallery.js';

/**
 * Typed admin media-report queue (`GET /admin/media-reports`): open video and
 * photo reports in one keyset page, discriminated by `targetKind`. Photo
 * previews are placement-bound same-origin gateway descriptors only, present
 * while the placement is currently public; never storage/provider URLs.
 */

export const MediaReportTargetKindSchema = z.enum(['video', 'photo']);
export type MediaReportTargetKind = z.infer<typeof MediaReportTargetKindSchema>;

export const AdminMediaReportsQuerySchema = PageQuerySchema.extend({
  targetKind: z.enum(['all', 'video', 'photo']).default('all'),
});
export type AdminMediaReportsQuery = z.infer<typeof AdminMediaReportsQuerySchema>;

export const AdminReportedPhotoSchema = z.strictObject({
  assetId: IdSchema,
  placementType: MediaPhotoPlacementTypeSchema,
  /** gallery_photos row ID, Product ID or Service ID respectively. */
  placementId: IdSchema,
  businessId: IdSchema,
  businessNameEn: z.string().max(200).nullable(),
  businessNameHi: z.string().max(200).nullable(),
  /** `removed` hides the asset from every public placement and the gateway. */
  moderationState: z.enum(['allowed', 'removed']),
  /** Gateway descriptor of the reported placement; null once not public. */
  preview: MediaPublicImageSchema.nullable(),
});
export type AdminReportedPhoto = z.infer<typeof AdminReportedPhotoSchema>;

export const PhotoReportQueueItemSchema = z.strictObject({
  queueItemType: z.literal('report'),
  reportId: IdSchema,
  targetKind: z.literal('photo'),
  assetId: IdSchema,
  placementType: MediaPhotoPlacementTypeSchema,
  placementId: IdSchema,
  reason: MediaReportReasonSchema,
  details: z.string().max(500).nullable(),
  status: z.literal('open'),
  reportVersion: VersionSchema,
  /** Media asset version; send back as `targetVersion` on decision. */
  targetVersion: VersionSchema,
  createdAt: TimestampSchema,
  allowedActions: z.array(z.enum(['dismiss', 'remove'])).min(1).max(2),
  photo: AdminReportedPhotoSchema,
});
export type PhotoReportQueueItem = z.infer<typeof PhotoReportQueueItemSchema>;

export const AdminMediaReportItemSchema = z.discriminatedUnion('targetKind', [
  VideoReportQueueItemSchema,
  PhotoReportQueueItemSchema,
]);
export type AdminMediaReportItem = z.infer<typeof AdminMediaReportItemSchema>;

export const AdminMediaReportCountsSchema = z.strictObject({
  total: z.number().int().min(0),
  video: z.number().int().min(0),
  photo: z.number().int().min(0),
});
export type AdminMediaReportCounts = z.infer<typeof AdminMediaReportCountsSchema>;

export const AdminMediaReportPageSchema = z.strictObject({
  items: z.array(AdminMediaReportItemSchema).max(50),
  nextCursor: CursorSchema.nullable(),
  counts: AdminMediaReportCountsSchema,
});
export type AdminMediaReportPage = z.infer<typeof AdminMediaReportPageSchema>;
