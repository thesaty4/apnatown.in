'use client';

import Link from 'next/link';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import type { CustomerOrderPage } from '@apnatown/shared/orders';
import { Card } from '@apnatown/ui/cards/Card';
import { formatMoney } from '@apnatown/shared/formatters';
import { OrderModeBadge, OrderStatusBadge } from './OrderStatusBadge';

type OrderCardData = CustomerOrderPage['items'][number];

/** S-CUST-13 order card: number, status, shop, item summary, IST date,
 * total and mode. The whole card is one link to the detail. */
export function OrderCard({ order }: { order: OrderCardData }) {
  const t = useTranslations('orders.list');
  const format = useFormatter();
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const name = (value: { nameEn: string; nameHi: string | null }) =>
    (locale === 'hi' && value.nameHi) || value.nameEn;
  const summary = order.itemSummary;
  return (
    <Link
      href={`/orders/${order.id}`}
      className="block rounded-lg focus-visible:ring-focus"
    >
      <Card padded className="grid h-full gap-2 hover:shadow-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <b>{order.orderNumber}</b>
          <OrderStatusBadge status={order.status} mode={order.mode} />
        </div>
        <div className="grid min-w-0 gap-0.5">
          <b className="[overflow-wrap:anywhere]">{name(order.business)}</b>
          <span className="text-small text-text-2 [overflow-wrap:anywhere]">
            {summary.moreCount > 0
              ? t('summaryMore', {
                  name: name(summary),
                  count: summary.moreCount,
                })
              : name(summary)}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-small">
          <time dateTime={order.placedAt}>
            {format.dateTime(new Date(order.placedAt), {
              dateStyle: 'medium',
              timeStyle: 'short',
              timeZone: 'Asia/Kolkata',
            })}
          </time>
          <b>{formatMoney(order.orderedTotalPaise, locale)}</b>
        </div>
        <span className="justify-self-start">
          <OrderModeBadge mode={order.mode} />
        </span>
      </Card>
    </Link>
  );
}
