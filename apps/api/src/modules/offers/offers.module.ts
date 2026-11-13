import { Module, type DynamicModule } from '@nestjs/common';
import { ApprovedSellerAccess } from '../businesses/application/approved-seller-access';
import { OwnerOffersService } from './application/owner-offers.service';
import { PublicPromotionsService } from './application/public-promotions.service';
import { OWNER_OFFER_REPOSITORY } from './domain/owner-offers';
import { PUBLIC_PROMOTIONS_REPOSITORY } from './domain/public-promotions';
import { PrismaOwnerOfferRepository } from './infrastructure/prisma-owner-offer.repository';
import { PrismaPublicPromotionsRepository } from './infrastructure/prisma-public-promotions.repository';
import { OwnerOffersController } from './presentation/owner-offers.controller';
import {
  PublicOffersController,
  PublicPlacementsController,
} from './presentation/public-promotions.controller';

/**
 * Offers reads (S-VEND-07 owner, S-CUST-20 public list, S-CUST-01 hero
 * placements). Imports runtime (PrismaDatabase, UoW, CURSOR_CODEC) and
 * BusinessContext. Admin approval, coupons and purchase flows are separate.
 */
@Module({})
export class OffersModule {
  static forRoot(imports: readonly DynamicModule[]): DynamicModule {
    return {
      module: OffersModule,
      imports: [...imports],
      controllers: [
        OwnerOffersController,
        PublicOffersController,
        PublicPlacementsController,
      ],
      providers: [
        OwnerOffersService,
        PublicPromotionsService,
        ApprovedSellerAccess,
        { provide: OWNER_OFFER_REPOSITORY, useClass: PrismaOwnerOfferRepository },
        {
          provide: PUBLIC_PROMOTIONS_REPOSITORY,
          useClass: PrismaPublicPromotionsRepository,
        },
      ],
    };
  }
}
