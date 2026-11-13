'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { BusinessKind } from '@apnatown/shared/businesses';
import type {
  BusinessOrderPage,
  BusinessOrderTab,
} from '@apnatown/shared/orders';
import { Card } from '@apnatown/ui/cards/Card';
import { dashboardBase } from '../businesses/parts';
import {
  ModeBadge,
  OrderStatusBadge,
  useIstDateTime,
  useItemSummary,
  useMoney,
  usePaymentLabel,
} from './parts';

type OrderCardItem = BusinessOrderPage['items'][number];

export const ordersHref = (kind: BusinessKind, tab: BusinessOrderTab) =>
  `${dashboardBase(kind)}/orders${tab === 'new' ? '' : `?tab=${tab}`}`;

/** The tab rides along so "All orders" returns to the same queue tab. */
export const orderHref = (
  kind: BusinessKind,
  id: string,
  tab: BusinessOrderTab,
) => `${dashboardBase(kind)}/orders/${id}${tab === 'new' ? '' : `?tab=${tab}`}`;

/** Labelled order card (prototype table row; mobile-first card). */
export function OrderCard({
  kind,
  tab,
  order,
}: {
  kind: BusinessKind;
  tab: BusinessOrderTab;
  order: OrderCardItem;
}) {
  const t = useTranslations('ownerOrders.list');
  const time = useIstDateTime();
  const money = useMoney();
  const summary = useItemSummary();
  const payment = usePaymentLabel();
  return (
    <Link
      href={orderHref(kind, order.id, tab)}
      aria-label={t('openOrder', { number: order.orderNumber })}
      className="block min-w-0 rounded-lg text-text focus-visible:ring-focus"
    >
      <Card
        padded
        className="grid min-w-0 gap-2 transition-colors duration-2 ease-standard hover:bg-surface-2 motion-reduce:transition-none"
      >
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
          <div className="grid min-w-0 gap-0.5">
            <span className="font-semibold" dir="ltr">
              {order.orderNumber}
            </span>
            <time dateTime={order.placedAt} className="text-caption text-muted">
              {time(order.placedAt)}
            </time>
          </div>
          <OrderStatusBadge status={order.status} mode={order.mode} />
        </div>
        <p className="m-0 text-small text-text-2 [overflow-wrap:anywhere]">
          <span className="font-semibold text-text">
            {order.customerFirstName ?? t('customerUnknown')}
          </span>
          {' · '}
          {summary(order.itemSummary)}
          {' · '}
          {t('itemCount', { count: order.itemCount })}
        </p>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <ModeBadge mode={order.mode} />
            <span className="text-caption text-text-2 [overflow-wrap:anywhere]">
              {payment(order.paymentMethod, order.paymentStatus, order.mode)}
            </span>
          </div>
          <span className="font-semibold">
            {money(order.orderedTotalPaise)}
          </span>
        </div>
      </Card>
    </Link>
  );
}
