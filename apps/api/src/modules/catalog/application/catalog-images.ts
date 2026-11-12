import { Inject, Injectable } from '@nestjs/common';
import type { TaxonomyImage } from '@apnatown/shared/catalog';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import { MEDIA_IMAGES, publicImagePath, type ImagePlacement, type ImagePublication,
  type ImageRepository } from '../../media-videos/domain/images';
import { TAXONOMY_REPOSITORY, type TaxonomyRepository } from '../domain/catalog.repository';
import type { CatalogMediaAssetPort } from './catalog-ports';

@Injectable()
export class CatalogImages implements CatalogMediaAssetPort, ImagePublication {
  constructor(
    @Inject(MEDIA_IMAGES) private readonly images: ImageRepository,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
  ) {}
  async requireTaxonomyImage(tx: TxContext, assetId: string, userId: string) {
    const image = await this.images.find(tx, assetId);
    if (!image || image.ownerUserId !== userId)
      throw new DomainError('CATALOG_IMAGE_INVALID', { field: 'imageAssetId' });
  }
  async requirePublic(tx: TxContext, placement: ImagePlacement) {
    if (placement.placementType === 'catalog_category') {
      const category = await this.taxonomy.findCategory(tx, placement.placementId);
      if (category?.active && category.imageAssetId === placement.assetId) return;
    } else {
      const sub = await this.taxonomy.findSubcategory(tx, placement.placementId);
      const category = sub && await this.taxonomy.findCategory(tx, sub.categoryId);
      if (sub?.active && category?.active && sub.imageAssetId === placement.assetId) return;
    }
    throw new DomainError('MEDIA_NOT_FOUND');
  }
  async describe(tx: TxContext, placements: readonly ImagePlacement[]): Promise<Map<string, TaxonomyImage>> {
    const result = new Map<string, TaxonomyImage>();
    for (const placement of placements) {
      try {
        await this.requirePublic(tx, placement);
      } catch (error) {
        if (error instanceof DomainError && error.code === 'MEDIA_NOT_FOUND') continue;
        throw error;
      }
      const asset = await this.images.find(tx, placement.assetId);
      if (!asset) continue;
      const variant = asset.variants[asset.variants.length - 1]!;
      result.set(placement.placementId, {
        assetId: asset.id, mimeType: 'image/webp', width: variant.width, height: variant.height,
        path: publicImagePath(asset.id, {
          ...placement, surface: 'card', variantWidth: variant.width, assetVersion: asset.version,
        }),
        variants: asset.variants.map((item) => ({
          width: item.width, height: item.height, bytes: item.bytes, mimeType: 'image/webp',
          path: publicImagePath(asset.id, {
            ...placement, surface: 'card', variantWidth: item.width, assetVersion: asset.version,
          }),
        })),
      });
    }
    return result;
  }
}
