import { z } from 'zod';
import type { ImagePolicy } from '@apnatown/shared/settings';
import type { CommandContext, TxContext } from '../../../shared/persistence/ports';
import type { MediaPublicQuery } from '@apnatown/shared';

export const MEDIA_IMAGES = Symbol('MEDIA_IMAGES');
export const IMAGE_STORAGE = Symbol('IMAGE_STORAGE');
export const IMAGE_PROCESSOR = Symbol('IMAGE_PROCESSOR');
export const IMAGE_PUBLICATION = Symbol('IMAGE_PUBLICATION');
export const LISTING_IMAGE_PUBLICATION = Symbol('LISTING_IMAGE_PUBLICATION');
export interface ImagePlacement {
  assetId: string;
  placementId: string;
  placementType: MediaPublicQuery['placementType'];
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
export interface StoredImage {
  id: string;
  ownerUserId: string;
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
  find(tx: TxContext, id: string, purpose?: 'catalog_taxonomy' | 'product' | 'service' | 'business_profile'): Promise<StoredImage | null>;
  release(tx: TxContext, id: string, leaseId: string): Promise<void>;
  claimCleanup(tx: TxContext): Promise<ImageOperation[]>;
  finishCleanup(tx: TxContext, id: string): Promise<void>;
}
export const variantKey = (id: string, width: number) => `apnatown/${id}/${width}`;
