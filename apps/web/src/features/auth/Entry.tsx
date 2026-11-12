import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { Card } from '@apnatown/ui/cards/Card';
import { buttonClassName } from '@apnatown/ui/primitives/Button';
import { loginHref } from '../../shared/auth/return-to';

/** Public entry only. Discovery, location onboarding and legal content have other owners. */
export async function Entry() {
  const locale = (await getLocale()) === 'hi' ? 'hi' : 'en';
  const t = await getTranslations('auth.entry');
  return (
    <Card padded className="mx-auto grid max-w-state-copy gap-4 text-center">
      <h1 className="text-h1">{t('title')}</h1>
      <p className="text-text-2">{t('intro')}</p>
      <Link className={buttonClassName} href={loginHref(locale)}>
        {t('login')}
      </Link>
      <Link
        className="inline-flex min-h-touch items-center justify-center underline"
        href="/account"
      >
        {t('guest')}
      </Link>
      <p className="text-small text-muted">{t('discoveryUnavailable')}</p>
    </Card>
  );
}
