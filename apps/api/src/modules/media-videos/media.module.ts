import { Module, type DynamicModule } from '@nestjs/common';
import { CloudinaryImageStorage } from '../../integrations/cloudinary/image-storage';
import { SharpImageProcessor } from '../../integrations/images/image-processor';
import { RUNTIME_CONFIG, type RuntimeConfig } from '../../shared/config/config';
import { IMAGE_PROCESSOR, IMAGE_STORAGE, MEDIA_IMAGES, LISTING_IMAGE_PUBLICATION } from './domain/images';
import { PrismaListingImagePublication } from './infrastructure/listing-image-publication';
import { PrismaImageRepository } from './infrastructure/image.repository';
import { ImageService } from './application/image.service';
import { ImageDeliveryService } from './application/image-delivery.service';
import { ImageCleanup } from './application/image-cleanup';
import { ImageController } from './presentation/image.controller';
import { VideoService } from './application/video.service';
import { VideoModerationService } from './application/video-moderation.service';
import { VideoCommentTargetService } from './application/video-comment-target.service';
import { MEDIA_COMMENT_TARGET } from './application/video-comment-target.port';
import {
  VIDEO_SAVED_CARDS,
  VideoSavedCardsService,
} from './application/video-saved-cards';
import { VIDEO_REPOSITORY } from './domain/videos';
import { PrismaVideoRepository } from './infrastructure/video.repository';
import {
  OwnerVideoController,
  PublicVideoController,
} from './presentation/video.controller';
import {
  AdminMediaReportController,
  VideoModerationController,
} from './presentation/video-moderation.controller';

@Module({})
export class MediaStorageModule {
  static forRoot(runtime: DynamicModule, cleanup = false): DynamicModule {
    return {
      module: MediaStorageModule,
      imports: [runtime],
      providers: [
        { provide: MEDIA_IMAGES, useClass: PrismaImageRepository },
        { provide: IMAGE_PROCESSOR, useClass: SharpImageProcessor },
        {
          provide: IMAGE_STORAGE,
          inject: [RUNTIME_CONFIG],
          useFactory: (config: RuntimeConfig) =>
            new CloudinaryImageStorage(config),
        },
        ...(cleanup ? [ImageCleanup] : []),
      ],
      exports: [MEDIA_IMAGES, IMAGE_PROCESSOR, IMAGE_STORAGE],
    };
  }
}
@Module({})
export class MediaModule {
  static forRoot(imports: DynamicModule[]): DynamicModule {
    return {
      module: MediaModule,
      imports,
      controllers: [
        ImageController,
        OwnerVideoController,
        PublicVideoController,
        VideoModerationController,
        AdminMediaReportController,
      ],
      providers: [
        ImageService,
        ImageDeliveryService,
        { provide: LISTING_IMAGE_PUBLICATION, useClass: PrismaListingImagePublication },
        VideoService,
        VideoModerationService,
        VideoCommentTargetService,
        { provide: VIDEO_SAVED_CARDS, useClass: VideoSavedCardsService },
        {
          provide: MEDIA_COMMENT_TARGET,
          useExisting: VideoCommentTargetService,
        },
        { provide: VIDEO_REPOSITORY, useClass: PrismaVideoRepository },
      ],
      exports: [MEDIA_COMMENT_TARGET, VIDEO_SAVED_CARDS],
    };
  }
}
