import { Module, type DynamicModule } from '@nestjs/common';
import { BusinessCartReadModule } from '../businesses/business-cart-read.module';
import { ProductsCartReadModule } from '../products/products-cart-read.module';
import { CartLinesService } from './application/cart-lines.service';
import { CartMergeService } from './application/cart-merge.service';
import { CART_REPOSITORY } from './application/cart-ports';
import { CartReadService } from './application/cart-read.service';
import { CartSupport } from './application/cart-support';
import { GuestCartCapability } from './application/guest-cart-capability';
import { PrismaCartRepository } from './infrastructure/cart.repository';
import { CartLinesController } from './presentation/cart-lines.controller';
import { CartController } from './presentation/cart.controller';
import { GuestCartCookie } from './presentation/guest-cart.cookie';

/**
 * Cart-checkout (cart part: F-CK-001). Prices/stock/labels come only from
 * the Products cart read port and shop summaries from the Businesses port.
 * Quote, checkout attempts, orders and payments are not part of this module
 * yet. Auth's SESSION_ACCESS is global.
 */
@Module({})
export class CartCheckoutModule {
  static forRoot(runtime: DynamicModule): DynamicModule {
    return {
      module: CartCheckoutModule,
      imports: [
        runtime,
        ProductsCartReadModule.forRoot(runtime),
        BusinessCartReadModule.forRoot(runtime),
      ],
      controllers: [CartController, CartLinesController],
      providers: [
        { provide: CART_REPOSITORY, useClass: PrismaCartRepository },
        GuestCartCapability,
        GuestCartCookie,
        CartSupport,
        CartReadService,
        CartLinesService,
        CartMergeService,
      ],
    };
  }
}
