import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import type { LegalSlug } from '@apnatown/shared/settings';
import { LegalPage } from './LegalPage';
import { currentLocale, noindex, publicPageMetadata } from './metadata';
import { LEGAL_ROUTES, readLegalPage } from './server';

export async function legalMetadata(slug: LegalSlug): Promise<Metadata> {
  const page = await readLegalPage(slug, await currentLocale());
  return page ? publicPageMetadata(LEGAL_ROUTES[slug], page.title) : noindex;
}

/** Published page or 404 (`LEGAL_PAGE_NOT_FOUND`); no placeholder legal copy. */
export async function LegalRoute({
  slug,
  children,
}: {
  slug: LegalSlug;
  children?: ReactNode;
}) {
  const page = await readLegalPage(slug, await currentLocale());
  if (!page) notFound();
  return <LegalPage page={page}>{children}</LegalPage>;
}
