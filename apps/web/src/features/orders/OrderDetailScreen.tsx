'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import { Card } from '@apnatown/ui/cards/Card';
import {
  ErrorState,
  NoPermissionState,
  NotFoundState,
  OfflineState,
} from '@apnatown/ui/feedback/StateViews';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import {
  Button,
  buttonClassName,
  buttonVariantClassName,
} from '@apnatown/ui/primitives/Button';
import { AccessState } from '../../shared/auth/AccessState';
import { useOnline } from '../../shared/hooks/use-online';
import { NavIcon } from '../../shared/ui/NavIcon';
import { CancelOrderSheet } from './CancelOrderSheet';
import { isForbidden, isMissing } from './errors';
import { HandoverCodeCard } from './HandoverCodeCard';
import { OrderActionsCard } from './OrderActionsCard';
import { OrderFulfilmentCard } from './OrderFulfilmentCard';
import { OrderModeBadge, OrderStatusBadge } from './OrderStatusBadge';
import { OrderSummaryCard } from './OrderSummaryCard';
import { OrderTimeline } from './OrderTimeline';
import { useCustomerOrder, useOrdersScope } from './queries';

/** S-CUST-14 Order detail and tracking (customer view). */
export function OrderDetailScreen({ orderId }: { orderId: string | null }) {
  const t = useTranslations('orders.detail');
  const { scope } = useOrdersScope();
  return (
    <div className="grid gap-4">
      <Link
        href="/orders"
        className={`${buttonVariantClassName('text', 'small')} justify-self-start`}
      >
        <NavIcon name="cl" className="size-4 rtl:-scale-x-100" />
        {t('back')}
      </Link>
      {!scope ? (
        <AccessState guest guestMessage={t('loginMessage')} />
      ) : orderId ? (
        <OrderDetailView orderId={orderId} />
      ) : (
        <Missing />
      )}
    </div>
  );
}

function Missing() {
  const t = useTranslations('orders.detail');
  return (
    <NotFoundState
      title={t('missing.title')}
      message={t('missing.message')}
      action={
        <Link className={buttonClassName} href="/orders">
          {t('missing.action')}
        </Link>
      }
    />
  );
}

function OrderDetailView({ orderId }: { orderId: string }) {
  const t = useTranslations('orders.detail');
  const format = useFormatter();
  const online = useOnline();
  const query = useCustomerOrder(orderId);
  const [cancelling, setCancelling] = useState(false);
  const [notice, setNotice] = useState('');

  if (query.isPending)
    return online ? (
      <Skeleton label={t('loading')} />
    ) : (
      <OfflineState
        title={t('offline.title')}
        message={t('offline.message')}
        action={null}
      />
    );
  if (query.isError && !query.data) {
    if (isMissing(query.error)) return <Missing />;
    if (isForbidden(query.error))
      return (
        <NoPermissionState
          title={t('denied.title')}
          message={t('denied.message')}
          action={
            <Link className={buttonClassName} href="/orders">
              {t('missing.action')}
            </Link>
          }
        />
      );
    return (
      <ErrorState
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
  }

  const order = query.data;
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="m-0 text-h1 desktop:text-h1-desktop">
            {t('title', { number: order.orderNumber })}
          </h1>
          <time dateTime={order.placedAt} className="text-small text-muted">
            {format.dateTime(new Date(order.placedAt), {
              dateStyle: 'medium',
              timeStyle: 'short',
              timeZone: 'Asia/Kolkata',
            })}
          </time>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OrderModeBadge mode={order.mode} />
          <OrderStatusBadge status={order.status} mode={order.mode} />
        </div>
      </div>
      <p
        role="status"
        aria-live="polite"
        className={notice ? 'm-0 text-small font-semibold' : 'sr-only'}
      >
        {notice}
      </p>
      <div className="grid items-start gap-4 desktop:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="grid min-w-0 gap-4">
          <Card padded>
            <OrderTimeline order={order} />
          </Card>
          <HandoverCodeCard order={order} />
          <OrderFulfilmentCard order={order} />
        </div>
        <div className="grid min-w-0 gap-4">
          <OrderSummaryCard order={order} />
          <OrderActionsCard
            order={order}
            onCancel={() => {
              setNotice('');
              setCancelling(true);
            }}
          />
        </div>
      </div>
      <CancelOrderSheet
        order={order}
        open={cancelling}
        onOpenChange={setCancelling}
        onCancelled={() => {
          setCancelling(false);
          setNotice(t('cancelled'));
        }}
      />
    </div>
  );
}
