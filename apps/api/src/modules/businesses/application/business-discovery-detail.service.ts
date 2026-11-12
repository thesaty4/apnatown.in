import { Inject, Injectable } from '@nestjs/common';
import { BusinessDiscoveryDetailSchema, type BusinessDiscoveryDetail } from '@apnatown/shared';
import { DomainError } from '../../../shared/errors/errors';
export const BUSINESS_DISCOVERY_DETAIL = Symbol('BUSINESS_DISCOVERY_DETAIL');
export interface BusinessDiscoveryDetailPort { bySlug(slug: string): Promise<BusinessDiscoveryDetail | null> }
@Injectable()
export class BusinessDiscoveryDetailService {
  constructor(@Inject(BUSINESS_DISCOVERY_DETAIL) private readonly businesses: BusinessDiscoveryDetailPort) {}
  async read(slug: string): Promise<BusinessDiscoveryDetail> {
    const result = await this.businesses.bySlug(slug);
    if (!result) throw new DomainError('COMMON_NOT_FOUND');
    return BusinessDiscoveryDetailSchema.parse(result);
  }
}
