import { defineRouting } from 'next-intl/routing';
import { locales } from './preferences';

export const routing = defineRouting({
  locales,
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  localeDetection: false,
  localeCookie: false,
});
