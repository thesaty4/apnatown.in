'use client';

import { useTranslations } from 'next-intl';
import type { InfiniteData } from '@tanstack/react-query';
import type { ExploreCard } from '@apnatown/shared/search';
import type { Category } from '@apnatown/shared/catalog';
import { Button } from '@apnatown/ui/primitives/Button';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { EmptyState, ErrorState } from '@apnatown/ui/feedback/StateViews';
import { ExploreCards } from '../../explore';
import type { Locale } from '../../../shared/i18n/preferences';

type Page = { items: ExploreCard[] };
export type ListingQuery = {
  data: InfiniteData<Page, unknown> | undefined;
  isPending: boolean;
  isError: boolean;
  isFetchNextPageError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  refetch: () => unknown;
  fetchNextPage: () => unknown;
};

/**
 * One segment's results: skeleton → error+retry → filter-empty → cards with
 * keyset "Load more". Earlier pages stay visible when a later page fails.
 */
export function ListingResults({
  segment,
  query,
  categories,
  locale,
  filtered,
  onShowAll,
}: {
  segment: 'products' | 'services';
  query: ListingQuery;
  categories: Category[];
  locale: Locale;
  filtered: boolean;
  onShowAll: () => void;
}) {
  const t = useTranslations('business.publicProfile.listings');
  if (query.isPending) return <Skeleton label={t('loading')} />;
  if (query.isError && !query.data)
    return (
      <ErrorState
        headingLevel="h2"
        title={t('errorTitle')}
        message={t('errorMessage')}
        action={
          <Button variant="outline" onClick={() => void query.refetch()}>
            {t('retry')}
          </Button>
        }
      />
    );
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  if (items.length === 0)
    return (
      <EmptyState
        headingLevel="h2"
        icon="🔎"
        title={t('filterEmptyTitle')}
        message={t('filterEmptyMessage')}
        action={
          filtered ? (
            <Button variant="outline" onClick={onShowAll}>
              {t('showAll')}
            </Button>
          ) : null
        }
      />
    );
  return (
    <div className="grid gap-stack-gap">
      <p role="status" className="sr-only">
        {t('showing', { count: items.length })}
      </p>
      <ExploreCards
        tab={segment}
        items={items}
        locale={locale}
        categories={categories}
      />
      {query.isFetchNextPageError && (
        <p role="alert" className="m-0 flex flex-wrap items-center justify-center gap-3 text-small text-error">
          <span aria-hidden="true">⚠</span>
          {t('moreError')}
          <Button variant="text" size="small" onClick={() => void query.fetchNextPage()}>
            {t('retry')}
          </Button>
        </p>
      )}
      {query.hasNextPage && !query.isFetchNextPageError && (
        <Button
          variant="outline"
          className="justify-self-center"
          loading={query.isFetchingNextPage}
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {query.isFetchingNextPage ? t('loadingMore') : t('loadMore')}
        </Button>
      )}
    </div>
  );
}
