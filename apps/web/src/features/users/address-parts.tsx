'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { Address } from '@apnatown/shared/users';
import { Button } from '@apnatown/ui/primitives/Button';
import { failureMessageKey } from '../../shared/auth/AccessState';

/** Localized secondary lines for AddressCard; raw coordinates are never shown. */
export function useAddressDetails() {
  const t = useTranslations('account.addresses');
  return (address: Address) => [
    ...(address.landmark
      ? [t('landmark', { landmark: address.landmark })]
      : []),
    t('pin', { pinCode: address.pinCode }),
    ...(address.lat !== null ? [`📍 ${t('pinSaved')}`] : []),
  ];
}

/** Compact alert inside the list or sheet; the text states the problem, not colour. */
export function InlineAlert({
  message,
  action,
  children,
}: {
  message: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="grid gap-2 rounded-md border border-error bg-error-soft p-3 text-text"
    >
      <p className="flex gap-2">
        <span aria-hidden="true">⚠️</span>
        <span className="min-w-0 [overflow-wrap:anywhere]">{message}</span>
      </p>
      {children}
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

const addressErrors: Record<string, string> = {
  ADDRESS_VERSION_CONFLICT: 'conflict',
  ADDRESS_NOT_FOUND: 'notFound',
  ADDRESS_OUT_OF_SCOPE: 'outOfScope',
  COMMON_CONFLICT: 'inProgress',
  COMMON_VALIDATION_FAILED: 'validation',
  VALIDATION_ERROR: 'validation',
  COMMON_FORBIDDEN: 'forbidden',
  FORBIDDEN: 'forbidden',
};
// Repeating the identical command cannot help: fix input or review the latest state.
const noRetry = new Set([
  'ADDRESS_OUT_OF_SCOPE',
  'COMMON_VALIDATION_FAILED',
  'VALIDATION_ERROR',
  'COMMON_FORBIDDEN',
  'FORBIDDEN',
  'ACCOUNT_UNAVAILABLE',
  'SESSION_EXPIRED',
]);
const needsRefresh = new Set(['ADDRESS_VERSION_CONFLICT', 'ADDRESS_NOT_FOUND']);

export const isForbidden = (code: string) =>
  addressErrors[code] === 'forbidden';

export function AddressFailure({
  code,
  busy,
  retry,
  refresh,
}: {
  code: string;
  busy: boolean;
  retry: () => void;
  refresh: () => void;
}) {
  const t = useTranslations('account.addresses');
  const feedback = useTranslations('auth.feedback');
  const own = addressErrors[code];
  return (
    <InlineAlert
      message={own ? t(`errors.${own}`) : feedback(failureMessageKey(code))}
      action={
        needsRefresh.has(code) ? (
          <Button variant="outline" disabled={busy} onClick={refresh}>
            {t('refresh')}
          </Button>
        ) : noRetry.has(code) ? undefined : (
          <Button variant="outline" disabled={busy} onClick={retry}>
            {t('retry')}
          </Button>
        )
      }
    />
  );
}
