import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getTranslations('account.menu');
  return (
    <div className="mx-auto grid max-w-state-copy gap-4">
      <Link
        href="/account"
        className="inline-flex min-h-touch items-center underline"
      >
        {t('title')}
      </Link>
      {children}
    </div>
  );
}
