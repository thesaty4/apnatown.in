import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { isLocale, localeCookie } from './preferences';
import en from './messages/en.json';
import hi from './messages/hi.json';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested =
    (await headers()).get('x-apnatown-private') === '1'
      ? (await cookies()).get(localeCookie)?.value
      : await requestLocale;
  const locale = isLocale(requested) ? requested : 'en';
  return {
    locale,
    messages: locale === 'hi' ? hi : en,
    timeZone: 'Asia/Kolkata',
  };
});
