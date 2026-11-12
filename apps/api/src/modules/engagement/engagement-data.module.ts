import { Module, type DynamicModule } from '@nestjs/common';
import { SERVICE_BOOKMARK_REPOSITORY } from './domain/bookmarks';
import { PrismaServiceBookmarkRepository } from './infrastructure/prisma-service-bookmark.repository';
import { ServiceBookmarkDataOwner } from './application/service-bookmark-data-owner';

/** Reused by HTTP Engagement and the Users data worker, without API controllers. */
@Module({})
export class EngagementDataModule {
  static forRoot(runtime: DynamicModule): DynamicModule {
    return {
      module: EngagementDataModule, imports: [runtime],
      providers: [
        { provide: SERVICE_BOOKMARK_REPOSITORY,useClass: PrismaServiceBookmarkRepository },
        ServiceBookmarkDataOwner,
      ],
      exports: [SERVICE_BOOKMARK_REPOSITORY,ServiceBookmarkDataOwner],
    };
  }
}
