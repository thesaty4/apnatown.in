import { Module, type DynamicModule } from '@nestjs/common';
import {
  GUEST_CART_PURGE_STORE,
  GuestCartPurgeScheduler,
} from './application/guest-cart-purge';
import { PrismaGuestCartPurgeStore } from './infrastructure/guest-cart-purge.repository';

/** Worker-only cart jobs: Q-70 expired guest-cart purge. */
@Module({})
export class CartWorkerModule {
  static forRoot(runtime: DynamicModule): DynamicModule {
    return {
      module: CartWorkerModule,
      imports: [runtime],
      providers: [
        { provide: GUEST_CART_PURGE_STORE, useClass: PrismaGuestCartPurgeStore },
        GuestCartPurgeScheduler,
      ],
    };
  }
}
