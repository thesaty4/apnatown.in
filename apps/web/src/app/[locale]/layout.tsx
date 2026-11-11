import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { isLocale } from '../../shared/i18n/preferences';

export default async function LocaleLayout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}) {
  if (!isLocale((await params).locale)) notFound();
  return children;
}
