import { Module, type DynamicModule } from '@nestjs/common';
import { BUSINESS_DISCOVERY_DETAIL, BusinessDiscoveryDetailService } from './application/business-discovery-detail.service';
import { PrismaBusinessDiscoveryDetailRepository } from './infrastructure/business-discovery-detail.repository';
import { BusinessDiscoveryDetailController } from './presentation/business-discovery-detail.controller';
@Module({})
export class BusinessPublicModule {
  /** `media` exports BUSINESS_PROFILE_IMAGES (public logo/cover descriptors). */
  static forRoot(runtime: DynamicModule, media: DynamicModule): DynamicModule {
    return { module: BusinessPublicModule, imports: [runtime, media], controllers: [BusinessDiscoveryDetailController],
      providers: [BusinessDiscoveryDetailService,{ provide: BUSINESS_DISCOVERY_DETAIL, useClass: PrismaBusinessDiscoveryDetailRepository }] };
  }
}
