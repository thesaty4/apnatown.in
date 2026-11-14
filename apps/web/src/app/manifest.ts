import type { MetadataRoute } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { PWA_BACKGROUND_COLOR, PWA_THEME_COLOR } from '../shared/config/pwa';

/**
 * F-X-015: installable app metadata. The service worker (`/sw.js`) caches only
 * the static shell and offline screen; API, KYC, session and payment data are
 * never part of the manifest or the worker cache.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations('common.app');
  const locale = await getLocale();
  return {
    name: 'ApnaTown.in',
    short_name: 'ApnaTown',
    description: t('description'),
    lang: locale === 'hi' ? 'hi-IN' : 'en-IN',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
