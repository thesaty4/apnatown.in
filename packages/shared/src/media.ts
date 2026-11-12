import { z } from 'zod';
import { IdSchema } from './wire.js';
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
