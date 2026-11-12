import 'server-only';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { publicHref, type Locale } from '../../shared/i18n/preferences';

export async function currentLocale(): Promise<Locale> {
  return (await getLocale()) === 'hi' ? 'hi' : 'en';
}

/** Indexable public page: canonical per locale + hreflang alternates. */
export async function publicPageMetadata(
  path: string,
  title: string,
): Promise<Metadata> {
  const locale = await currentLocale();
  return {
    title,
    alternates: {
      canonical: publicHref(path, locale),
      languages: {
        en: publicHref(path, 'en'),
        hi: publicHref(path, 'hi'),
        'x-default': publicHref(path, 'en'),
      },
    },
    robots: { index: true, follow: true },
  };
}

export const noindex: Metadata = { robots: { index: false, follow: false } };
