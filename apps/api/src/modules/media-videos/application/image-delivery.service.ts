import { Inject, Injectable } from '@nestjs/common';
import type { MediaPublicQuery } from '@apnatown/shared';
import { DomainError } from '../../../shared/errors/errors';
import { UNIT_OF_WORK, type UnitOfWork } from '../../../shared/persistence/ports';
import { IMAGE_PUBLICATION, LISTING_IMAGE_PUBLICATION, IMAGE_STORAGE, MEDIA_IMAGES, type ImagePublication, type ImageByteRange,
  type ImageRepository, type ImageStorage, type StoredImagePurpose } from '../domain/images';

/** Stored asset purpose each public placement type may serve. */
const PLACEMENT_PURPOSES: Readonly<Record<MediaPublicQuery['placementType'], StoredImagePurpose>> = Object.freeze({
  catalog_category: 'catalog_taxonomy', catalog_subcategory: 'catalog_taxonomy', product: 'product',
  service: 'service', business: 'business_profile', promotion: 'offer_banner',
  gallery_photo: 'gallery', video: 'video_thumbnail',
});

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
      const asset = await this.images.find(tx, assetId, PLACEMENT_PURPOSES[query.placementType]);
      const variant = asset?.variants.find((item) => item.width === query.variantWidth);
      if (!asset || asset.version !== query.assetVersion || !variant)
        throw new DomainError('MEDIA_NOT_FOUND');
      return variant;
    });
  }
}
