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
import { useState } from 'react';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
} from '@apnatown/ui/feedback/StateViews';
import { Button } from '@apnatown/ui/primitives/Button';
import { Chip } from '@apnatown/ui/primitives/Chip';
import { failureCode } from '../../shared/api/result';
import { useSession } from '../../shared/auth/SessionProvider';
import { catalogName, categoriesOptions } from '../catalog';
import { exploreOptions } from './api';
import { ExploreCards } from './ExploreCards';
import { ExploreFilterPanel } from './ExploreFilterPanel';
import { ExploreTabs } from './ExploreTabs';
import {
  readFilters,
  withFilters,
  withTab,
  type ExploreFilters,
} from './url-state';
import { useExploreScroll } from './use-explore-scroll';

/** S-CUST-02 Explore: URL-owned tab/filters, React Query results. */
export function ExploreScreen({
  initial,
}: {
  initial: DehydratedState | undefined;
}) {
  const cache = useQueryClient();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('explore.screen');
  const filters = readFilters(new URLSearchParams(params));
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
  // Returning from another route must not replace cached Load-more pages
  // with the server's first page before restoring the saved scroll position.
  const hydration = initial && {
    ...initial,
    queries: initial.queries.filter(
      (query) => !cache.getQueryData(query.queryKey),
    ),
  };
  return (
    <HydrationBoundary state={hydration}>
      <ExploreContent filters={filters} />
    </HydrationBoundary>
  );
}

function ExploreContent({ filters }: { filters: ExploreFilters }) {
  const t = useTranslations('explore.screen');
  const permission = useTranslations('common.noPermission');
  const share = useTranslations('engagement.share');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const pathname = usePathname();
  const params = useSearchParams();
  const { api } = useSession();
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>(
    'idle',
  );
  const { tab } = filters;

  const categories = useQuery(categoriesOptions(api, 'product'));
  const results = useInfiniteQuery(exploreOptions(api, filters));
  useExploreScroll(!results.isPending && !categories.isPending);

  const go = (next: URLSearchParams) => {
    const href = `${pathname}?${next}`;
    if (next.toString() === params.toString()) return;
    setCopyStatus('idle');
    // Next's native-history integration updates URL hooks without rerunning
    // the initial SSR read; React Query owns subsequent filter requests.
    window.history.pushState(null, '', href);
  };
  const current = () => new URLSearchParams(params);
  const setFilter = (patch: Parameters<typeof withFilters>[1]) =>
    go(withFilters(current(), patch));
  const clearAll = () =>
    setFilter({ category: null, verified: null, sort: null });
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  };

  const category = categories.data?.items.find(
    (item) => item.slug === filters.category,
  );
  const categoryLabel = category
    ? catalogName(category, locale)
    : filters.category;
  const chips: { key: string; label: string; remove: () => void }[] = [];
  if (filters.category && categoryLabel)
    chips.push({
      key: 'category',
      label: categoryLabel,
      remove: () => setFilter({ category: null }),
    });
  if (filters.verified)
    chips.push({
      key: 'verified',
      label: t('verified'),
      remove: () => setFilter({ verified: null }),
    });
  if (filters.sort !== 'relevance')
    chips.push({
      key: 'sort',
      label: t('sortChip', { label: t(`sort.${filters.sort}`) }),
      remove: () => setFilter({ sort: null }),
    });

  const firstPage = results.data?.pages[0];
  const items = results.data?.pages.flatMap((page) => page.items) ?? [];
  const counts = firstPage?.counts;
  const denied =
    results.isError &&
    ['COMMON_FORBIDDEN', 'ACCOUNT_UNAVAILABLE'].includes(
      failureCode(results.error),
    );

  return (
    <div className="grid min-w-0 gap-stack-gap">
      <ExploreTabs
        tab={tab}
        counts={counts}
        onChange={(next) => go(withTab(current(), next))}
      />

      <div
        id="explore-panel"
        role="tabpanel"
        tabIndex={0}
        aria-labelledby={`explore-tab-${tab}`}
        className="grid gap-stack-gap desktop:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] desktop:items-start"
      >
        {categories.isPending ? (
          <Skeleton label={t('loading')} />
        ) : categories.isError ? (
          <ErrorState
            title={t('errorTitle')}
            message={t('categoryError')}
            action={
              <Button
                disabled={categories.isFetching}
                onClick={() => void categories.refetch()}
              >
                {t('retry')}
              </Button>
            }
          />
        ) : (
          <ExploreFilterPanel
            filters={filters}
            categories={categories.data.items}
            locale={locale}
            onChange={setFilter}
            onReset={clearAll}
          />
        )}

        <section className="grid min-w-0 gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <b aria-live="polite">
              {counts ? t(`count.${tab}`, { count: counts[tab] }) : null}
            </b>
            <div className="flex flex-wrap gap-2">
              {chips.length > 0 && (
                <Button variant="text" onClick={clearAll}>
                  {t('clearAll')}
                </Button>
              )}
              <Button variant="text" onClick={copyLink}>
                <span aria-hidden="true">🔗</span> {t('copyLink')}
              </Button>
            </div>
          </div>
          <p role="status" className="sr-only">
            {copyStatus === 'copied' ? t('linkCopied') : ''}
          </p>
          {copyStatus === 'copied' && (
            <p aria-hidden="true" className="text-small text-text-2">
              {t('linkCopied')}
            </p>
          )}
          {copyStatus === 'failed' && (
            <p role="alert" className="text-small text-error">
              {share('copyFailed')}
            </p>
          )}
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <Chip
                  key={chip.key}
                  label={chip.label}
                  removable
                  removeLabel={t('removeFilter', { label: chip.label })}
                  onRemove={chip.remove}
                />
              ))}
            </div>
          )}

          {results.isPending ? (
            <Skeleton label={t('loading')} />
          ) : denied ? (
            <NoPermissionState
              title={permission('title')}
              message={permission('message')}
              action={null}
            />
          ) : results.isError && !items.length ? (
            failureCode(results.error) === 'SEARCH_FILTER_INVALID' ? (
              <EmptyState
                title={t('invalidCategory')}
                message={t('emptyFilteredMessage')}
                action={
                  <Button onClick={() => setFilter({ category: null })}>
                    {t('clearCategory')}
                  </Button>
                }
              />
            ) : (
              <ErrorState
                title={t('errorTitle')}
                message={t('errorMessage')}
                action={
                  <Button onClick={() => void results.refetch()}>
                    {t('retry')}
                  </Button>
                }
              />
            )
          ) : items.length ? (
            <>
              <ExploreCards tab={tab} items={items} locale={locale} />
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
          ) : (
            <EmptyState
              title={
                filters.category && categoryLabel
                  ? t(`emptyCategory.${tab}`, { category: categoryLabel })
                  : chips.length
                    ? t('emptyFiltered')
                    : t(`emptyNone.${tab}`)
              }
              message={
                chips.length ? t('emptyFilteredMessage') : t('emptyNoneMessage')
              }
              action={
                chips.length ? (
                  <div className="flex flex-wrap justify-center gap-2">
                    {filters.category && (
                      <Button onClick={() => setFilter({ category: null })}>
                        {t('clearCategory')}
                      </Button>
                    )}
                    <Button variant="outline" onClick={clearAll}>
                      {t('resetFilters')}
                    </Button>
                  </div>
                ) : null
              }
            />
          )}
          {results.isError && items.length > 0 && !denied && (
            <ErrorState
              title={t('errorTitle')}
              message={t('errorMessage')}
              action={
                <Button
                  disabled={results.isFetching}
                  onClick={() =>
                    void (results.isFetchNextPageError
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
    </div>
  );
}
