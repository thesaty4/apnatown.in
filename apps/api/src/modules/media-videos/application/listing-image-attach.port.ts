import type { TxContext } from '../../../shared/persistence/ports';

export const LISTING_IMAGE_ATTACH = Symbol('LISTING_IMAGE_ATTACH');

export type ListingImagePurpose =
  | 'product'
  | 'service'
  | 'business_profile_logo'
  | 'business_profile_cover';

export interface ListingImageRef {
  assetId: string;
  assetVersion: number;
  width: number;
  height: number;
}

/**
 * Owner-side contract for attaching uploaded public-purpose images to a
 * listing. Every asset must exist, be ready, match the purpose and have been
 * uploaded for the same business by the acting owner; otherwise MEDIA_NOT_FOUND.
 */
export interface ListingImageAttachPort {
  resolveOwned(
    tx: TxContext,
    input: {
      businessId: string;
      actorUserId: string;
      purpose: ListingImagePurpose;
      assetIds: readonly string[];
    },
  ): Promise<ListingImageRef[]>;
}
