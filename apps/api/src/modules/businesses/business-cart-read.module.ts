import { Module, type DynamicModule } from '@nestjs/common';
import { BUSINESS_CART_READ } from './application/business-cart-read-port';
import { PrismaBusinessCartReadRepository } from './infrastructure/business-cart-read.repository';

/** Exposes only the Businesses-owned cart shop summary to Cart-checkout. */
@Module({})
export class BusinessCartReadModule {
  static forRoot(runtime: DynamicModule): DynamicModule {
    return {
      module: BusinessCartReadModule,
      imports: [runtime],
      providers: [
        { provide: BUSINESS_CART_READ, useClass: PrismaBusinessCartReadRepository },
      ],
      exports: [BUSINESS_CART_READ],
    };
  }
}
