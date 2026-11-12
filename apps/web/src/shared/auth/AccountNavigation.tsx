'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useSession } from './SessionProvider';
import { loginHref } from './return-to';

export function AccountNavigation() {
  const { state } = useSession();
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const t = useTranslations('auth.login');
  const reels = useTranslations('reels.feed');
  const saved = useTranslations('engagement.saved');
  return (
    <nav className="flex flex-wrap gap-2">
      <Link
        className="inline-flex min-h-touch items-center gap-2 rounded-sm px-3 underline"
        href="/videos"
      >
        <svg
          aria-hidden="true"
          className="size-4 shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M7 4l13 8-13 8z" />
        </svg>
        {reels('title')}
      </Link>
      <Link
        className="inline-flex min-h-touch items-center rounded-sm px-3 underline"
        href="/saved"
      >
        {saved('title')}
      </Link>
      <Link
        className="inline-flex min-h-touch items-center rounded-sm px-3 underline"
        href={
          state.kind === 'ready' ? '/account' : loginHref(locale, '/account')
        }
      >
        {t(state.kind === 'ready' ? 'account' : 'login')}
      </Link>
    </nav>
  );
}
