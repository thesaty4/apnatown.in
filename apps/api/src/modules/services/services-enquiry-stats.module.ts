import { Module, type DynamicModule } from '@nestjs/common';
import { BUSINESS_ENQUIRY_STATS } from '../businesses/application/business-enquiry-stats-port';
import { PrismaEnquiryStatsRepository } from './infrastructure/prisma-enquiry-stats.repository';

/** Exposes only the read-only enquiry cohort port to Businesses analytics. */
@Module({})
export class ServicesEnquiryStatsModule {
  static forRoot(runtime: DynamicModule): DynamicModule {
    return {
      module: ServicesEnquiryStatsModule,
      imports: [runtime],
      providers: [{ provide: BUSINESS_ENQUIRY_STATS, useClass: PrismaEnquiryStatsRepository }],
      exports: [BUSINESS_ENQUIRY_STATS],
    };
  }
}
