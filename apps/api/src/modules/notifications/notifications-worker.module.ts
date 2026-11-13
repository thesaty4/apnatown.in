import { Module, type DynamicModule } from '@nestjs/common';
import type { OutboxHandler } from '../../shared/jobs/outbox-dispatcher';
import { CLOCK, type Clock } from '../../shared/runtime/providers';
import { AdminRecipientsWorkerModule } from '../admin/admin-recipients-worker.module';
import { BusinessContextModule } from '../businesses/business-context.module';
import { CatalogReadWorkerModule } from '../catalog/catalog-read-worker.module';
import { OrdersNotificationReadModule } from '../orders/orders-notification-read.module';
import { UsersReadWorkerModule } from '../users/users-read-worker.module';
import { EmailChannel, InAppChannel, WhatsAppChannel } from './application/channels';
import {
  BusinessDecisionRule,
  BusinessSubmittedRule,
  EnquiryCreatedRule,
} from './application/handlers/business.rules';
import {
  SuggestionDecidedRule,
  SuggestionSubmittedRule,
} from './application/handlers/catalog.rules';
import {
  CommentModeratedRule,
  CommentPendingRule,
  SupportMessageRule,
} from './application/handlers/engagement-support.rules';
import {
  OrderCancelledRule,
  OrderNotificationSupport,
  OrderPlacedRule,
  OrderProgressRule,
} from './application/handlers/order.rules';
import {
  NOTIFICATION_CHANNELS,
  type NotificationChannel,
} from './application/notification-ports';
import { NotificationPublisher } from './application/notification-publisher';
import { NotificationRecipients } from './application/notification-recipients';
import {
  NOTIFICATION_RULES,
  notificationHandlers,
  type NotificationRule,
} from './application/notification-rule';
import {
  NOTIFICATION_REPOSITORY,
  PREFERENCE_REPOSITORY,
} from './domain/notification';
import { PrismaNotificationRepository } from './infrastructure/notification.repository';
import { PrismaPreferenceRepository } from './infrastructure/preference.repository';

/** Outbox handlers exported to the worker's OUTBOX_HANDLERS registry. */
export const NOTIFICATION_OUTBOX_HANDLERS = Symbol(
  'NOTIFICATION_OUTBOX_HANDLERS',
);

const RULES = [
  BusinessSubmittedRule,
  BusinessDecisionRule,
  EnquiryCreatedRule,
  SuggestionSubmittedRule,
  SuggestionDecidedRule,
  CommentPendingRule,
  CommentModeratedRule,
  SupportMessageRule,
  OrderPlacedRule,
  OrderProgressRule,
  OrderCancelledRule,
] as const;

/**
 * Worker composition: outbox consumers for events published today, mapped
 * through the spec matrix to in-app publication. External channels are
 * registered but unavailable (no provider), so they are recorded as
 * suppressed `channel_disabled` and never sent.
 */
@Module({})
export class NotificationsWorkerModule {
  static forRoot(
    runtime: DynamicModule,
    mediaStorage: DynamicModule,
  ): DynamicModule {
    const users = UsersReadWorkerModule.forRoot(runtime);
    const businessContext = BusinessContextModule.forRoot(runtime, users);
    return {
      module: NotificationsWorkerModule,
      imports: [
        runtime,
        users,
        businessContext,
        AdminRecipientsWorkerModule.forRoot(runtime, users),
        CatalogReadWorkerModule.forRoot(runtime, businessContext, mediaStorage),
        OrdersNotificationReadModule.forRoot(runtime),
      ],
      providers: [
        {
          provide: NOTIFICATION_REPOSITORY,
          useClass: PrismaNotificationRepository,
        },
        { provide: PREFERENCE_REPOSITORY, useClass: PrismaPreferenceRepository },
        InAppChannel,
        EmailChannel,
        WhatsAppChannel,
        {
          provide: NOTIFICATION_CHANNELS,
          useFactory: (...channels: NotificationChannel[]) => Object.freeze(channels),
          inject: [InAppChannel, EmailChannel, WhatsAppChannel],
        },
        NotificationRecipients,
        NotificationPublisher,
        OrderNotificationSupport,
        ...RULES,
        {
          provide: NOTIFICATION_RULES,
          useFactory: (...rules: NotificationRule[]) => Object.freeze(rules),
          inject: [...RULES],
        },
        {
          provide: NOTIFICATION_OUTBOX_HANDLERS,
          useFactory: (
            rules: readonly NotificationRule[],
            publisher: NotificationPublisher,
            clock: Clock,
          ): readonly OutboxHandler[] =>
            Object.freeze(notificationHandlers(rules, publisher, clock)),
          inject: [NOTIFICATION_RULES, NotificationPublisher, CLOCK],
        },
      ],
      exports: [NOTIFICATION_OUTBOX_HANDLERS],
    };
  }
}
