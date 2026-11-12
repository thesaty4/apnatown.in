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
