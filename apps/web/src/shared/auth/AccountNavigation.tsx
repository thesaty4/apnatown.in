'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { NavIcon } from '../ui/NavIcon';
import { publicHref } from '../i18n/preferences';
import { useSession } from './SessionProvider';
import { loginHref } from './return-to';

/** Prototype `.iconbtn` shared by header actions. */
export const iconButton =
  'relative grid size-11 place-items-center rounded-pill text-text hover:bg-surface-2 focus-visible:ring-focus';

/** Header icon buttons (prototype `.iconbtn`); Account is in the bottom tabs
 * on mobile, so its header button shows from 900px. */
export function AccountNavigation({
  cartCount,
}: {
  /** Feature-owned cart count/badge slot (the shell never reads the cart). */
  cartCount?: ReactNode;
}) {
  const { state } = useSession();
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const t = useTranslations('auth.login');
  const reels = useTranslations('reels.feed');
  const saved = useTranslations('engagement.saved');
  const cart = useTranslations('cart.nav');
  const search = useTranslations('search.screen');
  const label = t(state.kind === 'ready' ? 'account' : 'login');
  return (
    <nav aria-label={t('account')} className="flex items-center gap-1">
      <Link
        className={iconButton}
        href={publicHref('/search', locale)}
        aria-label={search('placeholder')}
        title={search('title')}
      >
        <NavIcon name="search" />
      </Link>
      <Link
        className={iconButton}
        href={publicHref('/videos', locale)}
        aria-label={reels('title')}
        title={reels('title')}
      >
        <NavIcon name="play" />
      </Link>
      <Link
        className={iconButton}
        href="/saved"
        aria-label={saved('title')}
        title={saved('title')}
      >
        <NavIcon name="bookmark" />
      </Link>
      {cartCount !== undefined && (
        <Link className={iconButton} href="/cart" title={cart('label')}>
          <NavIcon name="cart" />
          {cartCount}
        </Link>
      )}
      <Link
        className={`${iconButton} hidden desktop:grid`}
        href={
          state.kind === 'ready' ? '/account' : loginHref(locale, '/account')
        }
        aria-label={label}
        title={label}
      >
        <NavIcon name="user" />
      </Link>
    </nav>
  );
}
