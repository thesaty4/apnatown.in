import { Module, type DynamicModule } from '@nestjs/common';
import { PAYMENT_ORDER } from './application/payment-order-port';
import { PrismaPaymentAttemptRepository } from './infrastructure/payment-attempt.repository';

/**
 * Payments order allocations (payments BE spec, cash/COD subset). Online
 * providers, refunds, compensation and earnings are not implemented; the
 * checkout rejects online methods with CHECKOUT_PAYMENT_UNAVAILABLE.
 */
@Module({})
export class PaymentsOrderModule {
  static forRoot(runtime: DynamicModule): DynamicModule {
    return {
      module: PaymentsOrderModule,
      imports: [runtime],
      providers: [{ provide: PAYMENT_ORDER, useClass: PrismaPaymentAttemptRepository }],
      exports: [PAYMENT_ORDER],
    };
  }
}
