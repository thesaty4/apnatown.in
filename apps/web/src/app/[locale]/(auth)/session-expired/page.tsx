import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { NoPermissionState } from '@apnatown/ui/feedback/StateViews';
import { buttonClassName } from '@apnatown/ui/primitives/Button';
import { loginHref, safeReturnTo } from '../../../../shared/auth/return-to';

export const metadata: Metadata = { robots: { index: false, follow: false } };
export default async function SessionExpiredPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = (await getLocale()) === 'hi' ? 'hi' : 'en';
  const t = await getTranslations('auth.feedback');
  const returnTo = safeReturnTo((await searchParams).returnTo);
  return (
    <NoPermissionState
      title={t('expiredTitle')}
      message={t('expired')}
      action={
        <Link className={buttonClassName} href={loginHref(locale, returnTo)}>
          {t('login')}
        </Link>
      }
    />
  );
}
