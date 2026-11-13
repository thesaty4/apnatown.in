'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@apnatown/ui/cards/Card';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
  OfflineState,
} from '@apnatown/ui/feedback/StateViews';
import { Button } from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../../shared/api/result';
import { Alert, deniedCodes } from '../../businesses/parts';
import type { useOwnerServices } from './queries';

type ListQuery = ReturnType<typeof useOwnerServices>;

/**
 * Read states around the service rows: skeleton, offline, no-permission,
 * error+retry, helpful empty (prototype 🔧) and keyset "Load more".
 */
export function ServicesListBody({
  list,
  online,
  count,
  errorMessage,
  emptyAction,
  children,
}: {
  list: ListQuery;
  online: boolean;
  count: number;
  errorMessage: (code: string) => string;
  emptyAction: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations('service.manager');
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
    return <ServicesSkeleton label={t('loading')} />;
  }

  if (list.isError && !list.data) {
    const code = failureCode(list.error);
    if (deniedCodes.has(code))
      return (
        <NoPermissionState
          headingLevel="h2"
          icon="🔒"
          title={t('forbiddenTitle')}
          message={t('forbiddenMessage')}
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
        message={errorMessage(code)}
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
      {count === 0 ? (
        <EmptyState
          headingLevel="h2"
          icon="🔧"
          title={t('emptyTitle')}
          message={t('emptyMessage')}
          action={emptyAction}
        />
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0">{children}</ul>
      )}
      {list.hasNextPage && (
        <div className="grid justify-items-center gap-2">
          {list.isFetchNextPageError && (
            <p role="alert" className="m-0 text-small text-error">
              {t('loadMoreFailed')}
            </p>
          )}
          <Button
            variant="outline"
            disabled={!online}
            loading={list.isFetchingNextPage}
            onClick={() => void list.fetchNextPage()}
          >
            {list.isFetchNextPageError ? t('retry') : t('loadMore')}
          </Button>
        </div>
      )}
    </div>
  );
}

function ServicesSkeleton({ label }: { label: string }) {
  const bar =
    'rounded-sm skeleton-fill animate-skeleton motion-reduce:animate-none';
  return (
    <div role="status" aria-busy="true" className="grid gap-3">
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((row) => (
        <Card
          key={row}
          padded
          aria-hidden="true"
          className="flex items-start gap-3"
        >
          <div className="grid min-w-0 flex-1 gap-2">
            <div className={`h-4 w-2/5 ${bar}`} />
            <div className={`h-3 w-3/5 ${bar}`} />
            <div className={`h-5 w-24 rounded-pill ${bar}`} />
          </div>
          <div className={`h-8 w-20 ${bar}`} />
        </Card>
      ))}
    </div>
  );
}
