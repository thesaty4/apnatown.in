import { Module, type DynamicModule } from '@nestjs/common';
import { ORDER_NOTIFICATION_CONTEXT } from '../notifications/application/notification-ports';
import { OrderNotificationContextAdapter } from './application/order-notification-context';
import { ORDER_READS } from './domain/order';
import { PrismaOrderReadRepository } from './infrastructure/prisma-order-read.repository';

/**
 * Worker-safe Orders read binding for Notifications (runtime only; no
 * SESSION_ACCESS, payments, stock or delivery dependencies).
 */
@Module({})
export class OrdersNotificationReadModule {
  static forRoot(runtime: DynamicModule): DynamicModule {
    return {
      module: OrdersNotificationReadModule,
      imports: [runtime],
      providers: [
        { provide: ORDER_READS, useClass: PrismaOrderReadRepository },
        { provide: ORDER_NOTIFICATION_CONTEXT, useClass: OrderNotificationContextAdapter },
      ],
      exports: [ORDER_NOTIFICATION_CONTEXT],
    };
  }
}
