import { Module, type DynamicModule } from '@nestjs/common';
import { CATALOG_BUSINESS_CONTEXT } from '../catalog/application/catalog-ports';
import { BUSINESS_REPOSITORY } from './domain/business';
import { PrismaBusinessRepository } from './infrastructure/prisma-business.repository';
import { BusinessOwnerContext } from './application/business-owner-context';
import { CatalogBusinessContextAdapter } from './application/catalog-business-context.adapter';
import {
  BUSINESS_SAVED_CARDS,
  BusinessSavedCardsService,
} from './application/business-saved-cards';

@Module({})
export class BusinessContextModule {
  static forRoot(runtime: DynamicModule, users: DynamicModule): DynamicModule {
    return {
      module: BusinessContextModule,
      imports: [runtime, users],
      providers: [
        { provide: BUSINESS_REPOSITORY, useClass: PrismaBusinessRepository },
        BusinessOwnerContext,
        { provide: BUSINESS_SAVED_CARDS, useClass: BusinessSavedCardsService },
        {
          provide: CATALOG_BUSINESS_CONTEXT,
          useClass: CatalogBusinessContextAdapter,
        },
      ],
      exports: [
        CATALOG_BUSINESS_CONTEXT,
        BusinessOwnerContext,
        BUSINESS_SAVED_CARDS,
      ],
    };
  }
}
