import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { ExploreResults, type ExploreSearchParams } from '../../../../features/explore/ExploreResults';

export async function generateMetadata() {
  const t = await getTranslations('explore.screen');
  return { title: t('search'), robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<ExploreSearchParams> }) {
  const t = await getTranslations('explore.screen');
  return <div className="grid min-w-0 gap-stack-gap">
    <h1 className="text-h1">{t('search')}</h1>
    <Suspense fallback={<Skeleton label={t('loading')} />}>
      <ExploreResults screen="search" path="/search" searchParams={searchParams} />
    </Suspense>
  </div>;
}
