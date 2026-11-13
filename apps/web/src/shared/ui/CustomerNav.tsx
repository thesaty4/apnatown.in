'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { isDashboardPath, publicHref } from '../i18n/preferences';
import { useSession } from '../auth/SessionProvider';
import { loginHref } from '../auth/return-to';
import { NavIcon, type NavIconName } from './NavIcon';

function useCustomerPath() {
  const path = usePathname().replace(/^\/(?:hi|en)(?=\/|$)/, '') || '/';
  return { path, customer: !isDashboardPath(path) };
}

/** Desktop customer menu (prototype `.deskmenu`); only live routes. */
export function CustomerMenu() {
  const t = useTranslations('common.navigation');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const { path, customer } = useCustomerPath();
  if (!customer) return null;
  const items = [
    ['home', t('home'), publicHref('/', locale), path === '/'],
    [
      'explore',
      t('explore'),
      publicHref('/explore', locale),
      path.startsWith('/explore'),
    ],
    [
      'services',
      t('services'),
      publicHref('/services', locale),
      path.startsWith('/services'),
    ],
    [
      'offers',
      t('offers'),
      publicHref('/offers', locale),
      path.startsWith('/offers'),
    ],
  ] as const;
  return (
    <nav aria-label={t('main')} className="ms-2 hidden gap-1 desktop:flex">
      {items.map(([key, label, href, on]) => (
        <Link
          key={key}
          href={href}
          aria-current={on ? 'page' : undefined}
          className={`rounded-sm px-3 py-2.5 font-medium hover:bg-primary-soft hover:text-primary-ink focus-visible:ring-focus ${on ? 'bg-primary-soft text-primary-ink' : 'text-text'}`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

type Tab = [NavIconName, string, string, boolean, ReactNode?];

/** Mobile bottom tabs (prototype `.bottom.cust`), hidden from 900px and on
 * dashboards. The spacer keeps page content clear of the fixed bar. */
export function CustomerTabBar({
  cartCount,
}: {
  /** Feature-owned cart count/badge slot; adds the prototype Cart tab. */
  cartCount?: ReactNode;
}) {
  const t = useTranslations('common.navigation');
  const cart = useTranslations('cart.nav');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const { state } = useSession();
  const { path, customer } = useCustomerPath();
  if (!customer) return null;
  const items: readonly Tab[] = [
    ['home', t('home'), publicHref('/', locale), path === '/'],
    [
      'map',
      t('explore'),
      publicHref('/explore', locale),
      path.startsWith('/explore'),
    ],
    [
      'tag',
      t('offers'),
      publicHref('/offers', locale),
      path.startsWith('/offers'),
    ],
    ...(cartCount === undefined
      ? []
      : [
          [
            'cart',
            cart('label'),
            '/cart',
            path === '/cart',
            cartCount,
          ] satisfies Tab,
        ]),
    [
      'user',
      t('account'),
      state.kind === 'ready' ? '/account' : loginHref(locale, '/account'),
      /^\/(?:account|saved)(?:\/|$)/.test(path),
    ],
  ];
  return (
    <>
      <div
        aria-hidden="true"
        className="h-[calc(var(--spacing-tab-h)+var(--spacing-sab))] desktop:hidden"
      />
      <nav
        aria-label={t('main')}
        className="fixed inset-x-0 bottom-0 z-60 flex border-t border-border bg-surface pb-sab shadow-2 desktop:hidden"
      >
        {items.map(([icon, label, href, on, badge]) => (
          <Link
            key={icon}
            href={href}
            aria-current={on ? 'page' : undefined}
            className={`relative flex min-h-tab-h flex-1 flex-col items-center justify-center gap-0.5 text-caption font-medium focus-visible:ring-focus ${on ? 'text-primary before:absolute before:inset-x-[30%] before:top-0 before:h-0.75 before:rounded-b-xs before:bg-primary' : 'text-muted'}`}
          >
            <NavIcon name={icon} />
            {label}
            {badge}
          </Link>
        ))}
      </nav>
    </>
  );
}
