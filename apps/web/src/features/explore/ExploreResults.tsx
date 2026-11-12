import { redirect } from 'next/navigation';
import type { ExploreFilters } from '@apnatown/shared/search';
import { ExploreScreen } from './ExploreScreen';
import { getExplore } from './api';
import { readFilters } from './url-state';
import { hydrateResource } from '../../shared/api/hydration';
import { queryKeys } from '../../shared/api/query-keys';
import { resource } from '../../shared/api/result';
import { createPublicServerApi } from '../../shared/api/server';
import { maintenanceHref } from '../../shared/api/maintenance';
import { getWebEnvironment } from '../../shared/config/server';
import { mapConfiguration } from '../../shared/config/maps';
import { currentLocale } from '../support/metadata';

export type ExploreSearchParams = Record<string, string | string[] | undefined>;

export async function ExploreResults({
  searchParams,
  defaults = {},
  screen = 'explore',
  path = '/explore',
}: {
  searchParams: Promise<ExploreSearchParams>;
  defaults?: Partial<ExploreFilters>;
  screen?: 'explore' | 'search' | 'category';
  path?: string;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined) params.set(key, value);
  }
  for (const [key, value] of Object.entries(defaults))
    if (!params.has(key) && value !== undefined) params.set(key, String(value));
  const filters = readFilters(params);
  const result = filters
    ? await resource(async () => ({
        pages: [await getExplore(createPublicServerApi(), filters)],
        pageParams: [null],
      }))
    : undefined;
  if (result?.kind === 'error' && result.code === 'MAINTENANCE')
    redirect(
      maintenanceHref(`${path}?${params}`, (await currentLocale()) === 'hi'),
    );
  const initial =
    filters && result
      ? await hydrateResource(queryKeys.explore(filters, 0, screen), result)
      : undefined;
  return (
    <ExploreScreen
      initial={initial}
      defaults={defaults}
      screen={screen}
      mapConfig={mapConfiguration(getWebEnvironment())}
    />
  );
}
