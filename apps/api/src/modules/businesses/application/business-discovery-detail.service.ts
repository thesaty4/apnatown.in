import { Inject, Injectable } from '@nestjs/common';
import { BusinessDiscoveryDetailSchema, type BusinessDiscoveryDetail } from '@apnatown/shared';
import { DomainError } from '../../../shared/errors/errors';
import {
  BUSINESS_PROFILE_IMAGES,
  type BusinessProfileImagesPort,
} from '../../media-videos/application/business-profile-images.port';
export const BUSINESS_DISCOVERY_DETAIL = Symbol('BUSINESS_DISCOVERY_DETAIL');
/** Businesses-owned facts; Media owns the logo/cover descriptors. */
export type BusinessDiscoveryDetailBase = Omit<BusinessDiscoveryDetail, 'profile'> & {
  profile: Omit<BusinessDiscoveryDetail['profile'], 'logo' | 'cover'>;
};
export interface BusinessDiscoveryDetailPort { bySlug(slug: string): Promise<BusinessDiscoveryDetailBase | null> }
@Injectable()
export class BusinessDiscoveryDetailService {
  constructor(
    @Inject(BUSINESS_DISCOVERY_DETAIL) private readonly businesses: BusinessDiscoveryDetailPort,
    @Inject(BUSINESS_PROFILE_IMAGES) private readonly images: BusinessProfileImagesPort,
  ) {}
  async read(slug: string): Promise<BusinessDiscoveryDetail> {
    const result = await this.businesses.bySlug(slug);
    if (!result) throw new DomainError('COMMON_NOT_FOUND');
    const { logo, cover } = await this.images.describe(result.item.id);
    return BusinessDiscoveryDetailSchema.parse({ ...result, profile: { ...result.profile, logo, cover } });
  }
}
