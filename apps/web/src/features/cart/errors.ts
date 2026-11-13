import { failureCode } from '../../shared/api/result';

/** Code → `cart.errors.*` key. Server text is never displayed. */
const keys: Record<string, string> = {
  CART_NOT_FOUND: 'notFound',
  CART_LINE_NOT_FOUND: 'lineNotFound',
  CART_LINE_INVALID: 'lineInvalid',
  CART_QUANTITY_INVALID: 'quantityInvalid',
  CART_VERSION_CONFLICT: 'changed',
  PRODUCT_NOT_AVAILABLE: 'productUnavailable',
  COMMON_UNAVAILABLE: 'guestUnavailable',
  COMMON_RATE_LIMITED: 'rateLimited',
  CSRF_INVALID: 'security',
  SESSION_EXPIRED: 'security',
  SESSION_CHANGED: 'security',
  COMMON_CONFLICT: 'inProgress',
};

export type CartErrorKey =
  | 'notFound'
  | 'lineNotFound'
  | 'lineInvalid'
  | 'quantityInvalid'
  | 'changed'
  | 'productUnavailable'
  | 'guestUnavailable'
  | 'rateLimited'
  | 'security'
  | 'inProgress'
  | 'generic';

export function cartErrorKey(error: unknown): CartErrorKey {
  return (keys[failureCode(error)] as CartErrorKey | undefined) ?? 'generic';
}

/** Failures that changed nothing server-side but invalidate the shown cart. */
export const STALE_CART_CODES = new Set([
  'CART_VERSION_CONFLICT',
  'CART_LINE_NOT_FOUND',
  'CART_NOT_FOUND',
  'CART_QUANTITY_INVALID',
  'PRODUCT_NOT_AVAILABLE',
]);
