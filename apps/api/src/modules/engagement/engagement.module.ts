import { Module, type DynamicModule } from '@nestjs/common';
import { SavedController } from './presentation/saved.controller';
import { SavedService } from './application/saved.service';
import { SAVED_REPOSITORY } from './domain/saved';
import { PrismaSavedRepository } from './infrastructure/prisma-saved.repository';
import { VideoLikesService } from './application/video-likes.service';
import { FollowsService } from './application/follows.service';
import { VIDEO_LIKE_REPOSITORY } from './domain/likes';
import { PrismaVideoLikeRepository } from './infrastructure/prisma-video-like.repository';
import { VIDEO_HEART_REPOSITORY } from './domain/hearts';
import { PrismaVideoHeartRepository } from './infrastructure/prisma-video-heart.repository';
import { FOLLOW_REPOSITORY } from './domain/follows';
import { PrismaFollowRepository } from './infrastructure/prisma-follow.repository';
import { VideoLikesController } from './presentation/video-likes.controller';
import { VideoFollowsController } from './presentation/video-follows.controller';
import { VideoSharesService } from './application/video-shares.service';
import { VIDEO_SHARE_REPOSITORY } from './domain/shares';
import { PrismaVideoShareRepository } from './infrastructure/prisma-video-share.repository';
import { VideoSharesController } from './presentation/video-shares.controller';
import { PrismaVideoCommentRepository } from './infrastructure/prisma-video-comment.repository';
import { VIDEO_COMMENT_REPOSITORY } from './domain/comments';
import { VideoCommentsService } from './application/video-comments.service';
import { VideoCommentEvents } from './application/video-comment-events';
import { VideoCommentModerationService } from './application/video-comment-moderation.service';
import {
  AdminVideoCommentsController,
  PublicVideoCommentsController,
  VideoCommentsController,
} from './presentation/video-comments.controller';

@Module({})
export class EngagementModule {
  static forRoot(
    runtime: DynamicModule,
    admin: DynamicModule,
    audit: DynamicModule,
    settings: DynamicModule,
    media: DynamicModule,
    businesses: DynamicModule,
  ): DynamicModule {
    return {
      module: EngagementModule,
      imports: [runtime, admin, audit, settings, media, businesses],
      controllers: [
        SavedController,
        VideoLikesController,
        VideoFollowsController,
        VideoSharesController,
        PublicVideoCommentsController,
        VideoCommentsController,
        AdminVideoCommentsController,
      ],
      providers: [
        SavedService,
        { provide: SAVED_REPOSITORY, useClass: PrismaSavedRepository },
        { provide: VIDEO_LIKE_REPOSITORY, useClass: PrismaVideoLikeRepository },
        {
          provide: VIDEO_HEART_REPOSITORY,
          useClass: PrismaVideoHeartRepository,
        },
        { provide: FOLLOW_REPOSITORY, useClass: PrismaFollowRepository },
        VideoLikesService,
        FollowsService,
        {
          provide: VIDEO_SHARE_REPOSITORY,
          useClass: PrismaVideoShareRepository,
        },
        VideoSharesService,
        {
          provide: VIDEO_COMMENT_REPOSITORY,
          useClass: PrismaVideoCommentRepository,
        },
        VideoCommentsService,
        VideoCommentEvents,
        VideoCommentModerationService,
      ],
    };
  }
}
