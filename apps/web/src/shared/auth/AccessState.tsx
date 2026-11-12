'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Button, buttonClassName } from '@apnatown/ui/primitives/Button';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
} from '@apnatown/ui/feedback/StateViews';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { loginHref, safeReturnTo } from './return-to';
import { useSession } from './SessionProvider';
import { publicHref } from '../i18n/preferences';

const errors: Record<string, string> = {
  OTP_INVALID: 'invalidCode',
  OTP_EXPIRED: 'expiredCode',
  OTP_LOCKED: 'lockedCode',
  OTP_NOT_FOUND: 'missingCode',
  OTP_RATE_LIMITED: 'rateLimited',
  COMMON_RATE_LIMITED: 'rateLimited',
  OTP_DELIVERY_FAILED: 'deliveryFailed',
  CSRF_INVALID: 'csrf',
  ACCOUNT_UNAVAILABLE: 'unavailable',
  SESSION_EXPIRED: 'expired',
  VALIDATION_ERROR: 'validation',
  USER_NOT_FOUND: 'missingProfile',
};

/** `auth.feedback` message for a normalized failure code; never server text. */
export function failureMessageKey(code: string) {
  return errors[code] ?? 'requestFailed';
}

export function Failure({
  code,
  retry,
  retryDisabled = false,
}: {
  code: string;
  retry: () => void;
  retryDisabled?: boolean;
}) {
  const t = useTranslations('auth.feedback');
  const State = code === 'ACCOUNT_UNAVAILABLE' ? NoPermissionState : ErrorState;
  return (
    <State
      title={t('title')}
      message={t(failureMessageKey(code))}
      action={
        <Button disabled={retryDisabled} onClick={retry}>
          {t('retry')}
        </Button>
      }
    />
  );
}

export function AccessState({
  guest = false,
  guestMessage,
}: {
  guest?: boolean;
  /** Localized screen-specific reason to log in; defaults to the account copy. */
  guestMessage?: string | undefined;
}) {
  const { state, refresh } = useSession();
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const path = usePathname();
  const t = useTranslations('auth.feedback');
  if (state.kind === 'loading') return <Skeleton label={t('loading')} />;
  if (state.kind !== 'error') return null;
  if (state.code !== 'SESSION_EXPIRED')
    return (
      <Failure
        code={state.code}
        retry={() => {
          void refresh();
        }}
      />
    );
  const returnTo = safeReturnTo(path) ?? '/account';
  const href = guest
    ? loginHref(locale, returnTo)
    : `${publicHref('/session-expired', locale)}?${new URLSearchParams({ returnTo })}`;
  const State = guest ? EmptyState : NoPermissionState;
  return (
    <State
      title={t(guest ? 'guestTitle' : 'expiredTitle')}
      message={guest ? (guestMessage ?? t('guestMessage')) : t('expired')}
      action={
        <Link className={buttonClassName} href={href}>
          {t('login')}
        </Link>
      }
    />
  );
}
