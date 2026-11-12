'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button, buttonClassName } from '@apnatown/ui/primitives/Button';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
  type StateTone,
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
  tone = 'surface',
  headingLevel,
}: {
  code: string;
  retry: () => void;
  retryDisabled?: boolean;
  tone?: StateTone;
  headingLevel?: 'h1' | 'h2';
}) {
  const t = useTranslations('auth.feedback');
  const State = code === 'ACCOUNT_UNAVAILABLE' ? NoPermissionState : ErrorState;
  return (
    <State
      tone={tone}
      headingLevel={headingLevel}
      title={t('title')}
      message={t(failureMessageKey(code))}
      action={
        <Button
          variant={tone === 'immersive' ? 'inverse' : 'primary'}
          disabled={retryDisabled}
          onClick={retry}
        >
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
  const searchParams = useSearchParams();
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
  const returnTo =
    safeReturnTo(videoFeedReturnTo(path, searchParams, locale)) ?? '/account';
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

function videoFeedReturnTo(
  path: string,
  searchParams: URLSearchParams,
  locale: 'en' | 'hi',
): string {
  const route = path.replace(/^\/(?:hi|en)(?=\/|$)/, '') || '/';
  if (
    route !== '/videos' &&
    !/^\/videos\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(
      route,
    )
  )
    return path;
  const safe = new URLSearchParams();
  const pill = searchParams.get('pill');
  if (pill && ['for_you', 'following', 'nearby', 'category'].includes(pill))
    safe.set('pill', pill);
  const category = searchParams.get('category');
  if (category && /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(category))
    safe.set('category', category);
  const video = searchParams.get('video');
  if (
    video &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(
      video,
    )
  )
    safe.set('video', video);
  const snapshotId = searchParams.get('snapshotId');
  if (
    snapshotId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(
      snapshotId,
    )
  )
    safe.set('snapshotId', snapshotId);
  const query = safe.toString();
  const localizedPath = publicHref(route, locale);
  return query ? `${localizedPath}?${query}` : localizedPath;
}
