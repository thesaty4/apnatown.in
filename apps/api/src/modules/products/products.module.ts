import { Module, type DynamicModule } from '@nestjs/common';
import { PRODUCT_READ, ProductReadService } from './application/product-read.service';
import { PrismaProductReadRepository } from './infrastructure/product-read.repository';
import { ProductPublicController } from './presentation/product-public.controller';
import { PRODUCT_BUSINESS_PUBLIC, ProductBusinessPublicService } from './application/product-business-public.service';
import { PrismaProductBusinessPublicRepository } from './infrastructure/product-business-public.repository';
import { ProductBusinessPublicController } from './presentation/product-business-public.controller';
import {
  INVENTORY_REPOSITORY,
  PRODUCT_OWNER_REPOSITORY,
  PRODUCT_PILLS_REPOSITORY,
} from './application/product-owner-ports';
import { ProductOwnerAccess } from './application/product-owner-access';
import { ProductWriteSupport } from './application/product-write-support';
import { ProductOwnerService } from './application/product-owner.service';
import { ProductWriteService } from './application/product-write.service';
import { ProductBulkService } from './application/product-bulk.service';
import { InventoryService } from './application/inventory.service';
import { ProductPillsService } from './application/product-pills.service';
import { PrismaProductOwnerRepository } from './infrastructure/product-owner.repository';
import { PrismaInventoryRepository } from './infrastructure/inventory.repository';
import { PrismaProductPillsRepository } from './infrastructure/product-pills.repository';
import { ProductBulkController, ProductOwnerController } from './presentation/product-owner.controller';
import { InventoryController } from './presentation/inventory.controller';
import { ProductPillsController } from './presentation/product-pills.controller';
import { PRODUCT_IMPORT_READER, PRODUCT_IMPORT_REPOSITORY } from './application/product-import-ports';
import { ProductImportService } from './application/product-import.service';
import { ProductImportFileReader } from './infrastructure/import-file/product-import-file.reader';
import { PrismaProductImportRepository } from './infrastructure/product-import.repository';
import { ProductImportController } from './presentation/product-import.controller';
import {
  FEATURED_ENTITLEMENT_READ,
  PrismaFeaturedEntitlementRead,
} from '../../shared/entitlements/featured-entitlement';
@Module({})
export class ProductsModule {
  /**
   * `catalog` supplies CATALOG_READ, `businessContext` the owner resolver and
   * `media` LISTING_IMAGE_ATTACH (owner product image validation) and
   * `settings` SETTINGS_READ (product import caps).
   */
  static forRoot(runtime: DynamicModule, catalog: DynamicModule, businessContext: DynamicModule,
    media: DynamicModule, settings: DynamicModule): DynamicModule {
    return { module: ProductsModule, imports: [runtime, catalog, businessContext, media, settings],
      // Static `me/products/bulk|import` register before `me/products/:productId`.
      controllers: [ProductPublicController, ProductBusinessPublicController, ProductBulkController,
        ProductImportController, ProductOwnerController,
        InventoryController, ProductPillsController],
      providers: [ProductReadService,{ provide: PRODUCT_READ, useClass: PrismaProductReadRepository },
        ProductBusinessPublicService,
        { provide: PRODUCT_BUSINESS_PUBLIC, useClass: PrismaProductBusinessPublicRepository },
        ProductOwnerAccess, ProductWriteSupport, ProductOwnerService, ProductWriteService,
        ProductBulkService, InventoryService, ProductPillsService,
        { provide: PRODUCT_OWNER_REPOSITORY, useClass: PrismaProductOwnerRepository },
        { provide: INVENTORY_REPOSITORY, useClass: PrismaInventoryRepository },
        { provide: PRODUCT_PILLS_REPOSITORY, useClass: PrismaProductPillsRepository },
        { provide: FEATURED_ENTITLEMENT_READ, useClass: PrismaFeaturedEntitlementRead },
        ProductImportService,
        { provide: PRODUCT_IMPORT_READER, useClass: ProductImportFileReader },
        { provide: PRODUCT_IMPORT_REPOSITORY, useClass: PrismaProductImportRepository }] };
  }
}
