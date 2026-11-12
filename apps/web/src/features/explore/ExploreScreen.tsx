'use client';

import {
  HydrationBoundary,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type DehydratedState,
} from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import type { MapConfiguration } from '@apnatown/ui/geo/MapView';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
} from '@apnatown/ui/feedback/StateViews';
import { Button } from '@apnatown/ui/primitives/Button';
import { Chip } from '@apnatown/ui/primitives/Chip';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { Input } from '@apnatown/ui/primitives/Input';
import { failureCode } from '../../shared/api/result';
import { useSession } from '../../shared/auth/SessionProvider';
import {
  LocationPicker,
  type PickerStep,
  preciseBrowseLocation,
  useBrowseLocation,
} from '../geo';
import { categoriesOptions, catalogName } from '../catalog';
import { useOnline } from '../../shared/hooks/use-online';
import { exploreOptions } from './api';
import { ExploreCards } from './ExploreCards';
import { ExploreFilterPanel } from './ExploreFilterPanel';
import { ExploreFilterChips, activeFilterCount } from './ExploreFilterChips';
import { ExploreMap } from './ExploreMap';
import { ExploreTabs } from './ExploreTabs';
import {
  readFilters,
  filterParams,
  withFilters,
  resetFilters,
  withContext,
  withTab,
  type ExploreFilters,
  type FilterPatch,
} from './url-state';
import { useExploreScroll } from './use-explore-scroll';
import { NavIcon } from '../../shared/ui/NavIcon';

type Props = {
  initial?: DehydratedState | undefined;
  mapConfig: MapConfiguration;
  defaults?: Partial<ExploreFilters>;
  screen?: 'explore' | 'search' | 'category';
};

export function ExploreScreen({
  initial,
  mapConfig,
  defaults,
  screen = 'explore',
}: Props) {
  const cache = useQueryClient();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('explore.screen');
  const merged = new URLSearchParams(params);
  for (const [key, value] of Object.entries(defaults ?? {}))
    if (!merged.has(key) && value !== undefined) merged.set(key, String(value));
  const filters = readFilters(merged);
  if (!filters)
    return (
      <ErrorState
        title={t('invalidFilters')}
        message={t('invalidFiltersMessage')}
        action={
          <Button onClick={() => router.push(pathname, { scroll: false })}>
            {t('resetFilters')}
          </Button>
        }
      />
    );
  const hydration = initial && {
    ...initial,
    queries: initial.queries.filter(
      (query) => !cache.getQueryData(query.queryKey),
    ),
  };
  return (
    <HydrationBoundary state={hydration}>
      <ExploreContent filters={filters} mapConfig={mapConfig} screen={screen} />
    </HydrationBoundary>
  );
}

function ExploreContent({
  filters,
  mapConfig,
  screen,
}: {
  filters: ExploreFilters;
  mapConfig: MapConfiguration;
  screen: 'explore' | 'search' | 'category';
}) {
  const t = useTranslations('explore.screen');
  const permission = useTranslations('common.noPermission');
  const share = useTranslations('engagement.share');
  const geo = useTranslations('geo.explore');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const pathname = usePathname();
  const params = useSearchParams();
  const { api } = useSession();
  const cache = useQueryClient();
  const location = useBrowseLocation();
  const position =
    location.selection?.source === 'gps' ? preciseBrowseLocation() : null;
  const online = useOnline();
  const effective = {
    ...filters,
    ...(location.selection &&
      !filters.cityId && { cityId: location.selection.city.id }),
    ...(location.selection?.area &&
      !filters.areaId &&
      (!filters.cityId || filters.cityId === location.selection.city.id) && {
        areaId: location.selection.area.id,
      }),
    ...(filters.view === 'map' &&
      filters.radiusKm === undefined &&
      (position || filters.areaId || location.selection?.area) && {
        radiusKm: 6,
      }),
  };
  const queryOptions = exploreOptions(
    api,
    effective,
    location.revision,
    screen,
    position,
  );
  const results = useInfiniteQuery(queryOptions);
  const categories = useQuery(categoriesOptions(api));
  const first = results.data?.pages[0];
  const current = first?.normalizedFilters ?? effective;
  const items = results.data?.pages.flatMap((page) => page.page.items) ?? [];
  const pins = useMemo(
    () => [
      ...new Map(
        (results.data?.pages.flatMap((page) => page.mapPins) ?? []).map(
          (pin) => [pin.businessId, pin],
        ),
      ).values(),
    ],
    [results.data],
  );
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>(
    'idle',
  );
  const [draft, setDraft] = useState<URLSearchParams | null>(null);
  const draftFilters = draft ? readFilters(draft) : null;
  const preview = useInfiniteQuery({
    ...exploreOptions(
      api,
      draftFilters ?? effective,
      location.revision,
      screen,
      position,
    ),
    enabled: draftFilters !== null,
    placeholderData: (previous) =>
      previous?.pages[0]?.tab === (draftFilters ?? effective).tab
        ? previous
        : undefined,
  });
  const draftPage = preview.data?.pages[0];
  const draftCurrent = preview.isPlaceholderData
    ? draftFilters
    : (draftPage?.normalizedFilters ?? draftFilters);
  const [changingCategory, setChangingCategory] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationStep, setLocationStep] = useState<PickerStep>({
    kind: 'choose',
  });
  const activeCount = activeFilterCount(current);
  const code = results.isError ? failureCode(results.error) : '';
  const denied = ['COMMON_FORBIDDEN', 'ACCOUNT_UNAVAILABLE'].includes(code);
  useExploreScroll(!results.isPending);

  const go = (next: URLSearchParams) => {
    if (next.toString() === params.toString()) return;
    setCopyStatus('idle');
    window.history.pushState(null, '', `${pathname}?${next}`);
  };
  const setFilter = (patch: FilterPatch) =>
    go(withFilters(filterParams(current), patch));
  const reset = () => go(resetFilters(filterParams(current)));
  const clearContext = () => go(withContext(filterParams(current), null));
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  };
  const context = categories.data?.items.find(
    (category) => category.slug === current.contextCategory,
  );
  const contextLabel = context
    ? catalogName(context, locale)
    : current.contextCategory;
  const area = location.selection?.area;
  const place =
    area && current.areaId === area.id
      ? locale === 'hi'
        ? area.nameHi
        : area.nameEn
      : t('selectedLocation');
  return (
    <div className="grid min-w-0 gap-stack-gap">
      {screen === 'search' && (
        <SearchInput
          query={filters.q ?? ''}
          onChange={(q) => setFilter({ q: q || null })}
        />
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {screen === 'explore' && (
          <h1 className="text-h1 desktop:text-h1-desktop">{t('title')}</h1>
        )}
        <div
          role="group"
          aria-label={geo('viewLabel')}
          className="flex gap-row-gap"
        >
          {(['list', 'map'] as const).map((view) => (
            <Chip
              key={view}
              label={geo(view)}
              icon={<NavIcon name={view} className="size-4" />}
              selected={current.view === view}
              className="min-h-button-small!"
              onClick={() =>
                setFilter({
                  view,
                  ...(view === 'list' && { radiusKm: null }),
                })
              }
            />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-row-gap">
        {contextLabel ? (
          <>
            <span className="text-small text-muted">{t('category')}:</span>
            <Chip
              label={contextLabel}
              removable
              removeLabel={t('clearCategory')}
              onRemove={clearContext}
            />
          </>
        ) : (
          <span className="self-center text-small text-muted">
            {t('allCategories')}
          </span>
        )}
        <Button
          variant="text"
          size="small"
          onClick={() => setChangingCategory(true)}
        >
          {t('changeCategory')}
        </Button>
      </div>
      {screen !== 'category' && (
        <ExploreTabs
          tab={current.tab}
          counts={first?.counts}
          onChange={(tab) => go(withTab(filterParams(current), tab))}
        />
      )}
      <div className="flex items-start gap-row-gap rounded-md border border-info bg-info-soft px-field-inline py-3 text-product-title">
        <NavIcon name="info" className="mt-0.5 size-5 text-info" />
        <p className="min-w-0 flex-1">
          {t.rich('nearbyExplanation', {
            place,
            strong: (children) => <strong>{children}</strong>,
          })}
        </p>
        {!location.selection && (
          <Button
            variant="text"
            size="small"
            onClick={() => {
              setLocationStep({ kind: 'choose' });
              setLocationOpen(true);
            }}
          >
            {t('changeLocation')}
          </Button>
        )}
      </div>
      <div
        id="explore-panel"
        role={screen === 'category' ? undefined : 'tabpanel'}
        tabIndex={0}
        aria-labelledby={
          screen === 'category' ? undefined : `explore-tab-${current.tab}`
        }
        className="grid gap-4 desktop:grid-cols-[var(--at-explore-sidebar)_minmax(0,1fr)] desktop:items-start"
      >
        <aside
          aria-label={t('filters')}
          className="hidden rounded-lg border border-border bg-surface p-4 shadow-1 desktop:sticky desktop:top-explore-sidebar-top desktop:block desktop:max-h-explore-sidebar-max desktop:overflow-auto"
        >
          <ExploreFilterPanel
            filters={current}
            facets={first?.facets}
            onChange={setFilter}
            onReset={reset}
          />
        </aside>
        <section
          className="grid min-w-0 content-start gap-stack-gap"
          aria-busy={results.isFetching}
        >
          <Button
            variant="ghost"
            className="w-full desktop:hidden"
            onClick={() => setDraft(filterParams(current))}
          >
            <NavIcon name="filter" className="size-4" />
            {t('filters')}
            {activeCount > 0 && (
              <span className="rounded-pill bg-primary px-1.5 text-tab-count text-on-primary">
                {activeCount}
              </span>
            )}
          </Button>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <b aria-live="polite">
              {first
                ? t(`count.${current.tab}`, {
                    count: first.counts[current.tab],
                  })
                : null}
            </b>
            {activeCount > 0 && (
              <Button variant="text" size="small" onClick={reset}>
                {t('clearAll')}
              </Button>
            )}
            <Button variant="text" size="small" onClick={copyLink}>
              <NavIcon name="copy" className="size-4" />
              {t('copyLink')}
            </Button>
          </div>
          <p
            role="status"
            className={
              copyStatus === 'copied' ? 'text-small text-text-2' : 'sr-only'
            }
          >
            {copyStatus === 'copied' ? t('linkCopied') : ''}
          </p>
          {copyStatus === 'failed' && (
            <p role="alert" className="text-small text-error">
              {share('copyFailed')}
            </p>
          )}
          {activeCount > 0 && (
            <ExploreFilterChips
              filters={current}
              facets={first?.facets}
              onChange={setFilter}
            />
          )}
          {!online && (
            <p role="status" className="rounded-md border border-warning p-3">
              {t('offlineMessage')}
            </p>
          )}
          {results.isPending ? (
            online ? (
              <Skeleton label={t('loading')} />
            ) : (
              <ErrorState
                title={t('offlineTitle')}
                message={t('offlineMessage')}
                action={
                  <Button onClick={() => void results.refetch()}>
                    {t('retry')}
                  </Button>
                }
              />
            )
          ) : denied ? (
            <NoPermissionState
              title={permission('title')}
              message={permission('message')}
              action={null}
            />
          ) : results.isError && !items.length ? (
            <ErrorState
              title={
                code === 'SEARCH_LOCATION_REQUIRED'
                  ? t('locationRequired')
                  : t('errorTitle')
              }
              message={
                code === 'SEARCH_LOCATION_REQUIRED'
                  ? t('locationRequiredMessage')
                  : t('errorMessage')
              }
              action={
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => void results.refetch()}>
                    {t('retry')}
                  </Button>
                  <Button variant="outline" onClick={reset}>
                    {t('resetFilters')}
                  </Button>
                </div>
              }
            />
          ) : (
            <>
              {current.view === 'map' && (
                <ExploreMap
                  key={`${current.tab}.${current.radiusKm ?? ''}`}
                  config={mapConfig}
                  pins={pins}
                  radius={current.radiusKm}
                  position={position}
                  locationAvailable={Boolean(position || current.areaId)}
                  onChange={setFilter}
                />
              )}
              {items.length ? (
                <ExploreCards
                  tab={current.tab}
                  items={items}
                  locale={locale}
                  categories={categories.data?.items ?? []}
                />
              ) : (
                <EmptyState
                  title={t(
                    activeCount ? 'emptyFiltered' : `emptyNone.${current.tab}`,
                  )}
                  message={t(
                    activeCount ? 'emptyFilteredMessage' : 'emptyNoneMessage',
                  )}
                  action={
                    <div className="flex flex-wrap justify-center gap-2">
                      {(current.category || current.contextCategory) && (
                        <Button onClick={clearContext}>
                          {t('clearCategory')}
                        </Button>
                      )}
                      <Button variant="outline" onClick={reset}>
                        {t('resetFilters')}
                      </Button>
                    </div>
                  }
                />
              )}
              {!items.length &&
                first?.facets.categories.some(
                  (category) => category.count > 0,
                ) && (
                  <section className="grid gap-2">
                    <h3>{t('suggestedCategories')}</h3>
                    <div className="flex flex-wrap gap-2">
                      {first.facets.categories
                        .filter((category) => category.count > 0)
                        .map((category) => (
                          <Button
                            key={category.id}
                            variant="outline"
                            onClick={() =>
                              setFilter({
                                category: category.value,
                                ...(current.tab !== 'shops' && {
                                  subcategory: '',
                                }),
                              })
                            }
                          >
                            {t('categoryCount', {
                              name:
                                locale === 'hi' && category.labelHi
                                  ? category.labelHi
                                  : category.labelEn,
                              count: category.count,
                            })}
                          </Button>
                        ))}
                    </div>
                  </section>
                )}
              {results.hasNextPage && (
                <Button
                  variant="outline"
                  className="justify-self-center"
                  loading={results.isFetchingNextPage}
                  disabled={results.isFetching}
                  onClick={() => void results.fetchNextPage()}
                >
                  {t('loadMore')}
                </Button>
              )}
            </>
          )}
          {results.isError && items.length > 0 && !denied && (
            <ErrorState
              title={t('errorTitle')}
              message={t('errorMessage')}
              action={
                <Button
                  disabled={results.isFetching}
                  onClick={() =>
                    void (code === 'COMMON_VALIDATION_FAILED'
                      ? cache.resetQueries({
                          queryKey: queryOptions.queryKey,
                          exact: true,
                        })
                      : results.isFetchNextPageError
                        ? results.fetchNextPage()
                        : results.refetch())
                  }
                >
                  {t('retry')}
                </Button>
              }
            />
          )}
        </section>
      </div>
      <Sheet
        open={draft !== null}
        onOpenChange={(open) => {
          if (!open) setDraft(null);
        }}
        title={t('filters')}
        closeLabel={t('cancel')}
        stickyFooter
        footer={
          <div className="sticky bottom-0 flex flex-wrap gap-2 bg-surface py-3">
            <Button
              variant="outline"
              onClick={() => {
                if (draft) setDraft(resetFilters(draft));
              }}
            >
              {t('reset')}
            </Button>
            <Button
              loading={preview.isFetching}
              disabled={
                !draftFilters ||
                !draftPage ||
                preview.isError ||
                preview.isFetching
              }
              onClick={() => {
                if (draftPage) go(filterParams(draftPage.normalizedFilters));
                setDraft(null);
              }}
            >
              {preview.isFetching
                ? t('loading')
                : t('showResults', {
                    count: draftPage?.counts[current.tab] ?? 0,
                  })}
            </Button>
          </div>
        }
      >
        {draftCurrent && (
          <ExploreFilterPanel
            filters={draftCurrent}
            facets={draftPage?.facets}
            onChange={(patch) =>
              setDraft(withFilters(filterParams(draftCurrent), patch))
            }
            onReset={() => setDraft(resetFilters(filterParams(draftCurrent)))}
          />
        )}
        {preview.isPending && <Skeleton label={t('loading')} />}
        {!draftFilters && draft && (
          <p role="alert">{t('invalidFiltersMessage')}</p>
        )}
        {preview.isError && (
          <ErrorState
            title={t('errorTitle')}
            message={
              failureCode(preview.error) === 'SEARCH_LOCATION_REQUIRED'
                ? t('locationRequiredMessage')
                : t('errorMessage')
            }
            action={
              failureCode(preview.error) === 'SEARCH_LOCATION_REQUIRED' ? (
                <Button
                  onClick={() => {
                    setLocationStep({ kind: 'choose' });
                    setLocationOpen(true);
                  }}
                >
                  {t('changeLocation')}
                </Button>
              ) : (
                <Button onClick={() => void preview.refetch()}>
                  {t('retry')}
                </Button>
              )
            }
          />
        )}
      </Sheet>
      <Sheet
        open={changingCategory}
        onOpenChange={setChangingCategory}
        title={t('changeCategory')}
        closeLabel={t('cancel')}
      >
        {categories.isPending ? (
          <Skeleton label={t('loading')} />
        ) : categories.data ? (
          <div className="grid gap-2">
            {categories.data.items.map((category) => (
              <Button
                key={category.id}
                variant="outline"
                onClick={() => {
                  go(withContext(filterParams(current), category.slug));
                  setChangingCategory(false);
                }}
              >
                {catalogName(category, locale)}
              </Button>
            ))}
            <Button
              variant="text"
              onClick={() => {
                clearContext();
                setChangingCategory(false);
              }}
            >
              {t('clearCategory')}
            </Button>
          </div>
        ) : (
          <ErrorState
            title={t('errorTitle')}
            message={t('categoryError')}
            action={
              <Button onClick={() => void categories.refetch()}>
                {t('retry')}
              </Button>
            }
          />
        )}
      </Sheet>
      <LocationPicker
        open={locationOpen}
        step={locationStep}
        onStep={setLocationStep}
        onClose={() => setLocationOpen(false)}
        onResolved={(selection) => {
          const patch = {
            cityId: selection.city.id,
            areaId: selection.area?.id ?? null,
          };
          setFilter(patch);
          if (draft) setDraft(withFilters(draft, patch));
          setLocationOpen(false);
        }}
      />
    </div>
  );
}

function SearchInput({
  query,
  onChange,
}: {
  query: string;
  onChange: (query: string) => void;
}) {
  const t = useTranslations('explore.screen');
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get('q');
        if (typeof value === 'string') onChange(value.trim());
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <Input
        key={query}
        type="search"
        name="q"
        defaultValue={query}
        maxLength={200}
        label={t('search')}
        wrapperClassName="min-w-0 flex-1"
      />
      <Button type="submit">{t('search')}</Button>
    </form>
  );
}
