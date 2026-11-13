'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { isDashboardPath, publicHref } from '../i18n/preferences';
import { NavIcon } from './NavIcon';

/** Compact Search entry for widths where the header form does not fit. */
export function HeaderSearchLink() {
  const t = useTranslations('search.screen');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const path = usePathname().replace(/^\/(?:hi|en)(?=\/|$)/, '') || '/';
  if (isDashboardPath(path)) return null;
  return (
    <Link
      href={publicHref('/search', locale)}
      aria-label={t('title')}
      className="inline-flex size-touch items-center justify-center rounded-md text-text hover:bg-primary-soft hover:text-primary-ink focus-visible:ring-focus tablet:hidden"
    >
      <NavIcon name="search" />
    </Link>
  );
}
