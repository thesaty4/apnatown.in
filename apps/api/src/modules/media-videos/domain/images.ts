import { z } from 'zod';
import type { ImagePolicy } from '@apnatown/shared/settings';
import type { CommandContext, TxContext } from '../../../shared/persistence/ports';
import type { MediaPublicQuery, MediaUploadPurpose } from '@apnatown/shared';

export const MEDIA_IMAGES = Symbol('MEDIA_IMAGES');
export const IMAGE_STORAGE = Symbol('IMAGE_STORAGE');
export const IMAGE_PROCESSOR = Symbol('IMAGE_PROCESSOR');
export const IMAGE_PUBLICATION = Symbol('IMAGE_PUBLICATION');
export const LISTING_IMAGE_PUBLICATION = Symbol('LISTING_IMAGE_PUBLICATION');
export interface ImagePlacement {
  assetId: string;
  placementId: string;
  placementType: MediaPublicQuery['placementType'];
  /** Gallery surface additionally requires current Gallery consent. */
  surface?: MediaPublicQuery['surface'];
}
export interface ImagePublication {
  requirePublic(tx: TxContext, placement: ImagePlacement): Promise<void>;
}
export function publicImagePath(assetId: string, query: MediaPublicQuery): string {
  const search = new URLSearchParams({
    placementType: query.placementType, placementId: query.placementId,
    surface: query.surface, variantWidth: String(query.variantWidth),
    assetVersion: String(query.assetVersion),
  });
  return `/api/media/public/${assetId}?${search.toString()}`;
}
export const StoredVariantSchema = z.strictObject({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  bytes: z.number().int().positive().max(358400),
  publicId: z.string().regex(/^apnatown\/[a-f0-9-]{36}\/[0-9]+$/),
  providerAssetId: z.string().min(1).max(128),
  providerVersion: z.number().int().positive(),
});
export type StoredVariant = z.infer<typeof StoredVariantSchema>;
export interface ProcessedImage {
  width: number;
  height: number;
  variants: { width: number; height: number; body: Buffer }[];
}
export interface ImageProcessor {
  process(file: Buffer, mime: string, policy: ImagePolicy): Promise<ProcessedImage>;
}
export interface ImageStorage {
  readonly configured: boolean;
  put(publicId: string, image: ProcessedImage['variants'][number]): Promise<StoredVariant>;
  get(variant: StoredVariant, range?: ImageByteRange): Promise<Buffer>;
  remove(publicId: string): Promise<void>;
}
export interface ImageByteRange { readonly start: number; readonly end: number }
/** Persisted `media_assets.purpose`; logo/cover share `business_profile`. */
export type StoredImagePurpose =
  | 'catalog_taxonomy'
  | 'product'
  | 'service'
  | 'business_profile'
  | 'offer_banner'
  | 'gallery'
  | 'video_thumbnail';
export type ProfileImageSubject = 'logo' | 'cover';
export interface StoredPurpose {
  purpose: StoredImagePurpose;
  subjectType: ProfileImageSubject | null;
}
const STORED_PURPOSES: Readonly<Record<MediaUploadPurpose, StoredPurpose>> = Object.freeze({
  catalog_taxonomy: { purpose: 'catalog_taxonomy', subjectType: null },
  product: { purpose: 'product', subjectType: null },
  service: { purpose: 'service', subjectType: null },
  business_profile_logo: { purpose: 'business_profile', subjectType: 'logo' },
  business_profile_cover: { purpose: 'business_profile', subjectType: 'cover' },
  gallery: { purpose: 'gallery', subjectType: null },
  video_thumbnail: { purpose: 'video_thumbnail', subjectType: null },
});
export const storedPurpose = (purpose: MediaUploadPurpose): StoredPurpose => STORED_PURPOSES[purpose];
/** Inverse of storedPurpose; null for a row outside the upload purposes. */
export function uploadPurpose(purpose: string, subjectType: string | null): MediaUploadPurpose | null {
  const match = (Object.entries(STORED_PURPOSES) as [MediaUploadPurpose, StoredPurpose][])
    .find(([, stored]) => stored.purpose === purpose && stored.subjectType === subjectType);
  return match ? match[0] : null;
}
export interface StoredImage {
  id: string;
  ownerUserId: string;
  /** Upload purpose (Settings policy key), reconstructed from purpose+subject. */
  purpose: MediaUploadPurpose;
  /** Business the asset was uploaded for; null for global taxonomy assets. */
  businessId: string | null;
  width: number;
  height: number;
  bytes: number;
  version: number;
  variants: StoredVariant[];
}
export interface ImageOperation {
  id: string;
  policy: ImagePolicy;
  ready: boolean;
}
export interface ImageRepository {
  reserve(tx: TxContext, command: CommandContext, policy: ImagePolicy, id: string, leaseId: string): Promise<ImageOperation>;
  commit(tx: TxContext, id: string, leaseId: string, image: StoredImage): Promise<void>;
  find(tx: TxContext, id: string, purpose?: StoredImagePurpose): Promise<StoredImage | null>;
  /** Ready, allowed, non-deleted asset of any upload purpose (replay/preview). */
  findUpload(tx: TxContext, id: string): Promise<StoredImage | null>;
  /**
   * Share-locks the caller's ready assets of exactly this purpose uploaded
   * for this business, inside the attaching transaction.
   */
  lockOwned(tx: TxContext, input: {
    assetIds: readonly string[]; ownerUserId: string; businessId: string; purpose: MediaUploadPurpose;
  }): Promise<Pick<StoredImage, 'id' | 'version' | 'width' | 'height'>[]>;
  release(tx: TxContext, id: string, leaseId: string): Promise<void>;
  claimCleanup(tx: TxContext): Promise<ImageOperation[]>;
  finishCleanup(tx: TxContext, id: string): Promise<void>;
}
export const variantKey = (id: string, width: number) => `apnatown/${id}/${width}`;
