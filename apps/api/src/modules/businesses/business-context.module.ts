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
import {
  BUSINESS_DISCOVERY,
  BusinessDiscoveryService,
} from './application/business-discovery';
import { NOTIFICATION_BUSINESS_CONTEXT } from '../notifications/application/notification-ports';
import { NotificationBusinessContextAdapter } from './application/notification-business-context.adapter';

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
        { provide: BUSINESS_DISCOVERY, useClass: BusinessDiscoveryService },
        {
          provide: CATALOG_BUSINESS_CONTEXT,
          useClass: CatalogBusinessContextAdapter,
        },
        {
          provide: NOTIFICATION_BUSINESS_CONTEXT,
          useClass: NotificationBusinessContextAdapter,
        },
      ],
      exports: [
        CATALOG_BUSINESS_CONTEXT,
        BusinessOwnerContext,
        BUSINESS_SAVED_CARDS,
        BUSINESS_DISCOVERY,
        NOTIFICATION_BUSINESS_CONTEXT,
      ],
    };
  }
}
