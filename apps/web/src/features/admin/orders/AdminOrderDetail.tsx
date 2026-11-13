'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { OrderDetail } from '@apnatown/shared/orders';
import { Card } from '@apnatown/ui/cards/Card';
import {
  ErrorState,
  NoPermissionState,
} from '@apnatown/ui/feedback/StateViews';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { Button, buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../../shared/api/result';
import { NavIcon } from '../../../shared/ui/NavIcon';
import {
  ModeBadge,
  OrderItemsCard,
  OrderStatusBadge,
  OrderTimeline,
  useIstDateTime,
  useLocalName,
} from '../../owner-orders';
import { useAdmin } from '../AdminShell';
import { adminErrorKey, isDenied } from '../parts';
import { canViewOrders } from './AdminOrdersScreen';
import {
  adminOrderKeys,
  adminOrderOptions,
  adminOrdersHref,
  readOrderFilter,
} from './queries';

/** S-ADMN-08 read-only order detail; case/refund/rider tools are stated as
 * not available yet (no fake workflow, notes or "mark refunded"). */
export function AdminOrderDetailScreen({ id }: { id: string }) {
  const context = useAdmin();
  const { me, scope, recheck } = context;
  const t = useTranslations('admin.orders');
  const ts = useTranslations('admin.state');
  const te = useTranslations('admin.errors');
  const client = useQueryClient();
  const params = useSearchParams();
  const filter = readOrderFilter(params.get('filter'));
  const permitted = canViewOrders(me);
  const order = useQuery({
    ...adminOrderOptions(context, id),
    enabled: permitted,
  });
  const code = order.isError ? failureCode(order.error) : undefined;
  const denied = Boolean(code && isDenied(code));

  useEffect(() => {
    if (denied) recheck();
    if (!permitted || denied)
      client.removeQueries({ queryKey: adminOrderKeys.root(scope) });
  }, [client, denied, permitted, recheck, scope]);

  let body;
  if (!permitted || denied)
    body = (
      <NoPermissionState
        title={ts('forbiddenTitle')}
        message={code ? te(adminErrorKey(code)) : t('noPermission')}
        action={<Button onClick={recheck}>{ts('checkAgain')}</Button>}
      />
    );
  else if (order.data) body = <Loaded order={order.data} />;
  else if (order.isPending) body = <Skeleton label={ts('loading')} />;
  // Out-of-scope orders are indistinguishable from missing ones.
  else if (code === 'ORDER_NOT_FOUND')
    body = (
      <NoPermissionState
        icon="🔒"
        title={t('notFoundTitle')}
        message={t('notFoundMessage')}
        action={null}
      />
    );
  else
    body = (
      <ErrorState
        title={t('loadErrorTitle')}
        message={te(adminErrorKey(code ?? 'REQUEST_FAILED'))}
        action={
          <Button
            loading={order.isFetching}
            onClick={() => void order.refetch()}
          >
            {ts('retry')}
          </Button>
        }
      />
    );

  return (
    <section className="grid min-w-0 gap-stack-gap">
      <Link
        href={adminOrdersHref(filter)}
        className={`${buttonVariantClassName('text', 'small')} justify-self-start`}
      >
        <NavIcon name="cl" className="size-4" />
        {t('back')}
      </Link>
      {body}
    </section>
  );
}

function Loaded({ order }: { order: OrderDetail }) {
  const t = useTranslations('admin.orders');
  const td = useTranslations('ownerOrders.detail');
  const time = useIstDateTime();
  const name = useLocalName();
  const area = order.business.areaNameEn
    ? name({
        nameEn: order.business.areaNameEn,
        nameHi: order.business.areaNameHi,
      })
    : null;
  return (
    <>
      <header className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <h1
            className="m-0 font-display text-h1 desktop:text-h1-desktop"
            dir="ltr"
          >
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
          <Card padded className="grid gap-3">
            <h2 className="m-0 text-h3">{t('orderFacts')}</h2>
            <dl className="m-0 grid gap-x-4 gap-y-2 tablet:grid-cols-[max-content_1fr]">
              <dt className="text-small text-muted">{t('columns.business')}</dt>
              <dd className="m-0 [overflow-wrap:anywhere]">
                {name(order.business)}
                {area && <span className="text-text-2"> · {area}</span>}
              </dd>
              <dt className="text-small text-muted">{td('customer')}</dt>
              <dd className="m-0 [overflow-wrap:anywhere]">
                {order.customer?.firstName ?? td('notShared')}
              </dd>
              {order.mode === 'delivery' && order.deliveryMethod && (
                <>
                  <dt className="text-small text-muted">{td('deliveryBy')}</dt>
                  <dd className="m-0">
                    {td(
                      order.deliveryMethod === 'self'
                        ? 'deliverySelf'
                        : 'deliveryRider',
                    )}
                  </dd>
                </>
              )}
            </dl>
          </Card>
          <OrderTimeline order={order} />
        </div>
        <div className="grid min-w-0 gap-4">
          {order.fulfilmentNotice === 'rider_dispatch_unavailable' && (
            <p
              role="note"
              className="m-0 flex gap-2 rounded-md border border-info bg-info-soft p-3 text-small"
            >
              <span aria-hidden="true">🛵</span>
              <span className="min-w-0">{t('riderDispatchUnavailable')}</span>
            </p>
          )}
          {(['caseWorkflow', 'refund', 'rider'] as const).map((key) => (
            <Card key={key} padded className="grid gap-2">
              <h2 className="m-0 text-h3">{t(`tools.${key}.title`)}</h2>
              <p className="m-0 text-small text-text-2">
                {t(`tools.${key}.body`)}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
