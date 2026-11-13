'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { BusinessKind, BusinessOwner } from '@apnatown/shared/businesses';
import type { OrderDetail } from '@apnatown/shared/orders';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import {
  ErrorState,
  NoPermissionState,
  OfflineState,
} from '@apnatown/ui/feedback/StateViews';
import { Button, buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../shared/api/result';
import { useOnline } from '../../shared/hooks/use-online';
import { NavIcon } from '../../shared/ui/NavIcon';
import { OwnerGate } from '../businesses/BusinessDashboard';
import { LockedNote, StatusBanner } from '../businesses/parts';
import { ORDER_DENIED_CODES, orderErrorKey } from './errors';
import { FulfilmentCard } from './FulfilmentCard';
import { OrderActions } from './OrderActions';
import { ordersHref } from './OrderCard';
import { OrderItemsCard, OrderTimeline } from './OrderSummary';
import { readTab } from './OrderTabs';
import { ModeBadge, OrderStatusBadge, useIstDateTime } from './parts';
import { useOwnerOrder } from './queries';

/** S-VEND-04 / S-PROV-05 order detail shared by vendor and provider. */
export function OwnerOrderDetailScreen({
  kind,
  id,
}: {
  kind: BusinessKind;
  id: string;
}) {
  return (
    <OwnerGate kind={kind}>
      {(business) => <DetailGate business={business} id={id} />}
    </OwnerGate>
  );
}

function BackLink({ kind }: { kind: BusinessKind }) {
  const t = useTranslations('ownerOrders.detail');
  const params = useSearchParams();
  return (
    <Link
      href={ordersHref(kind, readTab(params.get('tab')))}
      className={`${buttonVariantClassName('text', 'small')} justify-self-start`}
    >
      <NavIcon name="cl" className="size-4" />
      {t('back')}
    </Link>
  );
}

function DetailGate({ business, id }: { business: BusinessOwner; id: string }) {
  const t = useTranslations('ownerOrders.list');
  if (!business.capabilities.sell)
    return (
      <div className="grid min-w-0 gap-4">
        <BackLink kind={business.kind} />
        <h1 className="m-0 text-h1">{t('title')}</h1>
        <StatusBanner business={business} />
        <LockedNote />
      </div>
    );
  return <Detail kind={business.kind} id={id} />;
}

function Detail({ kind, id }: { kind: BusinessKind; id: string }) {
  const t = useTranslations('ownerOrders.detail');
  const te = useTranslations('ownerOrders.errors');
  const online = useOnline();
  const order = useOwnerOrder(kind, id, true);
  const retry = (
    <Button disabled={order.isFetching} onClick={() => void order.refetch()}>
      {t('retry')}
    </Button>
  );

  let body;
  if (order.data)
    body = (
      <Loaded
        kind={kind}
        order={order.data}
        reload={() => void order.refetch()}
        reloading={order.isFetching}
      />
    );
  else if (order.isPending)
    body =
      order.fetchStatus === 'paused' || !online ? (
        <OfflineState
          icon="📡"
          title={t('offlineTitle')}
          message={t('offlineMessage')}
          action={null}
        />
      ) : (
        <Skeleton label={t('loading')} />
      );
  else {
    const code = failureCode(order.error);
    // Another business's order is indistinguishable from a missing one.
    if (code === 'ORDER_NOT_FOUND' || ORDER_DENIED_CODES.has(code))
      body = (
        <NoPermissionState
          icon="🔒"
          title={t('notFoundTitle')}
          message={t('notFoundMessage')}
          action={null}
        />
      );
    else if (!online)
      body = (
        <OfflineState
          icon="📡"
          title={t('offlineTitle')}
          message={t('offlineMessage')}
          action={retry}
        />
      );
    else
      body = (
        <ErrorState
          icon="⚠️"
          title={t('errorTitle')}
          message={te(orderErrorKey(code))}
          action={retry}
        />
      );
  }
  return (
    <div className="grid min-w-0 gap-5">
      <BackLink kind={kind} />
      {body}
    </div>
  );
}

function Loaded({
  kind,
  order,
  reload,
  reloading,
}: {
  kind: BusinessKind;
  order: OrderDetail;
  reload: () => void;
  reloading: boolean;
}) {
  const time = useIstDateTime();
  return (
    <>
      <header className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <h1 className="m-0 text-h1" dir="ltr">
            {order.orderNumber}
          </h1>
          <time dateTime={order.placedAt} className="text-small text-muted">
            {time(order.placedAt)}
          </time>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ModeBadge mode={order.mode} />
          <OrderStatusBadge status={order.status} mode={order.mode} />
        </div>
      </header>
      <div className="grid min-w-0 gap-4 desktop:grid-cols-2 desktop:items-start">
        <div className="grid min-w-0 gap-4">
          <OrderItemsCard order={order} />
          <FulfilmentCard order={order} />
        </div>
        <div className="grid min-w-0 gap-4">
          <OrderActions
            kind={kind}
            order={order}
            reload={reload}
            reloading={reloading}
          />
          <OrderTimeline order={order} />
        </div>
      </div>
    </>
  );
}
