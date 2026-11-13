import type { PublicImageVariantSchema } from '@apnatown/shared';
import type { z } from 'zod';

export const BUSINESS_PROFILE_IMAGES = Symbol('BUSINESS_PROFILE_IMAGES');
export const BUSINESS_PROFILE_IMAGE_SOURCE = Symbol('BUSINESS_PROFILE_IMAGE_SOURCE');

export type PublicImageVariant = z.infer<typeof PublicImageVariantSchema>;

/**
 * Media-owned public descriptors for a business's attached logo/cover. Only
 * an approved public business's own, allowed, non-removed WebP asset that is
 * currently attached as exactly that logo/cover resolves; else null.
 */
export interface BusinessProfileImagesPort {
  describe(businessId: string): Promise<{ logo: PublicImageVariant | null; cover: PublicImageVariant | null }>;
}

export interface BusinessProfileImageVariantRow {
  assetId: string;
  subjectType: 'logo' | 'cover';
  assetVersion: number;
  width: number;
  height: number;
  bytes: number;
}

/** Internal Media read; never returns provider IDs or storage keys. */
export interface BusinessProfileImageSource {
  variants(businessId: string): Promise<BusinessProfileImageVariantRow[]>;
}
