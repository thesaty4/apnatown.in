import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import { MEDIA_IMAGES, type ImageRepository } from '../domain/images';
import type {
  ListingImageAttachPort,
  ListingImagePurpose,
  ListingImageRef,
} from './listing-image-attach.port';

/**
 * AssetPort.validateAttachment for owner listing/profile images. Runs inside
 * the consumer's attaching transaction and share-locks the matched rows so a
 * concurrent removal cannot slip between validation and attachment. Same
 * business alone never authorizes another user's asset.
 */
@Injectable()
export class ListingImageAttachService implements ListingImageAttachPort {
  constructor(@Inject(MEDIA_IMAGES) private readonly images: ImageRepository) {}

  async resolveOwned(
    tx: TxContext,
    input: {
      businessId: string;
      actorUserId: string;
      purpose: ListingImagePurpose;
      assetIds: readonly string[];
    },
  ): Promise<ListingImageRef[]> {
    if (!input.assetIds.length) return [];
    const rows = await this.images.lockOwned(tx, {
      assetIds: input.assetIds,
      ownerUserId: input.actorUserId,
      businessId: input.businessId,
      purpose: input.purpose,
    });
    const byId = new Map(rows.map((row) => [row.id.toLowerCase(), row]));
    // Input order is the consumer's display order.
    return input.assetIds.map((assetId) => {
      const row = byId.get(assetId.toLowerCase());
      if (!row) throw new DomainError('MEDIA_NOT_FOUND');
      return {
        assetId: row.id,
        assetVersion: row.version,
        width: row.width,
        height: row.height,
      };
    });
  }
}
