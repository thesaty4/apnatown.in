import 'reflect-metadata';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { buildOpenApiDocument } from './document';
import { HealthController } from '../health/health.controller';
import { ReadinessService } from '../health/readiness';
import { AuthController } from '../../modules/auth/presentation/auth.controller';
import { UsersController } from '../../modules/users/presentation/users.controller';
import { SessionService } from '../../modules/auth/application/session.service';
import { OtpService } from '../../modules/auth/application/otp.service';
import { ProfileService } from '../../modules/users/application/profile.service';
import { SessionCookie } from '../auth/cookie';
import { GeoController } from '../../modules/geo/presentation/geo.controller';
import { GeoReadService } from '../../modules/geo/application/geo-read.service';
import { GeoLocationService } from '../../modules/geo/application/geo-location.service';
import { GeoAdminService } from '../../modules/geo/application/geo-admin.service';
import { SuperAdminGeoController } from '../../modules/geo/presentation/super-admin-geo.controller';
import { AddressesController } from '../../modules/users/presentation/addresses.controller';
import { AddressService } from '../../modules/users/application/address.service';
import { ConsentsController } from '../../modules/users/presentation/consents.controller';
import { AnonymousConsentsController } from '../../modules/users/presentation/anonymous-consents.controller';
import { ConsentService } from '../../modules/users/application/consent.service';
import {
  DataRequestCompletionController,
  DataRequestsController,
} from '../../modules/users/presentation/data-requests.controller';
import { DataRequestService } from '../../modules/users/application/data-request.service';
import { AdminMeController } from '../../modules/admin/presentation/admin-me.controller';
import { SuperAdminAdminsController } from '../../modules/admin/presentation/super-admin-admins.controller';
import { SuperAdminRolesController } from '../../modules/admin/presentation/super-admin-roles.controller';
import { AdminAccountsService } from '../../modules/admin/application/admin-accounts.service';
import { RolesService } from '../../modules/admin/application/roles.service';
import { AdminAuditController } from '../../modules/audit/presentation/admin-audit.controller';
import { SuperAdminActivityController } from '../../modules/audit/presentation/super-admin-activity.controller';
import { AuditReadService } from '../../modules/audit/application/audit-read.service';
import { PublicSettingsController } from '../../modules/settings/presentation/public-settings.controller';
import { SuperAdminSettingsController } from '../../modules/settings/presentation/super-admin-settings.controller';
import {
  AdminSupportMessagesController,
  SupportMessagesController,
} from '../../modules/settings/presentation/support.controller';
import { PublicSettingsService } from '../../modules/settings/application/public-settings.service';
import { SettingsService } from '../../modules/settings/application/settings.service';
import { SupportService } from '../../modules/settings/application/support.service';
import { CatalogHomeSectionsService } from '../../modules/catalog/application/catalog-home-sections.service';
import { CatalogKeywordsService } from '../../modules/catalog/application/catalog-keywords.service';
import { CatalogSuggestionsService } from '../../modules/catalog/application/catalog-suggestions.service';
import { CatalogTaxonomyService } from '../../modules/catalog/application/catalog-taxonomy.service';
import { AdminCatalogController } from '../../modules/catalog/presentation/admin-catalog.controller';
import { OwnerCatalogSuggestionsController } from '../../modules/catalog/presentation/owner-catalog-suggestions.controller';
import { PublicCatalogController } from '../../modules/catalog/presentation/public-catalog.controller';
import { SuperAdminCatalogController } from '../../modules/catalog/presentation/super-admin-catalog.controller';
import { ImageController } from '../../modules/media-videos/presentation/image.controller';
import { ImageService } from '../../modules/media-videos/application/image.service';
import { ImageDeliveryService } from '../../modules/media-videos/application/image-delivery.service';
import {
  OwnerVideoController,
  PublicVideoController,
} from '../../modules/media-videos/presentation/video.controller';
import { VideoService } from '../../modules/media-videos/application/video.service';
import { VideoModerationService } from '../../modules/media-videos/application/video-moderation.service';
import {
  AdminVideoCommentsController,
  PublicVideoCommentsController,
  VideoCommentsController,
} from '../../modules/engagement/presentation/video-comments.controller';
import { VideoCommentsService } from '../../modules/engagement/application/video-comments.service';
import { VideoCommentModerationService } from '../../modules/engagement/application/video-comment-moderation.service';
import { VideoCommentEvents } from '../../modules/engagement/application/video-comment-events';
import {
  AdminMediaReportController,
  VideoModerationController,
} from '../../modules/media-videos/presentation/video-moderation.controller';

import { VideoLikesController } from '../../modules/engagement/presentation/video-likes.controller';
import { VideoLikesService } from '../../modules/engagement/application/video-likes.service';
import { VideoFollowsController } from '../../modules/engagement/presentation/video-follows.controller';
import { FollowsService } from '../../modules/engagement/application/follows.service';
import { VideoSharesController } from '../../modules/engagement/presentation/video-shares.controller';
import { VideoSharesService } from '../../modules/engagement/application/video-shares.service';

// Metadata-only composition; never imported by AppModule or WorkerModule.
// No runtime config, repository, DB client, provider, queue or listen.
@Module({
  controllers: [
    VideoLikesController,
    VideoFollowsController,
    VideoSharesController,
    ImageController,
    OwnerVideoController,
    PublicVideoController,
    VideoModerationController,
    AdminMediaReportController,
    HealthController,
    AuthController,
    UsersController,
    GeoController,
    SuperAdminGeoController,
    AddressesController,
    ConsentsController,
    AnonymousConsentsController,
    DataRequestsController,
    DataRequestCompletionController,
    AdminMeController,
    SuperAdminAdminsController,
    SuperAdminRolesController,
    AdminAuditController,
    SuperAdminActivityController,
    PublicSettingsController,
    SuperAdminSettingsController,
    SupportMessagesController,
    AdminSupportMessagesController,
    PublicCatalogController,
    AdminCatalogController,
    SuperAdminCatalogController,
    OwnerCatalogSuggestionsController,
    PublicVideoCommentsController,
    VideoCommentsController,
    AdminVideoCommentsController,
  ],
  providers: [
    VideoLikesService,
    FollowsService,
    VideoSharesService,
    ImageService,
    ImageDeliveryService,
    VideoService,
    VideoModerationService,
    ReadinessService,
    SessionService,
    OtpService,
    ProfileService,
    SessionCookie,
    GeoReadService,
    GeoLocationService,
    GeoAdminService,
    AddressService,
    ConsentService,
    DataRequestService,
    AdminAccountsService,
    RolesService,
    AuditReadService,
    PublicSettingsService,
    SettingsService,
    SupportService,
    CatalogTaxonomyService,
    CatalogHomeSectionsService,
    CatalogSuggestionsService,
    CatalogKeywordsService,
    VideoCommentsService,
    VideoCommentModerationService,
    VideoCommentEvents,
  ].map((provide) => ({ provide, useValue: Object.freeze({}) })),
})
class OpenApiModule {}

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((arg) => arg !== '--');
  if (args.length > 1 || (args[0] && !args[0].startsWith('--output='))) {
    throw new Error('Expected --output=<file>');
  }
  const output =
    args[0]?.slice('--output='.length) ||
    '../../packages/api-client/openapi.json';
  const app = await NestFactory.create(OpenApiModule, {
    logger: false,
    abortOnError: false,
  });
  try {
    const document = buildOpenApiDocument(app);
    await writeFile(resolve(output), `${JSON.stringify(document, null, 2)}\n`);
  } finally {
    await app.close();
  }
}

void main().catch((error: unknown) => {
  // Export runs without credentials or request input; report tooling diagnostics.
  process.stderr.write(
    `OpenAPI export failed: ${error instanceof Error ? error.message : 'unknown error'}\n`,
  );
  process.exitCode = 1;
});
