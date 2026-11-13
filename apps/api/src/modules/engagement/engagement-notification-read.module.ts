import { Module, type DynamicModule } from '@nestjs/common';
import { FOLLOWER_ANNOUNCEMENT_CONTEXT } from '../notifications/application/follower-announcement-port';
import { FollowerAnnouncementContextAdapter } from './application/follower-announcement-context.adapter';
import { FOLLOWER_INSIGHTS_REPOSITORY } from './domain/follower-insights';
import { PrismaFollowerInsightsRepository } from './infrastructure/prisma-follower-insights.repository';

/** Worker-safe Engagement read binding for Notifications' announcement fan-out (runtime only). */
@Module({})
export class EngagementNotificationReadModule {
  static forRoot(runtime: DynamicModule): DynamicModule {
    return {
      module: EngagementNotificationReadModule,
      imports: [runtime],
      providers: [
        { provide: FOLLOWER_INSIGHTS_REPOSITORY, useClass: PrismaFollowerInsightsRepository },
        { provide: FOLLOWER_ANNOUNCEMENT_CONTEXT, useClass: FollowerAnnouncementContextAdapter },
      ],
      exports: [FOLLOWER_ANNOUNCEMENT_CONTEXT],
    };
  }
}
