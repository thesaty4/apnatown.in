import { Injectable } from '@nestjs/common';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import { DomainError } from '../../../shared/errors/errors';
import type { ImagePlacement, ImagePublication } from '../domain/images';

/** Rechecked before AND after authenticated byte fetch by ImageDeliveryService. */
@Injectable()
export class PrismaListingImagePublication implements ImagePublication {
  constructor(private readonly db: PrismaDatabase) {}
  async requirePublic(tx: TxContext, placement: ImagePlacement): Promise<void> {
    const rows = await this.db.client(tx).$queryRaw<{ asset_id: string }[]>`
      SELECT asset_id FROM media_public_listing_images
      WHERE placement_type=${placement.placementType} AND placement_id=${placement.placementId}::uuid
        AND asset_id=${placement.assetId}::uuid LIMIT 1`;
    if (!rows.length) throw new DomainError('MEDIA_NOT_FOUND');
  }
}
