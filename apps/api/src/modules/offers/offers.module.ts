import { Module, type DynamicModule } from '@nestjs/common';
import { ApprovedSellerAccess } from '../businesses/application/approved-seller-access';
import { OwnerOffersService } from './application/owner-offers.service';
import { OWNER_OFFER_REPOSITORY } from './domain/owner-offers';
import { PrismaOwnerOfferRepository } from './infrastructure/prisma-owner-offer.repository';
import { OwnerOffersController } from './presentation/owner-offers.controller';

/**
 * Owner offers (S-VEND-07). Imports: runtime (PrismaDatabase, UoW,
 * command UoW/context factory, CURSOR_CODEC, CLOCK, ID_PROVIDER) and
 * BusinessContext (BusinessOwnerContext for ApprovedSellerAccess).
 * Admin approval, public offers and coupons are separate slices.
 */
@Module({})
export class OffersModule {
  static forRoot(imports: readonly DynamicModule[]): DynamicModule {
    return {
      module: OffersModule,
      imports: [...imports],
      controllers: [OwnerOffersController],
      providers: [
        OwnerOffersService,
        ApprovedSellerAccess,
        { provide: OWNER_OFFER_REPOSITORY, useClass: PrismaOwnerOfferRepository },
      ],
    };
  }
}
