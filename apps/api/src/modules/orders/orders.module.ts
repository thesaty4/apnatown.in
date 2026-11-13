import { ApprovedSellerAccess } from '../businesses/application/approved-seller-access';
import { Module, type DynamicModule } from '@nestjs/common';
import { OrderAddressCipher } from './application/order-address-cipher';
import { OrderAdminReadService } from './application/order-admin-read.service';
import { OrderCommandsService } from './application/order-commands.service';
import { OrderCreationService } from './application/order-creation.service';
import { OrderDetailComposer } from './application/order-detail-composer';
import { OrderEffects } from './application/order-effects';
import { OrderEvents } from './application/order-events';
import { OrderFulfilmentService } from './application/order-fulfilment.service';
import { OrderLifecycle } from './application/order-lifecycle';
import { OrderPager } from './application/order-pager';
import { OrderRealtime } from './application/order-realtime';
import { ORDERS_CREATION, ORDERS_FULFILMENT } from './application/order-ports';
import { OrderReadService } from './application/order-read.service';
import { OrderStock } from './application/order-stock';
import { ORDER_READS, ORDER_WRITES } from './domain/order';
import { PrismaOrderReadRepository } from './infrastructure/prisma-order-read.repository';
import { PrismaOrderWriteRepository } from './infrastructure/prisma-order-write.repository';
import { AdminOrdersController } from './presentation/admin-orders.controller';
import { BusinessOrdersController } from './presentation/business-orders.controller';
import { OrdersController } from './presentation/orders.controller';

/**
 * Orders (specs/orders/be/orders.md) MVP slice: per-shop orders, purchase
 * snapshots, stock allocations/operations, ST-order-* lifecycle registry,
 * customer/owner/admin reads and the creation/fulfilment ports. Imports
 * must provide runtime, Users (USER_IDENTITY), Admin (ADMIN_SCOPE),
 * BusinessContext (ApprovedSellerAccess), Payments (PAYMENT_ORDER),
 * Products stock (PRODUCT_STOCK) and Delivery codes (DELIVERY_CODES).
 * Cases, refunds, adjustments, invoices and master summaries are deferred.
 */
@Module({})
export class OrdersModule {
  static forRoot(imports: readonly DynamicModule[]): DynamicModule {
    return {
      module: OrdersModule,
      imports: [...imports],
      controllers: [
        OrdersController,
        BusinessOrdersController,
        AdminOrdersController,
      ],
      providers: [
        // API-only: needs SESSION_ACCESS, which the worker does not provide.
        ApprovedSellerAccess,
        { provide: ORDER_WRITES, useClass: PrismaOrderWriteRepository },
        { provide: ORDER_READS, useClass: PrismaOrderReadRepository },
        OrderAddressCipher,
        OrderRealtime,
        OrderEvents,
        OrderStock,
        OrderEffects,
        OrderLifecycle,
        OrderDetailComposer,
        OrderPager,
        OrderReadService,
        OrderAdminReadService,
        OrderCommandsService,
        OrderCreationService,
        OrderFulfilmentService,
        { provide: ORDERS_CREATION, useExisting: OrderCreationService },
        { provide: ORDERS_FULFILMENT, useExisting: OrderFulfilmentService },
      ],
      exports: [ORDERS_CREATION, ORDERS_FULFILMENT],
    };
  }
}
