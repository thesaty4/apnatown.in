import { Module, type DynamicModule } from '@nestjs/common';
import { ApprovedSellerAccess } from '../businesses/application/approved-seller-access';
import { EARNINGS_READ } from './application/earnings-ports';
import { OwnerEarningsService } from './application/owner-earnings.service';
import { PrismaEarningsRepository } from './infrastructure/earnings.repository';
import { OwnerEarningsController } from './presentation/owner-earnings.controller';

/**
 * Owner Earnings & plan reads (S-VEND-16). Imports: runtime, BusinessContext
 * (ApprovedSellerAccess) and Settings (SETTINGS_READ for plans/commission/
 * promotion fees). Purchases, payouts and invoices are not implemented.
 */
@Module({})
export class PaymentsOwnerModule {
  static forRoot(imports: readonly DynamicModule[]): DynamicModule {
    return {
      module: PaymentsOwnerModule,
      imports: [...imports],
      controllers: [OwnerEarningsController],
      providers: [
        OwnerEarningsService,
        ApprovedSellerAccess,
        { provide: EARNINGS_READ, useClass: PrismaEarningsRepository },
      ],
    };
  }
}
