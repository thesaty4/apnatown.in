import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { SearchResults, type SearchPageParams } from '../../../../features/search/SearchResults';

// Result URLs are shareable but not indexable landing pages (F-SR, SEO).
export async function generateMetadata() {
  const t = await getTranslations('search.screen');
  return { title: t('title'), robots: { index: false, follow: true } };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchPageParams>;
}) {
  const t = await getTranslations('search.screen');
  return (
    <div className="grid min-w-0 gap-stack-gap">
      {/* js4 V.search opens on the search bar; the page title stays for AT. */}
      <h1 className="sr-only">{t('title')}</h1>
      <Suspense fallback={<Skeleton label={t('loading')} />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
