import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { ExploreResults, type ExploreSearchParams } from '../../../../features/explore/ExploreResults';

export async function generateMetadata() {
  const t = await getTranslations('explore.screen');
  return { title: t('title'), description: t('description'), robots: { index: false, follow: true } };
}

export default async function ExplorePage({ searchParams }: { searchParams: Promise<ExploreSearchParams> }) {
  const t = await getTranslations('explore.screen');
  return <div className="grid min-w-0 gap-stack-gap">
    <h1 className="text-h1">{t('title')}</h1>
    <Suspense fallback={<Skeleton label={t('loading')} />}><ExploreResults searchParams={searchParams} /></Suspense>
  </div>;
}
