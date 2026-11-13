import { Module, type DynamicModule } from '@nestjs/common';
import { BUSINESS_REPOSITORY } from './domain/business';
import { PrismaBusinessRepository } from './infrastructure/prisma-business.repository';
import { BusinessAdminReadService } from './application/business-admin-read.service';
import { BusinessDecisionService } from './application/business-decision.service';
import { BusinessEvents } from './application/business-events';
import { BusinessInsights } from './application/business-insights';
import { BusinessOwnerService } from './application/business-owner.service';
import {
  BUSINESS_ADMIN_LISTING_READ,
  BUSINESS_ADMIN_LISTINGS,
  BUSINESS_ADMIN_READ,
  BUSINESS_MEDIA_ASSETS,
} from './application/business-ports';
import { BusinessAdminListingCommands } from './application/business-admin-listing-commands';
import { BusinessAdminListingsService } from './application/business-admin-listings.service';
import { BusinessListingReadService } from './application/business-listing-read.service';
import { MediaBusinessAssets } from './infrastructure/media-business-assets';
import { BusinessReviewer } from './application/business-reviewer';
import { BusinessAdminController } from './presentation/business-admin.controller';
import { BusinessOwnerController } from './presentation/business-owner.controller';

/**
 * Owner onboarding/profile and scoped admin approval endpoints. Logo/cover
 * attachment validates through Media's LISTING_IMAGE_ATTACH (imports must
 * include the Media module); private documents stay unavailable (Q-40).
 */
@Module({})
export class BusinessesModule {
  static forRoot(
    imports: readonly DynamicModule[],
  ): DynamicModule {
    return {
      module: BusinessesModule,
      imports: [...imports],
      controllers: [BusinessOwnerController, BusinessAdminController],
      providers: [
        { provide: BUSINESS_REPOSITORY, useClass: PrismaBusinessRepository },
        {
          provide: BUSINESS_MEDIA_ASSETS,
          useClass: MediaBusinessAssets,
        },
        BusinessReviewer,
        BusinessEvents,
        BusinessInsights,
        BusinessOwnerService,
        BusinessAdminReadService,
        BusinessDecisionService,
        { provide: BUSINESS_ADMIN_READ, useExisting: BusinessAdminReadService },
        BusinessListingReadService,
        {
          provide: BUSINESS_ADMIN_LISTING_READ,
          useExisting: BusinessListingReadService,
        },
        BusinessAdminListingCommands,
        BusinessAdminListingsService,
        {
          provide: BUSINESS_ADMIN_LISTINGS,
          useExisting: BusinessAdminListingsService,
        },
      ],
      exports: [
        BUSINESS_ADMIN_READ,
        BUSINESS_ADMIN_LISTING_READ,
        BUSINESS_ADMIN_LISTINGS,
      ],
    };
  }
}
