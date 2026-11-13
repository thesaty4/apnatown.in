import { Module, type DynamicModule } from '@nestjs/common';
import { SERVICE_READ, ServiceReadService } from './application/service-read.service';
import { PrismaServiceReadRepository } from './infrastructure/service-read.repository';
import { ServicePublicController } from './presentation/service-public.controller';
import { SERVICE_BUSINESS_PUBLIC, ServiceBusinessPublicService } from './application/service-business-public.service';
import { PrismaServiceBusinessPublicRepository } from './infrastructure/service-business-public.repository';
import { ServiceBusinessPublicController } from './presentation/service-business-public.controller';
import { SERVICE_SAVED_CARDS, ServiceSavedCardsService } from './application/service-saved-cards';
import { PROVIDER_EXPERTISE_REPOSITORY } from './application/provider-expertise-ports';
import { ProviderExpertiseService } from './application/provider-expertise.service';
import { PrismaProviderExpertiseRepository } from './infrastructure/provider-expertise.repository';
import {
  ProviderExpertiseOwnerController,
  ProviderExpertisePublicController,
} from './presentation/provider-expertise.controller';
import { ENQUIRY_REPOSITORY } from './application/enquiry-ports';
import { EnquiryCreateService } from './application/enquiry-create.service';
import { EnquiryInboxService } from './application/enquiry-inbox.service';
import { EnquiryOwnerAccess } from './application/enquiry-owner-access';
import { PrismaEnquiryRepository } from './infrastructure/enquiry.repository';
import { EnquiryOwnerController, EnquiryPublicController } from './presentation/enquiry.controller';
import { SERVICE_OWNER_REPOSITORY } from './application/service-owner-ports';
import { ServiceTaxonomyPolicy } from './application/service-owner-common';
import { ServiceOwnerService } from './application/service-owner.service';
import { ServiceOwnerWriteService } from './application/service-owner-write.service';
import { ServiceOwnerWriteSupport } from './application/service-owner-write-support';
import { PrismaServiceOwnerRepository } from './infrastructure/service-owner.repository';
import { ServiceOwnerController } from './presentation/service-owner.controller';
import {
  FEATURED_ENTITLEMENT_READ,
  PrismaFeaturedEntitlementRead,
} from '../../shared/entitlements/featured-entitlement';
@Module({})
export class ServicesModule {
  /**
   * `catalog` supplies CATALOG_READ; `businessContext` the owner resolver;
   * `media` the LISTING_IMAGE_ATTACH port for owner listing images.
   */
  static forRoot(runtime: DynamicModule, catalog: DynamicModule, businessContext: DynamicModule, media: DynamicModule): DynamicModule {
    return { module: ServicesModule, imports: [runtime, catalog, businessContext, media],
      // Owner `me/...` routes register before public `:slug/expertise`.
      controllers: [ServicePublicController, ServiceBusinessPublicController, EnquiryPublicController, ProviderExpertiseOwnerController,
        EnquiryOwnerController, ServiceOwnerController, ProviderExpertisePublicController],
      providers: [ServiceReadService,{ provide: SERVICE_READ, useClass: PrismaServiceReadRepository },
        ServiceBusinessPublicService,
        { provide: SERVICE_BUSINESS_PUBLIC, useClass: PrismaServiceBusinessPublicRepository },
        { provide: SERVICE_SAVED_CARDS,useClass: ServiceSavedCardsService },
        ProviderExpertiseService,
        { provide: PROVIDER_EXPERTISE_REPOSITORY, useClass: PrismaProviderExpertiseRepository },
        EnquiryCreateService, EnquiryInboxService, EnquiryOwnerAccess,
        { provide: ENQUIRY_REPOSITORY, useClass: PrismaEnquiryRepository },
        ServiceOwnerService, ServiceOwnerWriteService, ServiceOwnerWriteSupport, ServiceTaxonomyPolicy,
        { provide: SERVICE_OWNER_REPOSITORY, useClass: PrismaServiceOwnerRepository },
        { provide: FEATURED_ENTITLEMENT_READ, useClass: PrismaFeaturedEntitlementRead }],
      exports: [SERVICE_SAVED_CARDS] };
  }
}
