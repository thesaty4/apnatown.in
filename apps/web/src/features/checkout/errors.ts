'use client';

import { useTranslations } from 'next-intl';
import { failureCode } from '../../shared/api/result';

/** Backend code → `errors.*` key (mirrors the API message_key catalogue). */
const serverKeys: Record<string, string> = {
  CHECKOUT_QUOTE_STALE: 'checkout.quoteStale',
  CHECKOUT_PAYMENT_UNAVAILABLE: 'checkout.paymentUnavailable',
  CHECKOUT_ADDRESS_INVALID: 'checkout.addressInvalid',
  CHECKOUT_ATTEMPT_NOT_FOUND: 'checkout.attemptNotFound',
  CHECKOUT_ATTEMPT_CONFLICT: 'checkout.attemptConflict',
  CHECKOUT_STATE_INVALID: 'checkout.stateInvalid',
  CHECKOUT_SPLIT_INVALID: 'checkout.splitInvalid',
  DELIVERY_UNAVAILABLE: 'checkout.deliveryUnavailable',
  MINIMUM_ORDER_NOT_MET: 'checkout.minimumOrderNotMet',
  ORDER_CHECKOUT_INVALID: 'orders.checkoutInvalid',
  ORDER_CREATION_CONFLICT: 'orders.creationConflict',
};

/** Generic/foundation codes → `checkout.errors.*`. Server text is never shown. */
const localKeys: Record<string, string> = {
  CART_VERSION_CONFLICT: 'cartChanged',
  CART_NOT_FOUND: 'cartChanged',
  CART_LINE_NOT_FOUND: 'cartChanged',
  CART_LINE_INVALID: 'cartChanged',
  CART_QUANTITY_INVALID: 'cartChanged',
  CART_EMPTY: 'cartChanged',
  ADDRESS_REQUIRED: 'addressChanged',
  ADDRESS_LOCATION_REQUIRED: 'addressChanged',
  DELIVERY_OUT_OF_RANGE: 'addressChanged',
  DELIVERY_FEE_UNAVAILABLE: 'addressChanged',
  COMMON_RATE_LIMITED: 'rateLimited',
  COMMON_FORBIDDEN: 'forbidden',
  CSRF_INVALID: 'security',
  SESSION_EXPIRED: 'security',
  SESSION_CHANGED: 'security',
  COMMON_CONFLICT: 'inProgress',
};

/** Failures after which the shown quote/cart must be re-read before placing. */
export const STALE_CHECKOUT_CODES = new Set([
  'CHECKOUT_QUOTE_STALE',
  'CHECKOUT_ADDRESS_INVALID',
  'DELIVERY_UNAVAILABLE',
  'MINIMUM_ORDER_NOT_MET',
  'ORDER_CHECKOUT_INVALID',
  'CHECKOUT_PAYMENT_UNAVAILABLE',
  ...Object.keys(localKeys).filter((code) =>
    ['cartChanged', 'addressChanged'].includes(localKeys[code] ?? ''),
  ),
]);

export function useCheckoutError() {
  const errors = useTranslations('errors');
  const t = useTranslations('checkout.errors');
  return (error: unknown) => {
    const code = failureCode(error);
    const server = serverKeys[code];
    return server ? errors(server) : t(localKeys[code] ?? 'generic');
  };
}
