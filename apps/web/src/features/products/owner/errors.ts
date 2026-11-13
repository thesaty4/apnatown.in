/** Localized `products.errors.*` key for a normalized failure code. */
export function productErrorKey(code: string) {
  switch (code) {
    case 'PRODUCT_NOT_FOUND':
      return 'notFound';
    case 'PRODUCT_NOT_OWNED':
    case 'COMMON_FORBIDDEN':
    case 'BUSINESS_NOT_OWNED':
    case 'BUSINESS_SCOPE_DENIED':
      return 'forbidden';
    case 'PRODUCT_INVALID':
    case 'VALIDATION_ERROR':
    case 'COMMON_VALIDATION':
      return 'invalid';
    case 'PRODUCT_STOCK_INVALID':
      return 'stockInvalid';
    case 'PRODUCT_VERSION_CONFLICT':
      return 'versionConflict';
    case 'PRODUCT_SKU_CONFLICT':
      return 'skuConflict';
    case 'PRODUCT_BULK_INVALID':
      return 'bulkInvalid';
    case 'PRODUCT_PILL_INVALID':
      return 'pillInvalid';
    case 'PRODUCT_RESTOCK_TOO_MANY':
      return 'restockTooMany';
    case 'FEATURED_ENTITLEMENT_UNAVAILABLE':
      return 'featuredUnavailable';
    case 'USERS_APPROVAL_REQUIRED':
      return 'approvalRequired';
    case 'PRODUCT_IMPORT_INVALID':
      return 'importInvalid';
    case 'PRODUCT_IMPORT_LIMIT':
      return 'importLimit';
    case 'PRODUCT_IMPORT_POLICY_REQUIRED':
      return 'importDisabled';
    case 'COMMON_RATE_LIMITED':
      return 'rateLimited';
    case 'COMMON_IDEMPOTENCY_CONFLICT':
    case 'IDEMPOTENCY_CONFLICT':
      return 'idempotencyConflict';
    default:
      return 'requestFailed';
  }
}

/** Denied for the whole screen (render no-permission, never a retry loop). */
export const productDeniedCodes = new Set([
  'COMMON_FORBIDDEN',
  'PRODUCT_NOT_OWNED',
  'BUSINESS_NOT_OWNED',
  'BUSINESS_SCOPE_DENIED',
]);
