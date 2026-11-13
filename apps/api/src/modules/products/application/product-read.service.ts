import { Inject, Injectable } from '@nestjs/common';
import { ProductPublicSchema, type ProductPublic } from '@apnatown/shared';
import { DomainError } from '../../../shared/errors/errors';

export const PRODUCT_READ = Symbol('PRODUCT_READ');
export interface ProductReadPort { bySlug(slug: string): Promise<ProductPublic | null> }
@Injectable()
export class ProductReadService {
  constructor(@Inject(PRODUCT_READ) private readonly products: ProductReadPort) {}
  async read(slug: string): Promise<ProductPublic> {
    const result = await this.products.bySlug(slug);
    if (!result) throw new DomainError('PRODUCT_NOT_FOUND');
    return ProductPublicSchema.parse(result);
  }
}
