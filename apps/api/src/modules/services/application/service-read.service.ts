import { Inject, Injectable } from '@nestjs/common';
import { ServicePublicSchema, type ServicePublic } from '@apnatown/shared';
import { DomainError } from '../../../shared/errors/errors';
export const SERVICE_READ = Symbol('SERVICE_READ');
export interface ServiceReadPort { bySlug(slug: string): Promise<ServicePublic | null> }
@Injectable()
export class ServiceReadService {
  constructor(@Inject(SERVICE_READ) private readonly services: ServiceReadPort) {}
  async read(slug: string): Promise<ServicePublic> {
    const result = await this.services.bySlug(slug);
    if (!result) throw new DomainError('COMMON_NOT_FOUND');
    return ServicePublicSchema.parse(result);
  }
}
