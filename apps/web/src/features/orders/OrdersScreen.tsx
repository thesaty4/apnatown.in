'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import type { CustomerOrderGroup } from '@apnatown/shared/orders';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
  OfflineState,
} from '@apnatown/ui/feedback/StateViews';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { Button, buttonClassName } from '@apnatown/ui/primitives/Button';
import { AccessState } from '../../shared/auth/AccessState';
import { useOnline } from '../../shared/hooks/use-online';
import { publicHref } from '../../shared/i18n/preferences';
import { isForbidden } from './errors';
import { OrderCard } from './OrderCard';
import { ORDERS_PANEL_ID, OrderTabs, orderTabId } from './OrderTabs';
import { useCustomerOrders, useOrdersScope } from './queries';

/** S-CUST-13 My orders. The URL `?group=` owns the tab; Back restores it. */
export function OrdersScreen({ group }: { group: CustomerOrderGroup }) {
  const t = useTranslations('orders.list');
  const { scope } = useOrdersScope();
  return (
    <div className="grid gap-4">
      <h1 className="m-0 text-h1 desktop:text-h1-desktop">{t('title')}</h1>
      {scope ? (
        <OrderList group={group} />
      ) : (
        <AccessState guest guestMessage={t('loginMessage')} />
      )}
    </div>
  );
}

function OrderList({ group }: { group: CustomerOrderGroup }) {
  const t = useTranslations('orders.list');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const online = useOnline();
  const query = useCustomerOrders(group);
  const home = publicHref('/', locale);
  const counts = query.data?.pages[0]?.counts;

  let panel;
  if (query.isPending)
    panel = online ? (
      <Skeleton label={t('loading')} />
    ) : (
      <OfflineState
        headingLevel="h2"
        title={t('offline.title')}
        message={t('offline.message')}
        action={null}
      />
    );
  else if (query.isError && !query.data)
    panel = isForbidden(query.error) ? (
      <NoPermissionState
        headingLevel="h2"
        title={t('denied.title')}
        message={t('denied.message')}
        action={
          <Link className={buttonClassName} href={home}>
            {t('denied.action')}
          </Link>
        }
      />
    ) : (
      <ErrorState
        headingLevel="h2"
        title={t(online ? 'error.title' : 'offline.title')}
        message={t(online ? 'error.message' : 'offline.message')}
        action={
          <Button
            loading={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {t('error.retry')}
          </Button>
        }
      />
    );
  else {
    const items = query.data?.pages.flatMap((page) => page.items) ?? [];
    panel =
      items.length === 0 ? (
        <EmptyState
          headingLevel="h2"
          icon="📦"
          title={t(`empty.${group}`)}
          message={t('empty.message')}
          action={
            <Link className={buttonClassName} href={home}>
              {t('empty.action')}
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4">
          <ul className="m-0 grid list-none gap-3 p-0 tablet:grid-cols-2 wide:grid-cols-3">
            {items.map((order) => (
              <li key={order.id} className="min-w-0">
                <OrderCard order={order} />
              </li>
            ))}
          </ul>
          {query.hasNextPage && (
            <Button
              variant="outline"
              className="justify-self-center"
              loading={query.isFetchingNextPage}
              disabled={!online}
              onClick={() => void query.fetchNextPage()}
            >
              {t('loadMore')}
            </Button>
          )}
          {query.isFetchNextPageError && (
            <p role="alert" className="m-0 text-center text-small text-error">
              {t('loadMoreError')}
            </p>
          )}
        </div>
      );
  }

  return (
    <div className="grid gap-4">
      <OrderTabs group={group} counts={counts} />
      <div
        id={ORDERS_PANEL_ID}
        role="tabpanel"
        aria-labelledby={orderTabId(group)}
        aria-busy={query.isFetching || undefined}
      >
        {panel}
      </div>
    </div>
  );
}
