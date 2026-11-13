import { Module, type DynamicModule } from '@nestjs/common';
import { PRODUCT_CART_READ } from './application/product-cart-read-port';
import { PrismaProductCartReadRepository } from './infrastructure/product-cart-read.repository';

/** Exposes only the Products-owned cart read port to Cart-checkout. */
@Module({})
export class ProductsCartReadModule {
  static forRoot(runtime: DynamicModule): DynamicModule {
    return {
      module: ProductsCartReadModule,
      imports: [runtime],
      providers: [
        { provide: PRODUCT_CART_READ, useClass: PrismaProductCartReadRepository },
      ],
      exports: [PRODUCT_CART_READ],
    };
  }
}
