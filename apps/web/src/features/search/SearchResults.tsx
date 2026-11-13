import { redirect } from 'next/navigation';
import type { QueryKey } from '@tanstack/react-query';
import { getPopular, getSearch } from './api';
import { popularOptions, searchOptions } from './queries';
import { SearchScreen } from './SearchScreen';
import { readSearchFilters } from './url-state';
import { hydrateResource } from '../../shared/api/hydration';
import { resource, type Resource } from '../../shared/api/result';
import { createPublicServerApi } from '../../shared/api/server';
import { maintenanceHref } from '../../shared/api/maintenance';
import { currentLocale } from '../support/metadata';

export type SearchPageParams = Record<string, string | string[] | undefined>;

const timeout = () => AbortSignal.timeout(10_000);

/**
 * S-CUST-03 server shell: `/search?q=` results are URL-derived, so they are
 * read once on the server and hydrated under the client's exact key. Server
 * reads never know the browser-local Geo state (revision 0, no position).
 */
export async function SearchResults({ searchParams }: { searchParams: Promise<SearchPageParams> }) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined) params.set(key, value);
  }
  const locale = await currentLocale();
  const filters = readSearchFilters(params);
  if (!filters) return <SearchScreen />;
  const hydrate = async <T,>(key: QueryKey, result: Resource<T>) => {
    if (result.kind === 'error' && result.code === 'MAINTENANCE')
      redirect(maintenanceHref(`/search?${params}`, locale === 'hi'));
    // Errors stay client-side: Geo may supply a missing location and retry.
    return result.kind === 'ready' ? hydrateResource(key, result) : undefined;
  };
  let initial;
  if (filters.q) {
    const api = createPublicServerApi();
    initial = await hydrate(searchOptions(api, filters, locale).queryKey, await resource(async () => ({
      pages: [await getSearch(api, filters, null, timeout(), null)],
      pageParams: [null],
    })));
  } else {
    // An empty query is answered by recent (browser-local) and popular terms.
    const api = createPublicServerApi({ revalidate: 300, tags: ['search-popular'] });
    initial = await hydrate(popularOptions(api, locale).queryKey,
      await resource(() => getPopular(api, timeout())));
  }
  return <SearchScreen initial={initial} />;
}
