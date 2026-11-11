import { getRequestConfig } from 'next-intl/server';
import { isLocale } from './preferences';
import en from './messages/en.json';
import hi from './messages/hi.json';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isLocale(requested) ? requested : 'en';
  return {
    locale,
    messages: locale === 'hi' ? hi : en,
    timeZone: 'Asia/Kolkata',
  };
});
