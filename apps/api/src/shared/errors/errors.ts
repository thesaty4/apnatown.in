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
  CITY_NOT_FOUND: [404, 'errors.geo.city.notFound'],
  AREA_NOT_FOUND: [404, 'errors.geo.area.notFound'],
  PIN_CODE_INVALID: [422, 'errors.geo.pin.invalid'],
  LOCATION_INVALID: [422, 'errors.geo.location.invalid'],
  LOCATION_UNRESOLVED: [422, 'errors.geo.location.unresolved'],
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
  USERS_DATA_REQUEST_REQUIRED: [409, 'errors.users.dataRequestRequired'],
  SEARCH_FILTER_INVALID: [400, 'errors.search.filterInvalid'],
  MEDIA_SURFACE_CONSENT_REQUIRED: [422, 'errors.media.surfaceConsentRequired'],
  OFFERS_NOT_ACTIVE: [409, 'errors.offers.notActive'],
  CHECKOUT_COUPON_INVALID: [422, 'errors.checkout.couponInvalid'],
  ORDERS_REFUND_WINDOW_CLOSED: [409, 'errors.orders.refundWindowClosed'],
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
