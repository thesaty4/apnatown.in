import { Inject, Injectable } from '@nestjs/common';
import type { MediaPublicQuery } from '@apnatown/shared';
import { DomainError } from '../../../shared/errors/errors';
import { UNIT_OF_WORK, type UnitOfWork } from '../../../shared/persistence/ports';
import { IMAGE_PUBLICATION, IMAGE_STORAGE, MEDIA_IMAGES, type ImagePublication,
  type ImageRepository, type ImageStorage } from '../domain/images';

@Injectable()
export class ImageDeliveryService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(MEDIA_IMAGES) private readonly images: ImageRepository,
    @Inject(IMAGE_STORAGE) private readonly storage: ImageStorage,
    @Inject(IMAGE_PUBLICATION) private readonly publication: ImagePublication,
  ) {}
  async read(assetId: string, query: MediaPublicQuery) {
    const authorize = () => this.uow.run(async (tx) => {
      await this.publication.requirePublic(tx, { assetId, ...query });
      const asset = await this.images.find(tx, assetId);
      const variant = asset?.variants.find((item) => item.width === query.variantWidth);
      if (!asset || asset.version !== query.assetVersion || !variant)
        throw new DomainError('MEDIA_NOT_FOUND');
      return variant;
    });
    const variant = await authorize();
    const body = await this.storage.get(variant);
    await authorize();
    return body;
  }
}
