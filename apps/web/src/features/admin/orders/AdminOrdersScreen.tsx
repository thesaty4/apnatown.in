'use client';

import { useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  ADMIN_ORDER_FILTERS,
  type AdminOrderFilter,
} from '@apnatown/shared/orders';
import { Card } from '@apnatown/ui/cards/Card';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
} from '@apnatown/ui/feedback/StateViews';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { Button } from '@apnatown/ui/primitives/Button';
import { Chip } from '@apnatown/ui/primitives/Chip';
import type { AdminMe } from '@apnatown/shared/admin';
import { failureCode } from '../../../shared/api/result';
import { useAdmin } from '../AdminShell';
import { AdminFailure, adminErrorKey, isDenied } from '../parts';
import { AdminOrderCards, AdminOrdersTable } from './AdminOrdersTable';
import {
  UNAVAILABLE_FILTERS,
  adminOrderKeys,
  adminOrdersHref,
  adminOrdersOptions,
  readOrderFilter,
} from './queries';

/** Admins with `orders:view` (any area grant) or a super admin. */
export const canViewOrders = (me: AdminMe) =>
  me.isSuper || me.permissions.orders.includes('view');

/** S-ADMN-07: filter chips in the URL, newest first, keyset "Load more". */
export function AdminOrdersScreen() {
  const context = useAdmin();
  const { me, scope, recheck } = context;
  const t = useTranslations('admin.orders');
  const ts = useTranslations('admin.state');
  const te = useTranslations('admin.errors');
  const client = useQueryClient();
  const router = useRouter();
  const params = useSearchParams();
  const filter = readOrderFilter(params.get('filter'));
  const permitted = canViewOrders(me);
  const [navigating, startTransition] = useTransition();

  const list = useInfiniteQuery({
    ...adminOrdersOptions(context, filter),
    enabled: permitted,
  });
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const code = list.isError ? failureCode(list.error) : undefined;
  const denied = Boolean(code && isDenied(code));

  // A denial re-reads authority; protected rows never outlive lost access.
  useEffect(() => {
    if (denied) recheck();
    if (!permitted || denied)
      client.removeQueries({ queryKey: adminOrderKeys.root(scope) });
  }, [client, denied, permitted, recheck, scope]);

  const navigate = (next: AdminOrderFilter) => {
    if (next === filter) return;
    startTransition(() =>
      router.push(adminOrdersHref(next), { scroll: false }),
    );
  };

  let body;
  if (!permitted || denied)
    body = (
      <NoPermissionState
        headingLevel="h2"
        title={ts('forbiddenTitle')}
        message={code ? te(adminErrorKey(code)) : t('noPermission')}
        action={<Button onClick={recheck}>{ts('checkAgain')}</Button>}
      />
    );
  else if (list.isPending)
    body = (
      <Card padded>
        <Skeleton label={ts('loading')} />
      </Card>
    );
  else if (code && !list.data)
    body = (
      <ErrorState
        headingLevel="h2"
        title={t('loadErrorTitle')}
        message={te(adminErrorKey(code))}
        action={
          <Button loading={list.isFetching} onClick={() => void list.refetch()}>
            {ts('retry')}
          </Button>
        }
      />
    );
  else if (!items.length)
    body = UNAVAILABLE_FILTERS.has(filter) ? (
      <EmptyState
        headingLevel="h2"
        icon="🧾"
        title={t('unavailableTitle')}
        message={t('unavailableMessage')}
        action={
          <Button variant="outline" onClick={() => navigate('all')}>
            {t('showAll')}
          </Button>
        }
      />
    ) : (
      <EmptyState
        headingLevel="h2"
        icon="📦"
        title={t('emptyTitle')}
        message={t(filter === 'active' ? 'emptyActiveMessage' : 'emptyMessage')}
        action={null}
      />
    );
  else
    body = (
      <div className="grid gap-3">
        {code && (
          <AdminFailure
            code={code}
            busy={list.isFetching}
            retry={() => void list.refetch()}
          />
        )}
        <AdminOrdersTable items={items} filter={filter} />
        <AdminOrderCards items={items} filter={filter} />
        {list.hasNextPage && (
          <Button
            variant="outline"
            className="justify-self-center"
            loading={list.isFetchingNextPage}
            onClick={() => void list.fetchNextPage()}
          >
            {list.isFetchNextPageError ? ts('retry') : t('loadMore')}
          </Button>
        )}
      </div>
    );

  return (
    <section className="grid min-w-0 gap-stack-gap">
      <h1 className="m-0 font-display text-h1 desktop:text-h1-desktop">
        {t('title')}
      </h1>
      <div
        role="group"
        aria-label={t('filterLabel')}
        className="flex gap-2 overflow-x-auto pb-1 tablet:flex-wrap"
      >
        {ADMIN_ORDER_FILTERS.map((value) => (
          <Chip
            key={value}
            className="shrink-0"
            label={t(`filters.${value}`)}
            selected={value === filter}
            onClick={() => navigate(value)}
          />
        ))}
      </div>
      <div
        aria-busy={navigating || (list.isFetching && !list.isFetchingNextPage)}
        className="grid min-w-0 gap-stack-gap"
      >
        {body}
      </div>
    </section>
  );
}
