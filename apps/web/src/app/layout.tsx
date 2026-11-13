import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { getLocale, getTranslations } from 'next-intl/server';
import { SkipLink } from '@apnatown/ui/navigation/SkipLink';
import { fontVariables } from '../shared/i18n/fonts';
import {
  isLocale,
  parseTheme,
  publicHref,
  themeCookie,
} from '../shared/i18n/preferences';
import { getWebEnvironment } from '../shared/config/server';
import Link from 'next/link';
import { Preferences } from '../shared/ui/Preferences';
import { LanguageSwitch } from '../shared/ui/LanguageSwitch';
import { BrandLogo } from '../shared/ui/BrandLogo';
import { CustomerMenu, CustomerTabBar } from '../shared/ui/CustomerNav';
import { Providers } from './providers';
import en from '../shared/i18n/messages/en.json';
import hi from '../shared/i18n/messages/hi.json';
import { readSession } from '../shared/auth/server';
import { AccountNavigation } from '../shared/auth/AccountNavigation';
import { hydrateResource } from '../shared/api/hydration';
import { queryKeys } from '../shared/api/query-keys';
import { SiteFooter } from '../features/support/SiteFooter';
import { DemoSwitcher } from '../features/auth/demo/DemoControls';
import { CartCount } from '../features/cart';
import { CustomerBell } from '../features/notifications/Bells';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common.app');
  return {
    title: t('welcome'),
    metadataBase: new URL(getWebEnvironment().APP_BASE_URL),
    // C00 has no published Home/content pages.
    robots: { index: false, follow: false },
  };
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const requested = await getLocale();
  const locale = isLocale(requested) ? requested : 'en';
  const theme = parseTheme((await cookies()).get(themeCookie)?.value);
  const t = await getTranslations('common');
  // Only this slice's messages cross the RSC boundary, not the full prototype catalogue.
  const catalogue = locale === 'hi' ? hi : en;
  const { copy: _unused, ...common } = catalogue.common;
  const messages = {
    common,
    auth: catalogue.auth,
    account: catalogue.account,
    consent: catalogue.consent,
    privacy: catalogue.privacy,
    admin: catalogue.admin,
    superAdmin: catalogue.superAdmin,
    geo: catalogue.geo,
    catalog: catalogue.catalog,
    reels: catalogue.reels,
    engagement: catalogue.engagement,
    explore: catalogue.explore,
    business: catalogue.business,
    service: catalogue.service,
    products: catalogue.products,
    media: catalogue.media,
    gallery: catalogue.gallery,
    search: catalogue.search,
    help: catalogue.help,
    system: catalogue.system,
    notifications: catalogue.notifications,
    cart: catalogue.cart,
  };
  return (
    <html lang={locale} data-theme={theme} className={fontVariables}>
      <body>
        <Providers
          locale={locale}
          messages={messages}
          session={await hydrateResource(
            queryKeys.session,
            await readSession(),
          )}
        >
          <SkipLink label={t('navigation.skipToContent')} targetId="main" />
          <header className="sticky top-sat z-60 border-b border-border bg-surface shadow-1">
            <div className="mx-auto flex min-h-nav-h max-w-page-padded flex-wrap items-center gap-x-2.5 gap-y-2 px-page-gutter py-1 desktop:flex-nowrap">
              <Link
                href={publicHref('/', locale)}
                aria-label={t('navigation.logo')}
                className="rounded-sm focus-visible:ring-focus"
              >
                <BrandLogo />
              </Link>
              <CustomerMenu />
              <span className="min-w-0 flex-1" />
              <LanguageSwitch short />
              {getWebEnvironment().DEMO_LOGIN_ENABLED && <DemoSwitcher />}
              <AccountNavigation cartCount={<CartCount />} />
              <CustomerBell />
              <Preferences initialTheme={theme} />
            </div>
          </header>
          <div className="mx-auto max-w-page-padded px-page-gutter">
            <main
              id="main"
              tabIndex={-1}
              className="min-h-[60vh] py-page-gutter"
            >
              {children}
            </main>
          </div>
          <SiteFooter />
          <CustomerTabBar cartCount={<CartCount tab />} />
        </Providers>
      </body>
    </html>
  );
}
