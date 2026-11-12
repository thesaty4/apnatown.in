import { Module, type DynamicModule } from '@nestjs/common';
import { VideoLikesService } from './application/video-likes.service';
import { VIDEO_LIKE_REPOSITORY } from './domain/likes';
import { PrismaVideoLikeRepository } from './infrastructure/prisma-video-like.repository';
import { VIDEO_HEART_REPOSITORY } from './domain/hearts';
import { PrismaVideoHeartRepository } from './infrastructure/prisma-video-heart.repository';
import { VideoLikesController } from './presentation/video-likes.controller';
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
  ): DynamicModule {
    return {
      module: EngagementModule,
      imports: [runtime, admin, audit, settings, media],
      controllers: [
        VideoLikesController,
        VideoSharesController,
        PublicVideoCommentsController,
        VideoCommentsController,
        AdminVideoCommentsController,
      ],
      providers: [
        { provide: VIDEO_LIKE_REPOSITORY, useClass: PrismaVideoLikeRepository },
        { provide: VIDEO_HEART_REPOSITORY, useClass: PrismaVideoHeartRepository },
        VideoLikesService,
        { provide: VIDEO_SHARE_REPOSITORY, useClass: PrismaVideoShareRepository },
        VideoSharesService,
        { provide: VIDEO_COMMENT_REPOSITORY, useClass: PrismaVideoCommentRepository },
        VideoCommentsService,
        VideoCommentEvents,
        VideoCommentModerationService,
      ],
    };
  }
}
