'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ProductOwnerListItem } from '@apnatown/shared/products';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
  OfflineState,
} from '@apnatown/ui/feedback/StateViews';
import { Button, buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../../shared/api/result';
import { useOnline } from '../../../shared/hooks/use-online';
import { Alert } from '../../businesses/parts';
import { productDeniedCodes, productErrorKey } from './errors';
import { RowsSkeleton } from './parts';
import { ProductTable, type RowProps } from './ProductTable';
import type { useProductList } from './queries';

/** Every list state: skeleton, offline, denied, error+retry, helpful empty,
 * no-results, refresh failure over stale rows and keyset "Load more". */
export function ListBody({
  list,
  items,
  filtered,
  onClear,
  onImport,
  addHref,
  table,
}: {
  list: ReturnType<typeof useProductList>;
  items: ProductOwnerListItem[];
  filtered: boolean;
  onClear: () => void;
  onImport: () => void;
  addHref: string;
  table: RowProps;
}) {
  const t = useTranslations('products.list');
  const te = useTranslations('products.errors');
  const online = useOnline();
  const retry = (
    <Button disabled={list.isFetching} onClick={() => void list.refetch()}>
      {t('retry')}
    </Button>
  );

  if (list.isPending) {
    if (list.fetchStatus === 'paused' || !online)
      return (
        <OfflineState
          headingLevel="h2"
          icon="📡"
          title={t('offlineTitle')}
          message={t('offlineMessage')}
          action={null}
        />
      );
    return <RowsSkeleton label={t('loading')} />;
  }

  if (list.isError && !list.data) {
    const code = failureCode(list.error);
    if (productDeniedCodes.has(code))
      return (
        <NoPermissionState
          headingLevel="h2"
          icon="🔒"
          title={t('forbiddenTitle')}
          message={te('forbidden')}
          action={null}
        />
      );
    if (!online)
      return (
        <OfflineState
          headingLevel="h2"
          icon="📡"
          title={t('offlineTitle')}
          message={t('offlineMessage')}
          action={retry}
        />
      );
    return (
      <ErrorState
        headingLevel="h2"
        icon="⚠️"
        title={t('errorTitle')}
        message={te(productErrorKey(code))}
        action={retry}
      />
    );
  }

  return (
    <div className="grid min-w-0 gap-3">
      {list.isRefetchError && (
        <Alert
          tone="warn"
          role="alert"
          action={
            <Button
              size="small"
              variant="outline"
              disabled={list.isFetching}
              onClick={() => void list.refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {online ? t('refreshFailed') : t('offlineMessage')}
        </Alert>
      )}
      {items.length === 0 ? (
        filtered ? (
          <EmptyState
            headingLevel="h2"
            icon="🔍"
            title={t('noResultsTitle')}
            message={t('noResultsMessage')}
            action={
              <Button variant="outline" onClick={onClear}>
                {t('clearFilters')}
              </Button>
            }
          />
        ) : (
          <EmptyState
            headingLevel="h2"
            icon="🏷️"
            title={t('emptyTitle')}
            message={t('emptyMessage')}
            action={
              <span className="flex flex-wrap justify-center gap-2">
                <Link href={addHref} className={buttonVariantClassName('primary')}>
                  {t('add')}
                </Link>
                <Button variant="ghost" onClick={onImport}>
                  {t('bulkImport')}
                </Button>
              </span>
            }
          />
        )
      ) : (
        <ProductTable {...table} />
      )}
      {list.isFetchNextPageError && (
        <Alert tone="bad" role="alert">
          {t('loadMoreFailed')}
        </Alert>
      )}
      {list.hasNextPage && (
        <Button
          variant="outline"
          className="justify-self-center"
          loading={list.isFetchingNextPage}
          onClick={() => void list.fetchNextPage()}
        >
          {t('loadMore')}
        </Button>
      )}
    </div>
  );
}
