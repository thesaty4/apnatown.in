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
import { LISTING_IMAGE_ATTACH } from './application/listing-image-attach.port';
import { BUSINESS_PROFILE_IMAGES, BUSINESS_PROFILE_IMAGE_SOURCE } from './application/business-profile-images.port';
import { BusinessProfileImagesService } from './application/business-profile-images.service';
import { PrismaBusinessProfileImageSource } from './infrastructure/business-profile-images';
import { ListingImageAttachService } from './application/listing-image-attach.service';
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
import {
  MEDIA_GALLERY_REPOSITORY,
  MEDIA_OWNER_VIDEO_REPOSITORY,
  MEDIA_PUBLIC_READ_REPOSITORY,
} from './domain/media-gallery';
import { PrismaGalleryRepository } from './infrastructure/gallery.repository';
import { PrismaOwnerVideoRepository } from './infrastructure/owner-video.repository';
import { PrismaPublicMediaReadRepository } from './infrastructure/public-media.repository';
import { MediaOwnerCommands } from './application/media-owner-commands';
import { MediaOrderService } from './application/media-order.service';
import { OwnerGalleryService } from './application/owner-gallery.service';
import { OwnerVideoService } from './application/owner-video.service';
import { PhotoReportService } from './application/photo-report.service';
import { PublicMediaService } from './application/public-media.service';
import { MediaReportModerationService } from './application/media-report-moderation.service';
import { MEDIA_PHOTO_REPORTS } from './domain/media-reports';
import { PrismaPhotoReportRepository } from './infrastructure/photo-report.repository';
import { OwnerGalleryController } from './presentation/owner-gallery.controller';
import { OwnerVideoManageController } from './presentation/owner-video-manage.controller';
import {
  LinkedVideoController,
  PhotoReportController,
  PublicBusinessMediaController,
} from './presentation/public-media.controller';

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
        OwnerVideoManageController,
        OwnerGalleryController,
        PublicBusinessMediaController,
        LinkedVideoController,
        PhotoReportController,
      ],
      providers: [
        ImageService,
        ImageDeliveryService,
        { provide: LISTING_IMAGE_PUBLICATION, useClass: PrismaListingImagePublication },
        { provide: LISTING_IMAGE_ATTACH, useClass: ListingImageAttachService },
        { provide: BUSINESS_PROFILE_IMAGE_SOURCE, useClass: PrismaBusinessProfileImageSource },
        { provide: BUSINESS_PROFILE_IMAGES, useClass: BusinessProfileImagesService },
        VideoService,
        VideoModerationService,
        VideoCommentTargetService,
        { provide: VIDEO_SAVED_CARDS, useClass: VideoSavedCardsService },
        {
          provide: MEDIA_COMMENT_TARGET,
          useExisting: VideoCommentTargetService,
        },
        { provide: VIDEO_REPOSITORY, useClass: PrismaVideoRepository },
        { provide: MEDIA_GALLERY_REPOSITORY, useClass: PrismaGalleryRepository },
        { provide: MEDIA_OWNER_VIDEO_REPOSITORY, useClass: PrismaOwnerVideoRepository },
        { provide: MEDIA_PUBLIC_READ_REPOSITORY, useClass: PrismaPublicMediaReadRepository },
        MediaOwnerCommands,
        MediaOrderService,
        OwnerGalleryService,
        OwnerVideoService,
        PhotoReportService,
        PublicMediaService,
        MediaReportModerationService,
        { provide: MEDIA_PHOTO_REPORTS, useClass: PrismaPhotoReportRepository },
      ],
      // LISTING_IMAGE_ATTACH: owner attach validation for Products, Services
      // and Businesses (logo/cover) inside their own transactions.
      // BUSINESS_PROFILE_IMAGES: public logo/cover descriptors for Businesses.
      exports: [MEDIA_COMMENT_TARGET, VIDEO_SAVED_CARDS, LISTING_IMAGE_ATTACH, BUSINESS_PROFILE_IMAGES],
    };
  }
}
