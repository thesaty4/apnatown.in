'use client';

import { useEffect, useRef, useState } from 'react';
import {
  HydrationBoundary,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type DehydratedState,
} from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { CatalogSlugSchema, type Category } from '@apnatown/shared/catalog';
import {
  SEARCH_TABS,
  type ExploreFacet,
  type SearchFilters,
  type SearchResponse,
  type SearchTab,
} from '@apnatown/shared/search';
import { Button } from '@apnatown/ui/primitives/Button';
import { Chip } from '@apnatown/ui/primitives/Chip';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { EmptyState, ErrorState } from '@apnatown/ui/feedback/StateViews';
import { failureCode } from '../../shared/api/result';
import { useSession } from '../../shared/auth/SessionProvider';
import { useOnline } from '../../shared/hooks/use-online';
import { publicHref } from '../../shared/i18n/preferences';
import { NavIcon } from '../../shared/ui/NavIcon';
import { categoriesOptions, catalogName, categoryPath } from '../catalog';
import { DiscoveryTabs, ExploreFilterPanel, useDiscoveryScroll, type FilterPatch } from '../explore';
import { LocationPicker, type PickerStep } from '../geo';
import { searchOptions } from './queries';
import { SearchBox } from './SearchBox';
import { SearchCards } from './SearchCards';
import { SearchFailure, SearchNotice, SearchOffline } from './SearchFeedback';
import { SearchFilters as SearchControls, searchFilterCount } from './SearchFilters';
import { SearchGroups } from './SearchGroups';
import { PopularSearches, RecentSearches } from './SearchTerms';
import { useRecentSearches } from './use-recent-searches';
import { useSearchLocation } from './use-search-location';
import {
  changeSearchTab,
  listingFilters,
  listingTab,
  patchSearch,
  readSearchFilters,
  readSearchTarget,
  resetSearchFilters,
  searchParams,
} from './url-state';

const deniedCodes = ['COMMON_FORBIDDEN', 'ACCOUNT_UNAVAILABLE', 'SESSION_EXPIRED'];
const tabId = (tab: SearchTab) => `search-tab-${tab}`;

/**
 * S-CUST-03 Search (js4 `V.search`, js23). Search owns its URL/query state
 * (BR-15): it reuses Explore presentation only, never Explore keys or URLs.
 */
export function SearchScreen({ initial }: { initial?: DehydratedState | undefined }) {
  const cache = useQueryClient();
  const params = useSearchParams();
  const filters = readSearchFilters(new URLSearchParams(params));
  if (!filters) return <InvalidSearch />;
  // Never let a server snapshot overwrite fresher client data on Back/Forward.
  const hydration = initial && {
    ...initial,
    queries: initial.queries.filter((query) => !cache.getQueryData(query.queryKey)),
  };
  return (
    <HydrationBoundary state={hydration}>
      <SearchContent filters={filters} />
    </HydrationBoundary>
  );
}

function InvalidSearch() {
  const t = useTranslations('search.screen');
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const q = params.get('q')?.trim().slice(0, 200);
  return (
    <ErrorState
      headingLevel="h2"
      title={t('invalidFilters')}
      message={t('invalidFiltersMessage')}
      action={
        <Button onClick={() => router.push(
          q ? `${pathname}?${new URLSearchParams({ q })}` : pathname, { scroll: false },
        )}>
          {t('clearFilters')}
        </Button>
      }
    />
  );
}

function SearchContent({ filters }: { filters: SearchFilters }) {
  const t = useTranslations('search.screen');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const { api } = useSession();
  const cache = useQueryClient();
  const online = useOnline();
  const recent = useRecentSearches();
  const { effective, position, revision } = useSearchLocation(filters);
  const hasQuery = filters.q.length > 0;
  const tab = filters.tab;
  const listing = listingTab(tab);
  const options = searchOptions(api, effective, locale, revision, position);
  const results = useInfiniteQuery({
    ...options,
    // Empty q is answered by recent/popular, never by a zero-count request.
    enabled: hasQuery,
    // Same query, other tab/filter: keep the tab counts steady while the
    // body shows its skeleton. A new query never shows the old counts.
    placeholderData: (previous, query) =>
      query && new URLSearchParams(String(query.queryKey[3])).get('q') === effective.q ? previous : undefined,
  });
  const categories = useQuery({ ...categoriesOptions(api), enabled: hasQuery });
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationStep, setLocationStep] = useState<PickerStep>({ kind: 'choose' });
  const focusTab = useRef(false);
  const panel = useRef<HTMLDivElement>(null);
  const first = hasQuery ? results.data?.pages[0] : undefined;
  const loading = hasQuery && (results.isPending || results.isPlaceholderData);
  // Facets/items always belong to the visible tab, never to a placeholder.
  const current = loading ? undefined : first;
  const items = current ? results.data?.pages.flatMap((page) => page.page.items) ?? [] : [];
  const code = results.isError ? failureCode(results.error) : '';
  const filterCount = searchFilterCount(filters);
  useDiscoveryScroll(!hasQuery || !results.isPending, 'search');

  // Chip/See all actions replace the control that had focus; land on the
  // selected tab so keyboard and screen-reader users keep their place.
  useEffect(() => {
    if (!focusTab.current || !hasQuery) return;
    focusTab.current = false;
    document.getElementById(tabId(tab))?.focus();
  }, [hasQuery, tab, filters.q]);

  /** History entry per committed search; identical URLs are not duplicated. */
  const navigate = (next: URLSearchParams) => {
    if (!next.get('q')) next.delete('q');
    next.sort();
    const now = new URLSearchParams(params);
    now.sort();
    if (next.toString() === now.toString()) return false;
    const query = next.toString();
    window.history.pushState(null, '', query ? `${pathname}?${query}` : pathname);
    return true;
  };
  // Location scope comes from this URL (shared link) or the active Geo state,
  // never from a server target that echoed the effective location.
  const ownLocation = (target: SearchFilters): SearchFilters => {
    const { cityId: _city, areaId: _area, ...rest } = target;
    return {
      ...rest,
      ...(filters.cityId && { cityId: filters.cityId }),
      ...(filters.areaId && { areaId: filters.areaId }),
    };
  };
  const submit = (term: string) => {
    if (term) recent.remember(term);
    if (!navigate(searchParams({ ...filters, q: term })) && term) void results.refetch();
  };
  const selectTerm = (term: string) => {
    recent.remember(term);
    const next = changeSearchTab(filters, 'all');
    next.set('q', term);
    focusTab.current = navigate(next);
  };
  const selectTarget = (target: string, label: string) => {
    const parsed = readSearchTarget(target);
    if (!parsed) return;
    recent.remember(parsed.q || label);
    navigate(searchParams(ownLocation(parsed)));
  };
  const seeAll = (target: string, group: SearchTab) => {
    const parsed = readSearchTarget(target);
    navigate(parsed ? searchParams(ownLocation(parsed)) : changeSearchTab(filters, group));
    document.getElementById(tabId(group))?.focus();
  };
  const changeTab = (next: SearchTab) => navigate(changeSearchTab(filters, next));
  const showAll = () => {
    changeTab('all');
    document.getElementById(tabId('all'))?.focus();
  };
  const patch = (changes: FilterPatch) => navigate(patchSearch(filters, changes));
  const reset = () => navigate(resetSearchFilters(filters));
  const chooseLocation = () => {
    setLocationStep({ kind: 'choose' });
    setLocationOpen(true);
  };
  const retryPartial = () => {
    if (code === 'COMMON_VALIDATION_FAILED')
      // An expired/rebound cursor: restart this key from its first page.
      void cache.resetQueries({ queryKey: options.queryKey, exact: true });
    else if (results.isFetchNextPageError) void results.fetchNextPage();
    else void results.refetch();
  };
  const loadMore = async () => {
    const page = await results.fetchNextPage();
    // The button unmounts after the last page; keep focus near the results.
    if (!page.hasNextPage) panel.current?.focus({ preventScroll: true });
  };
  const openCategory = (slug: string) => router.push(publicHref(categoryPath(slug), locale));

  let announcement = '';
  if (results.isFetchingNextPage) announcement = t('loadingMore');
  else if (loading && online) announcement = t('loading');
  else if (current)
    announcement = items.length > current.page.items.length
      ? t('shownOf', { shown: items.length, count: current.counts[tab] })
      : t('resultCount', { count: current.counts[tab], query: current.query });

  let body;
  if (!hasQuery) body = null;
  else if (loading)
    body = online
      ? <Skeleton label={t('loading')} />
      : <SearchOffline busy={results.isFetching} retry={() => void results.refetch()} />;
  else if (deniedCodes.includes(code) || !current)
    body = <SearchFailure error={results.error} busy={results.isFetching}
      retry={() => void results.refetch()} chooseLocation={chooseLocation}
      reset={filterCount > 0 ? reset : undefined} />;
  else if (current.counts.all === 0 || (tab === 'all' && !current.groups.some((group) => group.items.length)))
    body = <NoResults result={current} categories={categories.data?.items ?? []}
      filtered={filterCount > 0} reset={reset} selectTerm={selectTerm} openCategory={openCategory} />;
  else if (tab === 'all')
    body = <>
      <MappingExplanation result={current} />
      <SearchGroups result={current} categories={categories.data?.items ?? []} onSeeAll={seeAll} />
    </>;
  else if (items.length === 0)
    body = <>
      <EmptyState headingLevel="h2" icon="🔎"
        title={t(filterCount > 0 ? 'emptyFiltered' : 'emptyTab')}
        message={t(filterCount > 0 ? 'emptyFilteredMessage' : 'emptyTabMessage')}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={showAll}>{t('showAll')}</Button>
            {filterCount > 0 && <Button variant="outline" onClick={reset}>{t('clearFilters')}</Button>}
          </div>
        } />
      <RelatedCategories facets={current.relatedCategories} categories={categories.data?.items ?? []}
        openCategory={openCategory} />
    </>;
  else
    body = <>
      <SearchCards tab={tab} items={items} categories={categories.data?.items ?? []} />
      {results.hasNextPage && !results.isFetchNextPageError && (
        <Button variant="outline" className="justify-self-center"
          loading={results.isFetchingNextPage} disabled={results.isFetching}
          onClick={() => void loadMore()}>
          {t('loadMore')}
        </Button>
      )}
    </>;

  return (
    <div className="grid min-w-0 gap-stack-gap">
      <SearchBox query={filters.q} cityId={effective.cityId} areaId={effective.areaId}
        autoFocus={!hasQuery} onSubmit={submit} onTarget={selectTarget} />
      <p role="status" className="sr-only">{announcement}</p>
      {!hasQuery ? (
        <div className="grid gap-stack-gap">
          <RecentSearches terms={recent.terms} temporary={recent.temporary}
            onSelect={selectTerm} onClear={recent.clear} />
          <PopularSearches onSelect={selectTerm} />
        </div>
      ) : (
        <div className="grid min-w-0">
          <DiscoveryTabs tab={tab} id="search" label={t('tabs')} countTone="neutral"
            items={SEARCH_TABS.map((value) => ({
              value, label: t(`tab.${value}`), count: first?.counts[value],
            }))}
            onChange={changeTab} />
          <div
            ref={panel}
            id="search-panel"
            role="tabpanel"
            tabIndex={0}
            aria-labelledby={tabId(tab)}
            className={`grid min-w-0 gap-4 focus-visible:ring-focus ${listing ? 'desktop:grid-cols-[var(--at-explore-sidebar)_minmax(0,1fr)] desktop:items-start' : ''}`}
          >
            {listing && (
              <aside
                aria-label={t('filters')}
                className="hidden rounded-lg border border-border bg-surface p-4 shadow-1 desktop:sticky desktop:top-explore-sidebar-top desktop:block desktop:max-h-explore-sidebar-max desktop:overflow-auto"
              >
                <ExploreFilterPanel filters={listingFilters(filters)!} facets={current?.facets}
                  showSort={false} onChange={patch} onReset={reset} />
              </aside>
            )}
            <section aria-busy={results.isFetching}
              className="grid min-w-0 content-start gap-stack-gap">
              <SearchControls filters={filters} result={current} navigate={navigate} />
              <div role="status">
                {!online && current && (
                  <div className="rounded-md border border-warning bg-warning-soft p-3">
                    <SearchNotice>{t('offlineStale')}</SearchNotice>
                  </div>
                )}
              </div>
              {body}
              {results.isError && current && !deniedCodes.includes(code) && (
                <div className="rounded-md border border-error bg-error-soft p-3">
                  <SearchNotice role="alert" tone="error" action={
                    <Button variant="text" size="card" loading={results.isFetching}
                      disabled={results.isFetching || !online} onClick={retryPartial}>
                      {t('retry')}
                    </Button>
                  }>
                    {t(results.isFetchNextPageError ? 'loadMoreError' : 'refreshError')}
                  </SearchNotice>
                </div>
              )}
            </section>
          </div>
        </div>
      )}
      <LocationPicker open={locationOpen} step={locationStep} onStep={setLocationStep}
        onClose={() => setLocationOpen(false)}
        onResolved={() => {
          // The picker stored the new Geo selection; a pinned link location
          // would otherwise keep overriding it.
          navigate(patchSearch(filters, { cityId: null, areaId: null }));
          setLocationOpen(false);
        }} />
    </div>
  );
}

/** js23 All tab only: catalog-configured mapping terms, e.g. “ac” → AC services. */
function MappingExplanation({ result }: { result: SearchResponse }) {
  const t = useTranslations('search.screen');
  const format = useFormatter();
  const terms = result.mappingExplanation?.terms ?? [];
  if (terms.length === 0) return null;
  return (
    <p className="m-0 flex items-start gap-1.5 text-small text-text-2 [overflow-wrap:anywhere]">
      <NavIcon name="info" className="mt-0.5 size-4 shrink-0 text-info" />
      <span>{t('mappingExplanation', { terms: format.list(terms, { type: 'unit' }) })}</span>
    </p>
  );
}

function NoResults({
  result, categories, filtered, reset, selectTerm, openCategory,
}: {
  result: SearchResponse;
  categories: Category[];
  filtered: boolean;
  reset: () => void;
  selectTerm: (term: string) => void;
  openCategory: (slug: string) => void;
}) {
  const t = useTranslations('search.screen');
  return (
    <div className="grid gap-stack-gap">
      <EmptyState headingLevel="h2" icon="🔎" title={t('noResults')}
        message={t('noResultsMessage')}
        action={filtered ? <Button variant="outline" onClick={reset}>{t('clearFilters')}</Button> : null} />
      <RelatedCategories facets={result.relatedCategories} categories={categories}
        openCategory={openCategory} />
      <PopularSearches onSelect={selectTerm} limit={4} headingLevel="h3" centered />
    </div>
  );
}

/** js23 no-result next action: related categories open their category page. */
function RelatedCategories({
  facets, categories, openCategory,
}: {
  facets: ExploreFacet[];
  categories: Category[];
  openCategory: (slug: string) => void;
}) {
  const t = useTranslations('search.screen');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const related = facets.filter((facet) => CatalogSlugSchema.safeParse(facet.value).success);
  if (related.length === 0) return null;
  return (
    <section aria-labelledby="search-related" className="grid gap-2 text-center">
      <h3 id="search-related" className="m-0 text-field-label font-semibold">{t('relatedCategories')}</h3>
      <ul className="m-0 flex list-none flex-wrap justify-center gap-2 p-0" aria-labelledby="search-related">
        {related.map((facet) => {
          const category = categories.find((item) =>
            item.id === facet.categoryId || item.slug === facet.value);
          const name = category ? catalogName(category, locale)
            : locale === 'hi' && facet.labelHi ? facet.labelHi : facet.labelEn;
          return (
            <li key={facet.id} className="max-w-full">
              <Chip label={name}
                icon={category?.icon || <NavIcon name="list" className="size-4" />}
                onClick={() => openCategory(facet.value)} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
