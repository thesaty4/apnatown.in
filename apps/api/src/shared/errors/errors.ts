import type { ErrorDetails, ErrorResponse } from '@apnatown/shared/wire';

const catalogue = {
  OTP_INVALID: [401, 'errors.auth.otp.invalid'],
  OTP_NOT_FOUND: [404, 'errors.auth.otp.notFound'],
  OTP_EXPIRED: [410, 'errors.auth.otp.expired'],
  OTP_LOCKED: [429, 'errors.auth.otp.locked'],
  OTP_RATE_LIMITED: [429, 'errors.auth.otp.rateLimited'],
  OTP_DELIVERY_FAILED: [503, 'errors.auth.otp.deliveryFailed'],
  SESSION_EXPIRED: [401, 'errors.auth.session.expired'],
  CSRF_INVALID: [403, 'errors.auth.session.csrfInvalid'],
  ACCOUNT_UNAVAILABLE: [403, 'errors.auth.account.unavailable'],
  USER_NOT_FOUND: [404, 'errors.users.notFound'],
  ADDRESS_NOT_FOUND: [404, 'errors.users.address.notFound'],
  ADDRESS_OUT_OF_SCOPE: [403, 'errors.users.address.outOfScope'],
  ADDRESS_VERSION_CONFLICT: [409, 'errors.users.address.versionConflict'],
  CONSENT_PURPOSE_INVALID: [422, 'errors.users.consent.purposeInvalid'],
  CONSENT_NOTICE_INVALID: [422, 'errors.users.consent.noticeInvalid'],
  DATA_REQUEST_NOT_FOUND: [404, 'errors.users.data.notFound'],
  DATA_REQUEST_CONFLICT: [409, 'errors.users.data.conflict'],
  DATA_REQUEST_NOT_READY: [409, 'errors.users.data.notReady'],
  DATA_EXPORT_EXPIRED: [410, 'errors.users.data.expired'],
  CITY_NOT_FOUND: [404, 'errors.geo.city.notFound'],
  AREA_NOT_FOUND: [404, 'errors.geo.area.notFound'],
  PIN_CODE_INVALID: [422, 'errors.geo.pin.invalid'],
  LOCATION_INVALID: [422, 'errors.geo.location.invalid'],
  LOCATION_UNRESOLVED: [422, 'errors.geo.location.unresolved'],
  CITY_SLUG_CONFLICT: [409, 'errors.geo.city.slugConflict'],
  CITY_TRANSITION_INVALID: [409, 'errors.geo.city.transitionInvalid'],
  ZONE_NOT_FOUND: [404, 'errors.geo.zone.notFound'],
  ZONE_INVALID: [422, 'errors.geo.zone.invalid'],
  FEE_SLAB_INVALID: [422, 'errors.geo.feeSlab.invalid'],
  GEO_VERSION_CONFLICT: [409, 'errors.geo.versionConflict'],
  COMMON_VALIDATION_FAILED: [400, 'errors.common.validationFailed'],
  COMMON_UNAUTHENTICATED: [401, 'errors.common.unauthenticated'],
  COMMON_FORBIDDEN: [403, 'errors.common.forbidden'],
  COMMON_NOT_FOUND: [404, 'errors.common.notFound'],
  COMMON_CONFLICT: [409, 'errors.common.conflict'],
  COMMON_RATE_LIMITED: [429, 'errors.common.rateLimited'],
  COMMON_UNAVAILABLE: [503, 'errors.common.unavailable'],
  COMMON_INTERNAL_ERROR: [500, 'errors.common.internalError'],
  VALIDATION_ERROR: [400, 'errors.common.validationFailed'],
  FORBIDDEN: [403, 'errors.common.forbidden'],
  AUTH_REQUIRED: [401, 'errors.auth.required'],
  RATE_LIMITED: [429, 'errors.common.rateLimited'],
  COMMON_MONEY_INVALID: [422, 'errors.money.invalid'],
  CHECKOUT_SPLIT_INVALID: [409, 'errors.checkout.splitInvalid'],
  ORDERS_INVALID_TRANSITION: [409, 'errors.orders.invalidTransition'],
  DELIVERY_CODE_INVALID: [422, 'errors.delivery.codeInvalid'],
  USERS_APPROVAL_REQUIRED: [403, 'errors.users.approvalRequired'],
  CATALOG_CATEGORY_FORBIDDEN: [403, 'errors.catalog.categoryForbidden'],
  SERVICES_SUBCATEGORY_REQUIRED: [422, 'errors.services.subcategoryRequired'],
  REVIEWS_NOT_ELIGIBLE: [403, 'errors.reviews.notEligible'],
  MEDIA_VIDEO_NOT_PUBLISHED: [409, 'errors.media.videoNotPublished'],
  COMMUNICATIONS_CONSENT_REQUIRED: [
    422,
    'errors.communications.consentRequired',
  ],
  ADMIN_SCOPE_FORBIDDEN: [403, 'errors.admin.scopeForbidden'],
  ADMIN_ROLE_IN_USE: [409, 'errors.admin.roleInUse'],
  ADMIN_EXISTS: [409, 'errors.admin.exists'],
  ADMIN_VERSION_CONFLICT: [409, 'errors.admin.versionConflict'],
  ADMIN_SELF_ACTION: [422, 'errors.admin.selfAction'],
  ADMIN_INACTIVE: [403, 'errors.admin.inactive'],
  ROLE_NOT_FOUND: [404, 'errors.role.notFound'],
  ROLE_NAME_TAKEN: [409, 'errors.role.nameTaken'],
  ROLE_SYSTEM_LOCKED: [409, 'errors.role.systemLocked'],
  ROLE_IN_USE: [409, 'errors.role.inUse'],
  ROLE_VERSION_CONFLICT: [409, 'errors.role.versionConflict'],
  REPORT_TOO_LARGE: [413, 'errors.reports.tooLarge'],
  AUDIT_NOT_FOUND: [404, 'errors.audit.notFound'],
  ADMIN_CREATION_POLICY_REQUIRED: [409, 'errors.admin.creationPolicyRequired'],
  ADMIN_INFLIGHT_POLICY_REQUIRED: [409, 'errors.admin.inflightPolicyRequired'],
  ADMIN_METRIC_POLICY_REQUIRED: [409, 'errors.admin.metricPolicyRequired'],
  USERS_DATA_REQUEST_REQUIRED: [409, 'errors.users.dataRequestRequired'],
  SEARCH_FILTER_INVALID: [400, 'errors.search.filterInvalid'],
  MEDIA_SURFACE_CONSENT_REQUIRED: [422, 'errors.media.surfaceConsentRequired'],
  OFFERS_NOT_ACTIVE: [409, 'errors.offers.notActive'],
  CHECKOUT_COUPON_INVALID: [422, 'errors.checkout.couponInvalid'],
  ORDERS_REFUND_WINDOW_CLOSED: [409, 'errors.orders.refundWindowClosed'],
  SETTINGS_INVALID: [422, 'errors.settings.invalid'],
  SETTINGS_VERSION_CONFLICT: [409, 'errors.settings.versionConflict'],
  LEGAL_PAGE_NOT_FOUND: [404, 'errors.legal.notFound'],
  MAINTENANCE: [503, 'errors.system.maintenance'],
  SETTINGS_GROUP_REQUIRED: [422, 'errors.settings.groupRequired'],
  FEATURE_NOT_AVAILABLE: [409, 'errors.settings.featureNotAvailable'],
  SUPPORT_MESSAGE_NOT_FOUND: [404, 'errors.support.messageNotFound'],
  CATEGORY_NOT_FOUND: [404, 'errors.catalog.categoryNotFound'],
  CATEGORY_CONFLICT: [409, 'errors.catalog.categoryConflict'],
  SUBCATEGORY_NOT_FOUND: [404, 'errors.catalog.subcategoryNotFound'],
  SUBCATEGORY_DUPLICATE: [409, 'errors.catalog.subcategoryDuplicate'],
  SUGGESTION_DUPLICATE: [409, 'errors.catalog.suggestion.duplicate'],
  SUGGESTION_SIMILARITY_WARNING: [
    409,
    'errors.catalog.suggestion.similarityWarning',
  ],
  SUGGESTION_NOT_FOUND: [404, 'errors.catalog.suggestion.notFound'],
  SUGGESTION_STATE_INVALID: [409, 'errors.catalog.suggestion.stateInvalid'],
  SUGGESTION_SCOPE_DENIED: [403, 'errors.catalog.suggestion.scopeDenied'],
  SUGGESTION_MERGE_TARGET_INVALID: [
    422,
    'errors.catalog.suggestion.mergeTargetInvalid',
  ],
  KEYWORD_MAPPING_NOT_FOUND: [404, 'errors.catalog.keyword.notFound'],
  KEYWORD_MAPPING_CONFLICT: [409, 'errors.catalog.keyword.conflict'],
  KEYWORD_TARGET_INVALID: [422, 'errors.catalog.keyword.targetInvalid'],
  CATALOG_HOME_SECTION_NOT_FOUND: [404, 'errors.catalog.homeSection.notFound'],
  CATALOG_HOME_SECTION_INVALID: [422, 'errors.catalog.homeSection.invalid'],
  CATALOG_HOME_SECTION_CONFLICT: [409, 'errors.catalog.homeSection.conflict'],
  CATALOG_HOME_SECTION_STATE_INVALID: [
    409,
    'errors.catalog.homeSection.stateInvalid',
  ],
  CATALOG_IMAGE_INVALID: [422, 'errors.catalog.imageInvalid'],
  CATALOG_VERSION_CONFLICT: [409, 'errors.catalog.versionConflict'],
} as const;

export type ErrorCode = keyof typeof catalogue;

export class DomainError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly details: ErrorDetails = {},
    readonly retryAfterSeconds?: number,
  ) {
    super(code);
    if (!Object.hasOwn(catalogue, code))
      throw new Error('UNREGISTERED_DOMAIN_ERROR');
    if (
      retryAfterSeconds !== undefined &&
      (!Number.isInteger(retryAfterSeconds) ||
        retryAfterSeconds < 1 ||
        retryAfterSeconds > 60)
    )
      throw new Error('INVALID_RETRY_AFTER');
    this.name = 'DomainError';
  }
}

export function errorResponse(
  code: ErrorCode,
  correlationId: string,
  details: ErrorDetails = {},
): ErrorResponse {
  const [status, message_key] = catalogue[code];
  return { code, message_key, status, details, correlationId };
}
