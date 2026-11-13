/** Commands rejected because the rendered order/handover state is stale:
 * the order is re-read so the next attempt uses current versions. */
export const STALE_CODES: ReadonlySet<string> = new Set([
  'ORDER_VERSION_CONFLICT',
  'ORDERS_INVALID_TRANSITION',
  'DELIVERY_VERSION_CONFLICT',
  'DELIVERY_INVALID_TRANSITION',
  'ORDERS_RIDER_DISPATCH_UNAVAILABLE',
]);

/** Handover-code rejections; the typed code is always cleared afterwards. */
export const CODE_CODES: ReadonlySet<string> = new Set([
  'DELIVERY_CODE_INVALID',
  'DELIVERY_CODE_LOCKED',
  'DELIVERY_CODE_EXPIRED',
  'DELIVERY_CODE_NOT_READY',
  'DELIVERY_CODE_CONSUMED',
  'DELIVERY_COD_NOT_CONFIRMED',
]);

export const REFRESH_CODES: ReadonlySet<string> = new Set([
  ...STALE_CODES,
  ...CODE_CODES,
]);

/** Owner-route denials (not approved / not this business's order). */
export const ORDER_DENIED_CODES: ReadonlySet<string> = new Set([
  'COMMON_FORBIDDEN',
  'BUSINESS_NOT_OWNED',
  'BUSINESS_SCOPE_DENIED',
  'BUSINESS_NOT_FOUND',
]);

const keys: Record<string, string> = {
  ORDER_NOT_FOUND: 'notFound',
  ORDER_VERSION_CONFLICT: 'versionConflict',
  DELIVERY_VERSION_CONFLICT: 'versionConflict',
  ORDERS_INVALID_TRANSITION: 'invalidTransition',
  DELIVERY_INVALID_TRANSITION: 'invalidTransition',
  ORDERS_RIDER_DISPATCH_UNAVAILABLE: 'riderDispatchUnavailable',
  DELIVERY_CODE_INVALID: 'codeInvalid',
  DELIVERY_CODE_LOCKED: 'codeLocked',
  DELIVERY_CODE_EXPIRED: 'codeExpired',
  DELIVERY_CODE_NOT_READY: 'codeNotReady',
  DELIVERY_CODE_CONSUMED: 'codeConsumed',
  DELIVERY_COD_NOT_CONFIRMED: 'cashNotConfirmed',
  ORDERS_FILTER_INVALID: 'requestFailed',
  COMMON_FORBIDDEN: 'forbidden',
  BUSINESS_NOT_OWNED: 'forbidden',
  BUSINESS_SCOPE_DENIED: 'forbidden',
  COMMON_RATE_LIMITED: 'rateLimited',
  RATE_LIMITED: 'rateLimited',
  VALIDATION_ERROR: 'validation',
  COMMON_VALIDATION: 'validation',
  COMMON_VALIDATION_FAILED: 'validation',
  MAINTENANCE: 'maintenance',
};

/** `ownerOrders.errors.*` key for a normalized code; never server text. */
export const orderErrorKey = (code: string) => keys[code] ?? 'requestFailed';
