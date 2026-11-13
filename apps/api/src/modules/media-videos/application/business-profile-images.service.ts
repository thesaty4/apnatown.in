import { Inject, Injectable } from '@nestjs/common';
import { PublicImageVariantSchema } from '@apnatown/shared';
import { publicImagePath } from '../domain/images';
import {
  BUSINESS_PROFILE_IMAGE_SOURCE,
  type BusinessProfileImageSource,
  type BusinessProfileImagesPort,
  type BusinessProfileImageVariantRow,
  type PublicImageVariant,
} from './business-profile-images.port';

/**
 * Delivered width targets for the profile header (logo variants 160/320/640,
 * cover 480/960/1600/1920). TODO(verify): approved per-surface widths; the
 * largest variant not wider than the target is used, else the smallest.
 */
const TARGET_WIDTH = { logo: 320, cover: 960 } as const;

@Injectable()
export class BusinessProfileImagesService implements BusinessProfileImagesPort {
  constructor(
    @Inject(BUSINESS_PROFILE_IMAGE_SOURCE) private readonly source: BusinessProfileImageSource,
  ) {}

  async describe(businessId: string) {
    const rows = await this.source.variants(businessId);
    return {
      logo: this.pick(businessId, rows.filter((row) => row.subjectType === 'logo'), TARGET_WIDTH.logo),
      cover: this.pick(businessId, rows.filter((row) => row.subjectType === 'cover'), TARGET_WIDTH.cover),
    };
  }

  private pick(
    businessId: string, rows: BusinessProfileImageVariantRow[], target: number,
  ): PublicImageVariant | null {
    if (!rows.length) return null;
    const sorted = [...rows].sort((a, b) => a.width - b.width);
    const chosen = sorted.filter((row) => row.width <= target).at(-1) ?? sorted[0]!;
    const parsed = PublicImageVariantSchema.safeParse({
      width: chosen.width, height: chosen.height, mimeType: 'image/webp', bytes: chosen.bytes,
      path: publicImagePath(chosen.assetId, {
        placementType: 'business', placementId: businessId, surface: 'detail',
        variantWidth: chosen.width, assetVersion: chosen.assetVersion,
      }),
    });
    // A malformed stored variant degrades to "no image", never a broken URL.
    return parsed.success ? parsed.data : null;
  }
}
