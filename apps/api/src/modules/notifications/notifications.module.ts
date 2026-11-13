import { Module, type DynamicModule } from '@nestjs/common';
import { NotificationFeedAccess } from './application/feed-access';
import { NotificationFeedService } from './application/notification-feed.service';
import { NotificationPreferencesService } from './application/notification-preferences.service';
import { PreferenceConsents } from './application/preference-consents';
import {
  NOTIFICATION_REPOSITORY,
  PREFERENCE_REPOSITORY,
} from './domain/notification';
import { PrismaNotificationRepository } from './infrastructure/notification.repository';
import { PrismaPreferenceRepository } from './infrastructure/preference.repository';
import { NotificationsController } from './presentation/notifications.controller';

/**
 * Notifications HTTP surface (own feed, unread count, read state and
 * preferences). Publication happens only in the worker
 * (NotificationsWorkerModule). `users` exports USER_IDENTITY/CONSENT_*,
 * `admin` exports ADMIN_SCOPE and `businessContext` exports
 * NOTIFICATION_BUSINESS_CONTEXT; SESSION_ACCESS comes from the global Auth.
 */
@Module({})
export class NotificationsModule {
  static forRoot(
    runtime: DynamicModule,
    users: DynamicModule,
    admin: DynamicModule,
    businessContext: DynamicModule,
  ): DynamicModule {
    return {
      module: NotificationsModule,
      imports: [runtime, users, admin, businessContext],
      controllers: [NotificationsController],
      providers: [
        {
          provide: NOTIFICATION_REPOSITORY,
          useClass: PrismaNotificationRepository,
        },
        { provide: PREFERENCE_REPOSITORY, useClass: PrismaPreferenceRepository },
        NotificationFeedAccess,
        NotificationFeedService,
        PreferenceConsents,
        NotificationPreferencesService,
      ],
    };
  }
}
