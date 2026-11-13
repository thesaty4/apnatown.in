'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useId, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import type { BusinessKind, BusinessOwner } from '@apnatown/shared/businesses';
import type { BusinessOrderTab } from '@apnatown/shared/orders';
import { Card } from '@apnatown/ui/cards/Card';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
  OfflineState,
} from '@apnatown/ui/feedback/StateViews';
import { Button } from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../shared/api/result';
import { useOnline } from '../../shared/hooks/use-online';
import { OwnerGate } from '../businesses/BusinessDashboard';
import { Alert, LockedNote, StatusBanner } from '../businesses/parts';
import { ORDER_DENIED_CODES, orderErrorKey } from './errors';
import { OrderCard, ordersHref } from './OrderCard';
import { OrderTabs, readTab, tabKey } from './OrderTabs';
import { useOwnerOrderCounts, useOwnerOrders } from './queries';

/** S-VEND-03 / S-PROV-04 order queue shared by vendor and provider. */
export function OwnerOrdersScreen({ kind }: { kind: BusinessKind }) {
  return (
    <OwnerGate kind={kind}>
      {(business) => <QueueGate business={business} />}
    </OwnerGate>
  );
}

function QueueGate({ business }: { business: BusinessOwner }) {
  const t = useTranslations('ownerOrders.list');
  // Not-approved owners keep limited access: banner + locked note, no reads.
  if (!business.capabilities.sell)
    return (
      <div className="grid min-w-0 gap-4">
        <h1 className="m-0 text-h1">{t('title')}</h1>
        <StatusBanner business={business} />
        <LockedNote />
      </div>
    );
  return <Queue kind={business.kind} />;
}

function Queue({ kind }: { kind: BusinessKind }) {
  const t = useTranslations('ownerOrders.list');
  const router = useRouter();
  const params = useSearchParams();
  const tab = readTab(params.get('tab'));
  const [navigating, startTransition] = useTransition();
  const tabsId = useId();
  const counts = useOwnerOrderCounts(kind, true);
  const fresh = counts.data?.new ?? 0;

  const navigate = (next: BusinessOrderTab) => {
    if (next === tab) return;
    startTransition(() =>
      router.push(ordersHref(kind, next), { scroll: false }),
    );
  };

  return (
    <div className="grid min-w-0 gap-4">
      <h1 className="m-0 text-h1">{t('title')}</h1>
      {fresh > 0 && (
        <Alert
          tone="warn"
          role="status"
          icon="🔔"
          title={t('newAlert', { count: fresh })}
          action={
            tab !== 'new' ? (
              <Button size="small" onClick={() => navigate('new')}>
                {t('newAlertAction')}
              </Button>
            ) : undefined
          }
        >
          <p className="m-0">{t('newAlertBody')}</p>
        </Alert>
      )}
      <OrderTabs
        id={tabsId}
        value={tab}
        counts={counts.data}
        onChange={navigate}
      />
      <div
        role="tabpanel"
        id={`${tabsId}-panel`}
        aria-labelledby={`${tabsId}-tab-${tab}`}
        aria-busy={navigating}
        className="grid min-w-0 gap-3"
      >
        <QueueBody kind={kind} tab={tab} />
      </div>
    </div>
  );
}

function QueueBody({
  kind,
  tab,
}: {
  kind: BusinessKind;
  tab: BusinessOrderTab;
}) {
  const t = useTranslations('ownerOrders.list');
  const te = useTranslations('ownerOrders.errors');
  const tt = useTranslations('ownerOrders.tabs');
  const online = useOnline();
  const list = useOwnerOrders(kind, tab, true);
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
    return <QueueSkeleton label={t('loading')} />;
  }

  if (list.isError && !list.data) {
    const code = failureCode(list.error);
    if (ORDER_DENIED_CODES.has(code))
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
        message={te(orderErrorKey(code))}
        action={retry}
      />
    );
  }

  const items = list.data.pages.flatMap((page) => page.items);
  return (
    <>
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
        <EmptyState
          headingLevel="h2"
          icon="📦"
          title={t('emptyTitle', { tab: tt(tabKey[tab]) })}
          message={t(tab === 'new' ? 'emptyNewMessage' : 'emptyMessage')}
          action={null}
        />
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0">
          {items.map((order) => (
            <li key={order.id} className="min-w-0">
              <OrderCard kind={kind} tab={tab} order={order} />
            </li>
          ))}
        </ul>
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
    </>
  );
}

function QueueSkeleton({ label }: { label: string }) {
  const bar =
    'rounded-sm skeleton-fill animate-skeleton motion-reduce:animate-none';
  return (
    <div role="status" aria-busy="true" className="grid gap-3">
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((row) => (
        <Card key={row} padded aria-hidden="true" className="grid gap-2">
          <div className={`h-4 w-1/4 ${bar}`} />
          <div className={`h-3 w-3/4 ${bar}`} />
          <div className={`h-3 w-1/2 ${bar}`} />
        </Card>
      ))}
    </div>
  );
}
