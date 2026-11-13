import 'reflect-metadata';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { buildOpenApiDocument } from './document';
import { RealtimeController } from '../realtime/realtime.controller';
import { RealtimeStreamService } from '../realtime/realtime-stream.service';
import { HealthController } from '../health/health.controller';
import { ReadinessService } from '../health/readiness';
import { AuthController } from '../../modules/auth/presentation/auth.controller';
import { DemoLoginController } from '../../modules/auth/presentation/demo-login.controller';
import { DemoLoginService } from '../../modules/auth/application/demo-login.service';
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
import { SavedController } from '../../modules/engagement/presentation/saved.controller';
import { SavedService } from '../../modules/engagement/application/saved.service';
import { SearchHomeController } from '../../modules/search/presentation/search-home.controller';
import { SearchHomeService } from '../../modules/search/application/search-home.service';
import { ExploreController } from '../../modules/search/presentation/explore.controller';
import { ExploreService } from '../../modules/search/application/explore.service';
import { SearchController } from '../../modules/search/presentation/search.controller';
import { SearchService } from '../../modules/search/application/search.service';
import { ServiceBookmarksController } from '../../modules/engagement/presentation/service-bookmarks.controller';
import { ServiceBookmarksService } from '../../modules/engagement/application/service-bookmarks.service';
import { ProductPublicController } from '../../modules/products/presentation/product-public.controller';
import { ProductReadService } from '../../modules/products/application/product-read.service';
import { ProductBusinessPublicController } from '../../modules/products/presentation/product-business-public.controller';
import { ProductBusinessPublicService } from '../../modules/products/application/product-business-public.service';
import { ServiceBusinessPublicController } from '../../modules/services/presentation/service-business-public.controller';
import { ServiceBusinessPublicService } from '../../modules/services/application/service-business-public.service';
import {
  ProductBulkController,
  ProductOwnerController,
} from '../../modules/products/presentation/product-owner.controller';
import { InventoryController } from '../../modules/products/presentation/inventory.controller';
import { ProductPillsController } from '../../modules/products/presentation/product-pills.controller';
import { ProductImportController } from '../../modules/products/presentation/product-import.controller';
import { ProductImportService } from '../../modules/products/application/product-import.service';
import { ProductOwnerService } from '../../modules/products/application/product-owner.service';
import { ProductWriteService } from '../../modules/products/application/product-write.service';
import { ProductBulkService } from '../../modules/products/application/product-bulk.service';
import { InventoryService } from '../../modules/products/application/inventory.service';
import { ProductPillsService } from '../../modules/products/application/product-pills.service';
import { ServicePublicController } from '../../modules/services/presentation/service-public.controller';
import { ServiceReadService } from '../../modules/services/application/service-read.service';
import {
  ProviderExpertiseOwnerController,
  ProviderExpertisePublicController,
} from '../../modules/services/presentation/provider-expertise.controller';
import { ProviderExpertiseService } from '../../modules/services/application/provider-expertise.service';
import {
  EnquiryOwnerController,
  EnquiryPublicController,
} from '../../modules/services/presentation/enquiry.controller';
import { EnquiryCreateService } from '../../modules/services/application/enquiry-create.service';
import { EnquiryInboxService } from '../../modules/services/application/enquiry-inbox.service';
import { ServiceOwnerController } from '../../modules/services/presentation/service-owner.controller';
import { ServiceOwnerService } from '../../modules/services/application/service-owner.service';
import { ServiceOwnerWriteService } from '../../modules/services/application/service-owner-write.service';
import { BusinessDiscoveryDetailController } from '../../modules/businesses/presentation/business-discovery-detail.controller';
import { BusinessDiscoveryDetailService } from '../../modules/businesses/application/business-discovery-detail.service';
import { BusinessOwnerController } from '../../modules/businesses/presentation/business-owner.controller';
import { BusinessAdminController } from '../../modules/businesses/presentation/business-admin.controller';
import { BusinessOwnerService } from '../../modules/businesses/application/business-owner.service';
import { BusinessAdminReadService } from '../../modules/businesses/application/business-admin-read.service';
import { BusinessDecisionService } from '../../modules/businesses/application/business-decision.service';
import { AdminApprovalsController } from '../../modules/admin/presentation/admin-approvals.controller';
import { AdminApprovalsService } from '../../modules/admin/application/admin-approvals.service';
import { RiderMeController } from '../../modules/delivery/presentation/rider-me.controller';
import { RiderWorkController } from '../../modules/delivery/presentation/rider-work.controller';
import { RiderAdminController } from '../../modules/delivery/presentation/rider-admin.controller';
import { RiderProfileService } from '../../modules/delivery/application/rider-profile.service';
import { RiderDisputeService } from '../../modules/delivery/application/rider-dispute.service';
import { RiderWorkService } from '../../modules/delivery/application/rider-work.service';
import { RiderJobsService } from '../../modules/delivery/application/rider-jobs.service';
import { RiderAdminReadService } from '../../modules/delivery/application/rider-admin-read.service';
import { RiderDecisionService } from '../../modules/delivery/application/rider-decision.service';
import { CartController } from '../../modules/cart-checkout/presentation/cart.controller';
import { CartLinesController } from '../../modules/cart-checkout/presentation/cart-lines.controller';
import { CartReadService } from '../../modules/cart-checkout/application/cart-read.service';
import { CartMergeService } from '../../modules/cart-checkout/application/cart-merge.service';
import { CartLinesService } from '../../modules/cart-checkout/application/cart-lines.service';
import { GuestCartCapability } from '../../modules/cart-checkout/application/guest-cart-capability';
import { GuestCartCookie } from '../../modules/cart-checkout/presentation/guest-cart.cookie';
import { NotificationsController } from '../../modules/notifications/presentation/notifications.controller';
import { NotificationFeedService } from '../../modules/notifications/application/notification-feed.service';
import { NotificationPreferencesService } from '../../modules/notifications/application/notification-preferences.service';
import { AdminListingProductsController } from '../../modules/admin/presentation/admin-listing-products.controller';
import { AdminListingsController } from '../../modules/admin/presentation/admin-listings.controller';
import {
  AdminListingReportsController,
  ListingReportsController,
} from '../../modules/admin/presentation/admin-listing-reports.controller';
import { AdminListingsService } from '../../modules/admin/application/admin-listings.service';
import { AdminListingReportsService } from '../../modules/admin/application/admin-listing-reports.service';
import { ListingReportIntakeService } from '../../modules/admin/application/listing-report-intake.service';
import { PRODUCT_ADMIN } from '../../modules/products/application/product-admin.port';
import { OwnerVideoManageController } from '../../modules/media-videos/presentation/owner-video-manage.controller';
import { OwnerGalleryController } from '../../modules/media-videos/presentation/owner-gallery.controller';
import {
  LinkedVideoController,
  PhotoReportController,
  PublicBusinessMediaController,
} from '../../modules/media-videos/presentation/public-media.controller';
import { OwnerVideoService } from '../../modules/media-videos/application/owner-video.service';
import { OwnerGalleryService } from '../../modules/media-videos/application/owner-gallery.service';
import { MediaOrderService } from '../../modules/media-videos/application/media-order.service';
import { PublicMediaService } from '../../modules/media-videos/application/public-media.service';
import { PhotoReportService } from '../../modules/media-videos/application/photo-report.service';
import { MediaReportModerationService } from '../../modules/media-videos/application/media-report-moderation.service';
import { ReviewsPublicController } from '../../modules/reviews/presentation/reviews-public.controller';
import { ReviewsOwnerController } from '../../modules/reviews/presentation/reviews-owner.controller';
import { FollowerInsightsController } from '../../modules/engagement/presentation/follower-insights.controller';
import { ReviewsPublicService } from '../../modules/reviews/application/reviews-public.service';
import { ReviewsOwnerService } from '../../modules/reviews/application/reviews-owner.service';
import { OwnerOffersService } from '../../modules/offers/application/owner-offers.service';
import { PublicPromotionsService } from '../../modules/offers/application/public-promotions.service';
import { OwnerOffersController } from '../../modules/offers/presentation/owner-offers.controller';
import {
  PublicOffersController,
  PublicPlacementsController,
} from '../../modules/offers/presentation/public-promotions.controller';
import { OwnerEarningsService } from '../../modules/payments/application/owner-earnings.service';
import { OwnerEarningsController } from '../../modules/payments/presentation/owner-earnings.controller';
import { FollowerInsightsService } from '../../modules/engagement/application/follower-insights.service';
import {
  CartQuoteController,
  CheckoutAttemptsController,
} from '../../modules/cart-checkout/presentation/checkout.controller';
import { CheckoutQuoteService } from '../../modules/cart-checkout/application/checkout-quote.service';
import { CheckoutAttemptService } from '../../modules/cart-checkout/application/checkout-attempt.service';
import { OrdersController } from '../../modules/orders/presentation/orders.controller';
import { BusinessOrdersController } from '../../modules/orders/presentation/business-orders.controller';
import { AdminOrdersController } from '../../modules/orders/presentation/admin-orders.controller';
import { OrderReadService } from '../../modules/orders/application/order-read.service';
import { OrderCommandsService } from '../../modules/orders/application/order-commands.service';
import { OrderAdminReadService } from '../../modules/orders/application/order-admin-read.service';
import { HandoverController } from '../../modules/delivery/presentation/handover.controller';
import { HandoverService } from '../../modules/delivery/application/handover.service';
import { CustomerCodeService } from '../../modules/delivery/application/customer-code.service';
import { DispatchController } from '../../modules/delivery/presentation/dispatch.controller';
import { RiderJobController } from '../../modules/delivery/presentation/rider-job.controller';
import { OwnerDispatchService } from '../../modules/delivery/application/owner-dispatch.service';
import { RiderOfferService } from '../../modules/delivery/application/rider-offer.service';
import { RiderJobProgressService } from '../../modules/delivery/application/rider-job-progress.service';
import { RiderJobCompleteService } from '../../modules/delivery/application/rider-job-complete.service';

// Metadata-only composition; never imported by AppModule or WorkerModule.
// No runtime config, repository, DB client, provider, queue or listen.
@Module({
  controllers: [
    SavedController,
    ServiceBookmarksController,
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
    // Local/test-only route; documented so the typed client can call it (ADR 0002).
    DemoLoginController,
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
    SearchHomeController,
    SearchController,
    ExploreController,
    ProductPublicController,
    ProductBusinessPublicController,
    ProductBulkController,
    ProductImportController,
    ProductOwnerController,
    InventoryController,
    ProductPillsController,
    ServicePublicController,
    ServiceBusinessPublicController,
    EnquiryPublicController,
    ProviderExpertiseOwnerController,
    EnquiryOwnerController,
    ServiceOwnerController,
    ProviderExpertisePublicController,
    BusinessDiscoveryDetailController,
    BusinessOwnerController,
    BusinessAdminController,
    AdminApprovalsController,
    RiderMeController,
    RiderWorkController,
    RiderAdminController,
    CartController,
    CartLinesController,
    NotificationsController,
    AdminListingProductsController,
    AdminListingsController,
    AdminListingReportsController,
    ListingReportsController,
    OwnerVideoManageController,
    OwnerGalleryController,
    PublicBusinessMediaController,
    LinkedVideoController,
    PhotoReportController,
    ReviewsPublicController,
    ReviewsOwnerController,
    OwnerOffersController,
    PublicOffersController,
    PublicPlacementsController,
    OwnerEarningsController,
    FollowerInsightsController,
    CartQuoteController,
    CheckoutAttemptsController,
    OrdersController,
    BusinessOrdersController,
    AdminOrdersController,
    HandoverController,
    DispatchController,
    RiderJobController,
    RealtimeController,
  ],
  providers: [
    SavedService,
    ServiceBookmarksService,
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
    DemoLoginService,
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
    SearchHomeService,
    ExploreService,
    SearchService,
    ProductReadService,
    ProductBusinessPublicService,
    ProductOwnerService,
    ProductWriteService,
    ProductBulkService,
    ProductImportService,
    InventoryService,
    ProductPillsService,
    ServiceReadService,
    ServiceBusinessPublicService,
    ProviderExpertiseService,
    EnquiryCreateService,
    EnquiryInboxService,
    ServiceOwnerService,
    ServiceOwnerWriteService,
    BusinessDiscoveryDetailService,
    BusinessOwnerService,
    BusinessAdminReadService,
    BusinessDecisionService,
    AdminApprovalsService,
    RiderProfileService,
    RiderDisputeService,
    RiderWorkService,
    RiderJobsService,
    RiderAdminReadService,
    RiderDecisionService,
    CartReadService,
    CartMergeService,
    CartLinesService,
    GuestCartCapability,
    GuestCartCookie,
    NotificationFeedService,
    NotificationPreferencesService,
    AdminListingsService,
    AdminListingReportsService,
    ListingReportIntakeService,
    PRODUCT_ADMIN,
    OwnerVideoService,
    OwnerGalleryService,
    MediaOrderService,
    PublicMediaService,
    PhotoReportService,
    MediaReportModerationService,
    ReviewsPublicService,
    ReviewsOwnerService,
    OwnerOffersService,
    PublicPromotionsService,
    OwnerEarningsService,
    FollowerInsightsService,
    CheckoutQuoteService,
    CheckoutAttemptService,
    OrderReadService,
    OrderCommandsService,
    OrderAdminReadService,
    HandoverService,
    CustomerCodeService,
    OwnerDispatchService,
    RiderOfferService,
    RiderJobProgressService,
    RiderJobCompleteService,
    RealtimeStreamService,
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
