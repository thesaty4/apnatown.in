import { Module, type DynamicModule } from '@nestjs/common';
import { BUSINESS_CART_READ } from './application/business-cart-read-port';
import { BUSINESS_CHECKOUT_READ } from './application/business-checkout-read-port';
import { PrismaBusinessCartReadRepository } from './infrastructure/business-cart-read.repository';
import { PrismaBusinessCheckoutReadRepository } from './infrastructure/business-checkout-read.repository';

/** Exposes only the Businesses-owned cart/checkout shop projections to Cart-checkout. */
@Module({})
export class BusinessCartReadModule {
  static forRoot(runtime: DynamicModule): DynamicModule {
    return {
      module: BusinessCartReadModule,
      imports: [runtime],
      providers: [
        { provide: BUSINESS_CART_READ, useClass: PrismaBusinessCartReadRepository },
        { provide: BUSINESS_CHECKOUT_READ, useClass: PrismaBusinessCheckoutReadRepository },
      ],
      exports: [BUSINESS_CART_READ, BUSINESS_CHECKOUT_READ],
    };
  }
}
