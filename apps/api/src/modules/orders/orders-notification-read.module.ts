import { Module, type DynamicModule } from '@nestjs/common';
import { ORDER_NOTIFICATION_CONTEXT } from '../notifications/application/notification-ports';
import { OrderNotificationContextAdapter } from './application/order-notification-context';
import { ORDER_PARTIES } from './application/order-ports';
import { ORDER_READS } from './domain/order';
import { PrismaOrderReadRepository } from './infrastructure/prisma-order-read.repository';

/**
 * Worker-safe Orders read bindings for Notifications (ORDER_NOTIFICATION_
 * CONTEXT) and Delivery dispatch signals (ORDER_PARTIES); runtime only, no
 * SESSION_ACCESS, payments, stock or delivery dependencies.
 */
@Module({})
export class OrdersNotificationReadModule {
  static forRoot(runtime: DynamicModule): DynamicModule {
    return {
      module: OrdersNotificationReadModule,
      imports: [runtime],
      providers: [
        { provide: ORDER_READS, useClass: PrismaOrderReadRepository },
        OrderNotificationContextAdapter,
        { provide: ORDER_NOTIFICATION_CONTEXT, useExisting: OrderNotificationContextAdapter },
        { provide: ORDER_PARTIES, useExisting: OrderNotificationContextAdapter },
      ],
      exports: [ORDER_NOTIFICATION_CONTEXT, ORDER_PARTIES],
    };
  }
}
