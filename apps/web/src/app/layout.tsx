import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { getLocale, getTranslations } from 'next-intl/server';
import { SkipLink } from '@apnatown/ui/navigation/SkipLink';
import { fontVariables } from '../shared/i18n/fonts';
import { isLocale, parseTheme, themeCookie } from '../shared/i18n/preferences';
import { getWebEnvironment } from '../shared/config/server';
import { Preferences } from '../shared/ui/Preferences';
import { Providers } from './providers';
import en from '../shared/i18n/messages/bootstrap.en.json';
import hi from '../shared/i18n/messages/bootstrap.hi.json';
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
  // Only bootstrap messages cross the RSC boundary, not all 927 source strings.
  const bootstrapMessages = locale === 'hi' ? hi : en;
  return (
    <html lang={locale} data-theme={theme} className={fontVariables}>
      <body>
        <Providers locale={locale} messages={bootstrapMessages}>
          <SkipLink label={t('navigation.skipToContent')} targetId="main" />
          <div className="mx-auto max-w-page px-page-gutter">
            <header className="flex min-h-nav-h flex-wrap items-center justify-between gap-4 border-b border-border py-2">
              <span className="font-display font-bold text-primary">
                {t('app.welcome')}
              </span>
              <Preferences initialTheme={theme} />
            </header>
            <main
              id="main"
              tabIndex={-1}
              className="min-h-[60vh] py-page-gutter"
            >
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
