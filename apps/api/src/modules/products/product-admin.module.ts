import { Module, type DynamicModule } from '@nestjs/common';
import { PRODUCT_ADMIN } from './application/product-admin.port';
import { ProductAdminReadService } from './application/product-admin-read.service';
import { ProductAdminService } from './application/product-admin.service';
import { PRODUCT_OWNER_REPOSITORY } from './application/product-owner-ports';
import { PrismaProductOwnerRepository } from './infrastructure/product-owner.repository';

/**
 * Products-owned admin port for Admin Listings (F-AD-003). Imports the
 * runtime, Admin (scope predicate, scoped actor), Businesses (listing scope)
 * and Audit modules; exposes no controllers of its own.
 */
@Module({})
export class ProductAdminModule {
  static forRoot(
    runtime: DynamicModule,
    admin: DynamicModule,
    businesses: DynamicModule,
    audit: DynamicModule,
  ): DynamicModule {
    return {
      module: ProductAdminModule,
      imports: [runtime, admin, businesses, audit],
      providers: [
        {
          provide: PRODUCT_OWNER_REPOSITORY,
          useClass: PrismaProductOwnerRepository,
        },
        ProductAdminReadService,
        ProductAdminService,
        { provide: PRODUCT_ADMIN, useExisting: ProductAdminService },
      ],
      exports: [PRODUCT_ADMIN],
    };
  }
}
