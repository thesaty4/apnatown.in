'use client';

import { useTranslations } from 'next-intl';
import { failureCode } from '../../shared/api/result';

/** Backend code → `errors.*` key (mirrors the API message_key catalogue). */
const serverKeys: Record<string, string> = {
  ORDER_NOT_FOUND: 'orders.notFound',
  ORDER_VERSION_CONFLICT: 'orders.versionConflict',
  ORDERS_INVALID_TRANSITION: 'orders.invalidTransition',
  DELIVERY_CODE_NOT_READY: 'delivery.codeNotReady',
  DELIVERY_CODE_EXPIRED: 'delivery.codeExpired',
  DELIVERY_CODE_CONSUMED: 'delivery.codeConsumed',
  DELIVERY_CODE_COOLDOWN: 'delivery.codeCooldown',
  DELIVERY_CODE_LOCKED: 'delivery.codeLocked',
};

/** Foundation codes → `orders.errors.*`. Server text is never shown. */
const localKeys: Record<string, string> = {
  COMMON_RATE_LIMITED: 'rateLimited',
  COMMON_FORBIDDEN: 'forbidden',
  CSRF_INVALID: 'security',
  SESSION_EXPIRED: 'security',
  SESSION_CHANGED: 'security',
  COMMON_CONFLICT: 'inProgress',
};

export function useOrderError() {
  const errors = useTranslations('errors');
  const t = useTranslations('orders.errors');
  return (error: unknown) => {
    const code = failureCode(error);
    const server = serverKeys[code];
    return server ? errors(server) : t(localKeys[code] ?? 'generic');
  };
}

export const isForbidden = (error: unknown) =>
  failureCode(error) === 'COMMON_FORBIDDEN';
export const isMissing = (error: unknown) =>
  ['ORDER_NOT_FOUND', 'COMMON_NOT_FOUND'].includes(failureCode(error));
