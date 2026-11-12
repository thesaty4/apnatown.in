'use client';

import { HydrationBoundary, useInfiniteQuery, useQuery, useQueryClient, type DehydratedState } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import type { MapConfiguration } from '@apnatown/ui/geo/MapView';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { EmptyState, ErrorState, NoPermissionState } from '@apnatown/ui/feedback/StateViews';
import { Button } from '@apnatown/ui/primitives/Button';
import { Chip } from '@apnatown/ui/primitives/Chip';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { Input } from '@apnatown/ui/primitives/Input';
import { failureCode } from '../../shared/api/result';
import { useSession } from '../../shared/auth/SessionProvider';
import { LocationBar, preciseBrowseLocation, useBrowseLocation } from '../geo';
import { categoriesOptions, catalogName } from '../catalog';
import { exploreOptions } from './api';
import { ExploreCards } from './ExploreCards';
import { ExploreFilterPanel } from './ExploreFilterPanel';
import { ExploreFilterChips, activeFilterCount } from './ExploreFilterChips';
import { ExploreMap } from './ExploreMap';
import { ExploreTabs } from './ExploreTabs';
import { readFilters, filterParams, withFilters, resetFilters, withContext, withTab, type ExploreFilters, type FilterPatch } from './url-state';
import { useExploreScroll } from './use-explore-scroll';

type Props = {
  initial?: DehydratedState | undefined;
  mapConfig: MapConfiguration;
  defaults?: Partial<ExploreFilters>;
  screen?: 'explore' | 'search' | 'category';
};

export function ExploreScreen({ initial, mapConfig, defaults, screen = 'explore' }: Props) {
  const cache = useQueryClient();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('explore.screen');
  const merged = new URLSearchParams(params);
  for (const [key, value] of Object.entries(defaults ?? {}))
    if (!merged.has(key) && value !== undefined) merged.set(key, String(value));
  const filters = readFilters(merged);
  if (!filters) return <ErrorState title={t('invalidFilters')} message={t('invalidFiltersMessage')}
    action={<Button onClick={() => router.push(pathname, { scroll: false })}>{t('resetFilters')}</Button>} />;
  const hydration = initial && { ...initial, queries: initial.queries.filter((query) => !cache.getQueryData(query.queryKey)) };
  return <HydrationBoundary state={hydration}><ExploreContent filters={filters} mapConfig={mapConfig} screen={screen} /></HydrationBoundary>;
}

function ExploreContent({ filters, mapConfig, screen }: {
  filters: ExploreFilters; mapConfig: MapConfiguration; screen: 'explore' | 'search' | 'category';
}) {
  const t = useTranslations('explore.screen');
  const permission = useTranslations('common.noPermission');
  const share = useTranslations('engagement.share');
  const geo = useTranslations('geo.explore');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const pathname = usePathname();
  const params = useSearchParams();
  const { api } = useSession();
  const location = useBrowseLocation();
  const position = preciseBrowseLocation();
  const effective = {
    ...filters,
    ...(location.selection && !filters.cityId && { cityId: location.selection.city.id }),
    ...(location.selection?.area && !filters.areaId && (!filters.cityId || filters.cityId === location.selection.city.id) && { areaId: location.selection.area.id }),
  };
  const results = useInfiniteQuery(exploreOptions(api, effective, location.revision, screen, position));
  const categories = useQuery(categoriesOptions(api));
  const first = results.data?.pages[0];
  const current = first?.normalizedFilters ?? effective;
  const items = results.data?.pages.flatMap((page) => page.page.items) ?? [];
  const pins = [...new Map((results.data?.pages.flatMap((page) => page.mapPins) ?? []).map((pin) => [pin.businessId, pin])).values()];
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [draft, setDraft] = useState<URLSearchParams | null>(null);
  const draftFilters = draft ? readFilters(draft) : null;
  const preview = useInfiniteQuery({
    ...exploreOptions(api, draftFilters ?? effective, location.revision, screen, position),
    enabled: draftFilters !== null,
    placeholderData: (previous) => previous,
  });
  const draftPage = preview.data?.pages[0];
  const [changingCategory, setChangingCategory] = useState(false);
  const activeCount = activeFilterCount(current);
  const code = results.isError ? failureCode(results.error) : '';
  const denied = ['COMMON_FORBIDDEN', 'ACCOUNT_UNAVAILABLE'].includes(code);
  useExploreScroll(!results.isPending);

  const go = (next: URLSearchParams) => {
    if (next.toString() === params.toString()) return;
    setCopyStatus('idle');
    window.history.pushState(null, '', `${pathname}?${next}`);
  };
  const setFilter = (patch: FilterPatch) => go(withFilters(filterParams(current), patch));
  const reset = () => go(resetFilters(filterParams(current)));
  const clearContext = () => go(withContext(filterParams(current), null));
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopyStatus('copied'); }
    catch { setCopyStatus('failed'); }
  };
  const context = categories.data?.items.find((category) => category.slug === current.contextCategory);
  const contextLabel = context ? catalogName(context, locale) : current.contextCategory;
  return (
    <div className="grid min-w-0 gap-stack-gap">
      {screen === 'search' && <SearchInput query={filters.q ?? ''} onChange={(q) => setFilter({ q: q || null })} />}
      <LocationBar />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {contextLabel && <Chip label={contextLabel} removable removeLabel={t('clearCategory')} onRemove={clearContext} />}
          <Button variant="text" onClick={() => setChangingCategory(true)}>{t('changeCategory')}</Button>
        </div>
        {current.tab !== 'products' && <div role="group" aria-label={geo('viewLabel')} className="flex gap-2">
          {(['list', 'map'] as const).map((view) => <Button key={view} variant={current.view === view ? 'primary' : 'outline'}
            aria-pressed={current.view === view} onClick={() => setFilter({ view, ...(view === 'list' && { radiusKm: null }) })}>{geo(view)}</Button>)}
        </div>}
      </div>
      {screen !== 'category' && <ExploreTabs tab={current.tab} counts={first?.counts} onChange={(tab) => go(withTab(filterParams(current), tab))} />}
      <p className="rounded-md border border-info bg-surface p-3 text-small text-text-2">{t('nearbyExplanation')}</p>
      <div id="explore-panel" role={screen === 'category' ? undefined : 'tabpanel'} tabIndex={0}
        aria-labelledby={screen === 'category' ? undefined : `explore-tab-${current.tab}`}
        className="grid gap-stack-gap desktop:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] desktop:items-start">
        <aside aria-label={t('filters')} className="hidden rounded-md border border-border bg-surface p-4 desktop:block">
          {first ? <ExploreFilterPanel filters={current} facets={first.facets} onChange={setFilter} onReset={reset} />
            : results.isPending ? <Skeleton label={t('loading')} /> : <Button onClick={reset}>{t('resetFilters')}</Button>}
        </aside>
        <section className="grid min-w-0 gap-3" aria-busy={results.isFetching}>
          <Button variant="outline" className="justify-self-start desktop:hidden"
            onClick={() => setDraft(filterParams(current))}>{t('filtersWithCount', { count: activeCount })}</Button>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <b aria-live="polite">{first ? t(`count.${current.tab}`, { count: first.counts[current.tab] }) : null}</b>
            <div className="flex flex-wrap gap-2">
              {activeCount > 0 && <Button variant="text" onClick={reset}>{t('clearAll')}</Button>}
              <Button variant="text" onClick={copyLink}>{t('copyLink')}</Button>
            </div>
          </div>
          <p role="status" className="text-small text-text-2">{copyStatus === 'copied' ? t('linkCopied') : ''}</p>
          {copyStatus === 'failed' && <p role="alert" className="text-small text-error">{share('copyFailed')}</p>}
          <ExploreFilterChips filters={current} facets={first?.facets} onChange={setFilter} />
          {results.isPending ? <Skeleton label={t('loading')} />
            : denied ? <NoPermissionState title={permission('title')} message={permission('message')} action={null} />
            : results.isError && !items.length ? (
              <ErrorState title={code === 'SEARCH_LOCATION_REQUIRED' ? t('locationRequired') : t('errorTitle')}
                message={code === 'SEARCH_LOCATION_REQUIRED' ? t('locationRequiredMessage') : t('errorMessage')}
                action={<div className="flex flex-wrap gap-2">
                  <Button onClick={() => void results.refetch()}>{t('retry')}</Button>
                  <Button variant="outline" onClick={reset}>{t('resetFilters')}</Button>
                </div>} />
            ) : <>
              {current.view === 'map' && <ExploreMap key={`${current.tab}.${current.radiusKm ?? ''}`} config={mapConfig}
                pins={pins} radius={current.radiusKm} position={position} onChange={setFilter} />}
              {items.length ? <ExploreCards tab={current.tab} items={items} locale={locale} />
                : <EmptyState title={t(activeCount ? 'emptyFiltered' : `emptyNone.${current.tab}`)}
                    message={t(activeCount ? 'emptyFilteredMessage' : 'emptyNoneMessage')}
                    action={<div className="flex flex-wrap justify-center gap-2">
                      {(current.category || current.contextCategory) && <Button onClick={clearContext}>{t('clearCategory')}</Button>}
                      <Button variant="outline" onClick={reset}>{t('resetFilters')}</Button>
                    </div>} />}
              {!items.length && first?.facets.categories.some((category) => category.count > 0) && (
                <section className="grid gap-2"><h3>{t('suggestedCategories')}</h3><div className="flex flex-wrap gap-2">
                  {first.facets.categories.filter((category) => category.count > 0).map((category) => <Button key={category.id}
                    variant="outline" onClick={() => setFilter({ category: category.value, ...(current.tab !== 'shops' && { subcategory: '' }) })}>
                    {t('categoryCount', { name: locale === 'hi' && category.labelHi ? category.labelHi : category.labelEn, count: category.count })}
                  </Button>)}
                </div></section>
              )}
              {results.hasNextPage && <Button variant="outline" className="justify-self-center"
                loading={results.isFetchingNextPage} disabled={results.isFetching}
                onClick={() => void results.fetchNextPage()}>{t('loadMore')}</Button>}
            </>}
          {results.isError && items.length > 0 && !denied && <ErrorState title={t('errorTitle')} message={t('errorMessage')}
            action={<Button disabled={results.isFetching} onClick={() => void (results.isFetchNextPageError ? results.fetchNextPage() : results.refetch())}>{t('retry')}</Button>} />}
        </section>
      </div>
      <Sheet open={draft !== null} onOpenChange={(open) => { if (!open) setDraft(null); }} title={t('filters')} closeLabel={t('cancel')} stickyFooter
        footer={<div className="sticky bottom-0 flex flex-wrap gap-2 bg-surface py-3">
          <Button variant="outline" onClick={() => { if (draft) setDraft(resetFilters(draft)); }}>{t('reset')}</Button>
          <Button loading={preview.isFetching} disabled={!draftFilters || !draftPage || preview.isError || preview.isFetching}
            onClick={() => { if (draftPage) go(filterParams(draftPage.normalizedFilters)); setDraft(null); }}>
            {preview.isFetching ? t('loading') : t('showResults', { count: draftPage?.counts[current.tab] ?? 0 })}
          </Button>
        </div>}>
        {draftFilters && draftPage && <ExploreFilterPanel filters={draftFilters} facets={draftPage.facets}
          onChange={(patch) => setDraft(withFilters(draft!, patch))} onReset={() => setDraft(resetFilters(draft!))} />}
        {preview.isPending && <Skeleton label={t('loading')} />}
        {!draftFilters && draft && <p role="alert">{t('invalidFiltersMessage')}</p>}
        {preview.isError && <ErrorState title={t('errorTitle')}
          message={failureCode(preview.error) === 'SEARCH_LOCATION_REQUIRED' ? t('locationRequiredMessage') : t('errorMessage')}
          action={<Button onClick={() => void preview.refetch()}>{t('retry')}</Button>} />}
      </Sheet>
      <Sheet open={changingCategory} onOpenChange={setChangingCategory} title={t('changeCategory')} closeLabel={t('cancel')}>
        {categories.isPending ? <Skeleton label={t('loading')} /> : categories.data ? <div className="grid gap-2">
          {categories.data.items.map((category) => <Button key={category.id} variant="outline" onClick={() => {
              go(withContext(filterParams(current), category.slug)); setChangingCategory(false);
            }}>{catalogName(category, locale)}</Button>)}
          <Button variant="text" onClick={() => { clearContext(); setChangingCategory(false); }}>{t('clearCategory')}</Button>
        </div> : <ErrorState title={t('errorTitle')} message={t('categoryError')} action={<Button onClick={() => void categories.refetch()}>{t('retry')}</Button>} />}
      </Sheet>
    </div>
  );
}

function SearchInput({ query, onChange }: { query: string; onChange: (query: string) => void }) {
  const t = useTranslations('explore.screen');
  return <form onSubmit={(event) => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('q');
    if (typeof value === 'string') onChange(value.trim());
  }} className="flex flex-wrap items-end gap-2">
    <Input key={query} type="search" name="q" defaultValue={query} maxLength={200} label={t('search')} wrapperClassName="min-w-0 flex-1" />
    <Button type="submit">{t('search')}</Button>
  </form>;
}
