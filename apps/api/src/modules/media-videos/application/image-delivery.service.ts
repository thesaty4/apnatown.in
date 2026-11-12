import { Inject, Injectable } from '@nestjs/common';
import type { MediaPublicQuery } from '@apnatown/shared';
import { DomainError } from '../../../shared/errors/errors';
import { UNIT_OF_WORK, type UnitOfWork } from '../../../shared/persistence/ports';
import { IMAGE_PUBLICATION, LISTING_IMAGE_PUBLICATION, IMAGE_STORAGE, MEDIA_IMAGES, type ImagePublication, type ImageByteRange,
  type ImageRepository, type ImageStorage } from '../domain/images';

@Injectable()
export class ImageDeliveryService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(MEDIA_IMAGES) private readonly images: ImageRepository,
    @Inject(IMAGE_STORAGE) private readonly storage: ImageStorage,
    @Inject(IMAGE_PUBLICATION) private readonly publication: ImagePublication,
    @Inject(LISTING_IMAGE_PUBLICATION) private readonly listings: ImagePublication,
  ) {}
  /** Current authorization is mandatory even for HEAD, 304 and invalid ranges. */
  async describe(assetId: string, query: MediaPublicQuery) {
    const variant = await this.authorize(assetId,query);
    return { bytes: variant.bytes };
  }
  async read(assetId: string, query: MediaPublicQuery, range?: ImageByteRange) {
    const variant = await this.authorize(assetId,query);
    const body = await this.storage.get(variant,range);
    await this.authorize(assetId,query);
    return body;
  }
  private authorize(assetId: string, query: MediaPublicQuery) {
    return this.uow.run(async (tx) => {
      const taxonomy = query.placementType === 'catalog_category' || query.placementType === 'catalog_subcategory';
      await (taxonomy ? this.publication : this.listings).requirePublic(tx, { assetId, ...query });
      const purpose = taxonomy ? 'catalog_taxonomy' : query.placementType === 'business'
        ? 'business_profile' : query.placementType as 'product' | 'service';
      const asset = await this.images.find(tx, assetId, purpose);
      const variant = asset?.variants.find((item) => item.width === query.variantWidth);
      if (!asset || asset.version !== query.assetVersion || !variant)
        throw new DomainError('MEDIA_NOT_FOUND');
      return variant;
    });
  }
}
