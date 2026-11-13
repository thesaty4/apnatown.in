import { Module, type DynamicModule } from '@nestjs/common';
import { AdminListingReportsService } from './application/admin-listing-reports.service';
import { AdminListingsService } from './application/admin-listings.service';
import { ListingReportIntakeService } from './application/listing-report-intake.service';
import { LISTING_REPORT_REPOSITORY } from './domain/listing-report';
import { PrismaListingReportRepository } from './infrastructure/prisma-listing-report.repository';
import { AdminListingProductsController } from './presentation/admin-listing-products.controller';
import {
  AdminListingReportsController,
  ListingReportsController,
} from './presentation/admin-listing-reports.controller';
import { AdminListingsController } from './presentation/admin-listings.controller';

/**
 * S-ADMN-03 Listings and F-PF-007 listing reports. Admin owns only
 * `listing_reports`; listing and product changes go through the owning
 * Businesses/Products versioned admin ports.
 */
@Module({})
export class AdminListingsModule {
  static forRoot(
    runtime: DynamicModule,
    admin: DynamicModule,
    businesses: DynamicModule,
    productAdmin: DynamicModule,
    audit: DynamicModule,
  ): DynamicModule {
    return {
      module: AdminListingsModule,
      imports: [runtime, admin, businesses, productAdmin, audit],
      // Products first: `listings/:businessId/products` before `:type/:id`.
      controllers: [
        AdminListingProductsController,
        AdminListingsController,
        AdminListingReportsController,
        ListingReportsController,
      ],
      providers: [
        {
          provide: LISTING_REPORT_REPOSITORY,
          useClass: PrismaListingReportRepository,
        },
        ListingReportIntakeService,
        AdminListingReportsService,
        AdminListingsService,
      ],
    };
  }
}
