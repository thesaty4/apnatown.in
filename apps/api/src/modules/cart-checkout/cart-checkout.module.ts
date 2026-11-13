import { Module, type DynamicModule } from '@nestjs/common';
import { BusinessCartReadModule } from '../businesses/business-cart-read.module';
import { ProductsCartReadModule } from '../products/products-cart-read.module';
import { CartLinesService } from './application/cart-lines.service';
import { CartMergeService } from './application/cart-merge.service';
import { CART_REPOSITORY } from './application/cart-ports';
import { CartReadService } from './application/cart-read.service';
import { CartSupport } from './application/cart-support';
import { CheckoutAttemptService } from './application/checkout-attempt.service';
import { CheckoutPlacement } from './application/checkout-placement';
import { CHECKOUT_REPOSITORY } from './application/checkout-ports';
import { CheckoutQuoteBuilder } from './application/checkout-quote-builder';
import { CheckoutQuoteService } from './application/checkout-quote.service';
import { GuestCartCapability } from './application/guest-cart-capability';
import { PrismaCartRepository } from './infrastructure/cart.repository';
import { PrismaCheckoutRepository } from './infrastructure/checkout.repository';
import { CartLinesController } from './presentation/cart-lines.controller';
import { CartController } from './presentation/cart.controller';
import { CartQuoteController, CheckoutAttemptsController } from './presentation/checkout.controller';
import { GuestCartCookie } from './presentation/guest-cart.cookie';

/**
 * Cart-checkout: cart (F-CK-001) plus the server-priced quote and COD
 * checkout placement (F-CK-002..006). Prices/stock come from the Products
 * cart read port, shops from Businesses, addresses from Users, platform
 * rider fees from Geo, platform fee/COD flag from Settings; Orders creates
 * per-shop orders and Payments the cash allocations. `deps` must provide
 * Users (USERS_ADDRESS), GeoAdmin (GEO_DELIVERY), Settings (SETTINGS_READ),
 * Payments (PAYMENT_ORDER) and Orders (ORDERS_CREATION). Online payments and
 * coupons are not configured. Auth's SESSION_ACCESS is global.
 */
@Module({})
export class CartCheckoutModule {
  static forRoot(runtime: DynamicModule, deps: readonly DynamicModule[] = []): DynamicModule {
    return {
      module: CartCheckoutModule,
      imports: [
        runtime,
        ProductsCartReadModule.forRoot(runtime),
        BusinessCartReadModule.forRoot(runtime),
        ...deps,
      ],
      controllers: [CartController, CartLinesController, CartQuoteController, CheckoutAttemptsController],
      providers: [
        { provide: CART_REPOSITORY, useClass: PrismaCartRepository },
        { provide: CHECKOUT_REPOSITORY, useClass: PrismaCheckoutRepository },
        GuestCartCapability,
        GuestCartCookie,
        CartSupport,
        CartReadService,
        CartLinesService,
        CartMergeService,
        CheckoutQuoteBuilder,
        CheckoutQuoteService,
        CheckoutPlacement,
        CheckoutAttemptService,
      ],
    };
  }
}
