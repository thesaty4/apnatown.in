import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import {
  LISTING_IMAGE_ATTACH,
  type ListingImageAttachPort,
} from '../../media-videos/application/listing-image-attach.port';
import {
  UnavailableBusinessMediaAssets,
  type BusinessMediaAssetPort,
} from '../application/business-ports';

/**
 * Binds profile logo/cover attachment to Media's owner-attach validation
 * (asset uploaded by this owner for this business as exactly a logo or a
 * cover, ready and not removed). Images are uploaded through
 * `POST /media/uploads`; the legacy Businesses multipart upload, private
 * documents and public profile descriptors stay unavailable here.
 */
@Injectable()
export class MediaBusinessAssets implements BusinessMediaAssetPort {
  private readonly unavailable = new UnavailableBusinessMediaAssets();

  constructor(
    @Inject(LISTING_IMAGE_ATTACH)
    private readonly media: ListingImageAttachPort,
  ) {}

  uploadProfileImage(): Promise<never> {
    return this.unavailable.uploadProfileImage();
  }

  uploadPrivateDocument(): Promise<never> {
    return this.unavailable.uploadPrivateDocument();
  }

  async requireAttachableImage(
    tx: TxContext,
    input: {
      assetId: string;
      businessId: string;
      ownerUserId: string;
      purpose: 'logo' | 'cover';
    },
  ): Promise<void> {
    try {
      await this.media.resolveOwned(tx, {
        businessId: input.businessId,
        actorUserId: input.ownerUserId,
        purpose:
          input.purpose === 'logo'
            ? 'business_profile_logo'
            : 'business_profile_cover',
        assetIds: [input.assetId],
      });
    } catch (error) {
      if (error instanceof DomainError && error.code === 'MEDIA_NOT_FOUND')
        throw new DomainError('BUSINESS_MEDIA_INVALID', {
          field: input.purpose === 'logo' ? 'logoAssetId' : 'coverAssetId',
        });
      throw error;
    }
  }

  describePublic(): ReturnType<BusinessMediaAssetPort['describePublic']> {
    return this.unavailable.describePublic();
  }
}
