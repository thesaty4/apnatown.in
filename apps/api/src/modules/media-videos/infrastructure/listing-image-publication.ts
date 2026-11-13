import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import { DomainError } from '../../../shared/errors/errors';
import type { ImagePlacement, ImagePublication } from '../domain/images';
import { businessProfileImageVariants } from './business-profile-images';

/** Rechecked before AND after authenticated byte fetch by ImageDeliveryService. */
@Injectable()
export class PrismaListingImagePublication implements ImagePublication {
  constructor(private readonly db: PrismaDatabase) {}
  async requirePublic(tx: TxContext, placement: ImagePlacement): Promise<void> {
    const client = this.db.client(tx);
    if (placement.placementType === 'gallery_photo' || placement.placementType === 'video')
      return this.requireMediaPlacement(tx, placement);
    if (placement.placementType === 'promotion')
      return this.requirePromotion(tx, placement);
    // Gallery surface: the listing image must also carry current Gallery consent.
    if (placement.surface === 'gallery' && placement.placementType !== 'business'
      && !(await this.galleryRow(tx, `${placement.placementType}_image`, placement)))
      throw new DomainError('MEDIA_NOT_FOUND');
    const rows = await client.$queryRaw<{ asset_id: string }[]>`
      SELECT asset_id FROM media_public_listing_images
      WHERE placement_type=${placement.placementType} AND placement_id=${placement.placementId}::uuid
        AND asset_id=${placement.assetId}::uuid LIMIT 1`;
    if (rows.length) return;
    // Public profile header: the business's currently attached logo/cover.
    if (placement.placementType === 'business') {
      const profile = await client.$queryRaw<{ assetId: string }[]>(Prisma.sql`
        SELECT p."assetId" FROM (${businessProfileImageVariants(placement.placementId, placement.assetId)}) p LIMIT 1`);
      if (profile.length) return;
    }
    throw new DomainError('MEDIA_NOT_FOUND');
  }

  /** Hero/local banner backgrounds: only a live public placement may serve. */
  private async requirePromotion(tx: TxContext, placement: ImagePlacement): Promise<void> {
    const rows = await this.db.client(tx).$queryRaw<{ id: string }[]>`
      SELECT id::text AS id FROM promotion_placements_public
      WHERE id=${placement.placementId}::uuid AND banner_asset_id=${placement.assetId}::uuid
      LIMIT 1`;
    if (!rows.length) throw new DomainError('MEDIA_NOT_FOUND');
  }

  /** Gallery-only photos and video thumbnails are Media-owned placements. */
  private async requireMediaPlacement(tx: TxContext, placement: ImagePlacement): Promise<void> {
    if (placement.placementType === 'gallery_photo') {
      if (await this.galleryRow(tx, 'gallery_photo', placement)) return;
      throw new DomainError('MEDIA_NOT_FOUND');
    }
    const rows = await this.db.client(tx).$queryRaw<{ id: string }[]>`
      SELECT id::text AS id FROM media_public_videos
      WHERE id=${placement.placementId}::uuid AND thumbnail_asset_id=${placement.assetId}::uuid
        AND (show_in_reels OR show_in_gallery) LIMIT 1`;
    if (!rows.length) throw new DomainError('MEDIA_NOT_FOUND');
  }

  private async galleryRow(tx: TxContext, placementType: string, placement: ImagePlacement) {
    const rows = await this.db.client(tx).$queryRaw<{ found: number }[]>`
      SELECT 1 AS found FROM media_public_gallery_items
      WHERE placement_type=${placementType} AND placement_id=${placement.placementId}::uuid
        AND asset_id=${placement.assetId}::uuid LIMIT 1`;
    return rows.length > 0;
  }
}
