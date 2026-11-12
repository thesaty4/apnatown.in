import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { ExploreScreen } from '../../../../features/explore/ExploreScreen';
import { getExplore } from '../../../../features/explore/api';
import { readFilters } from '../../../../features/explore/url-state';
import { hydrateResource } from '../../../../shared/api/hydration';
import { queryKeys } from '../../../../shared/api/query-keys';
import { resource } from '../../../../shared/api/result';
import { createPublicServerApi } from '../../../../shared/api/server';
import { maintenanceHref } from '../../../../shared/api/maintenance';
import { currentLocale } from '../../../../features/support/metadata';

export async function generateMetadata() {
  const t = await getTranslations('explore.screen');
  return {
    title: t('title'),
    description: t('description'),
    robots: { index: false, follow: true },
  };
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations('explore.screen');
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined) params.set(key, value);
  }
  const filters = readFilters(params);
  const result = filters
    ? await resource(async () => ({
        pages: [await getExplore(createPublicServerApi(), filters)],
        pageParams: [null],
      }))
    : undefined;
  if (result?.kind === 'error' && result.code === 'MAINTENANCE')
    redirect(
      maintenanceHref(`/explore?${params}`, (await currentLocale()) === 'hi'),
    );
  const initial =
    filters && result
      ? await hydrateResource(queryKeys.explore(filters), result)
      : undefined;
  return (
    <div className="grid min-w-0 gap-stack-gap">
      <h1 className="text-h1">{t('title')}</h1>
      <Suspense fallback={<Skeleton label={t('loading')} />}>
        <ExploreScreen initial={initial} />
      </Suspense>
    </div>
  );
}
