'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { AdminOrderFilter, AdminOrderPage } from '@apnatown/shared/orders';
import { Card } from '@apnatown/ui/cards/Card';
import { buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import {
  ModeBadge,
  OrderStatusBadge,
  useIstDateTime,
  useLocalName,
  useMoney,
  usePaymentLabel,
} from '../../owner-orders';
import { adminOrderHref } from './queries';

type Item = AdminOrderPage['items'][number];

function OpenLink({ item, filter }: { item: Item; filter: AdminOrderFilter }) {
  const t = useTranslations('admin.orders');
  return (
    <Link
      href={adminOrderHref(item.id, filter)}
      className={buttonVariantClassName('primary', 'card')}
    >
      {t('open')}
      <span className="sr-only">: {item.orderNumber}</span>
    </Link>
  );
}

/** Desktop table (prototype `tbl`): Order, Business, Mode, Status, Total,
 * Payment, Placed. Customer identity is not in the list projection. */
export function AdminOrdersTable({
  items,
  filter,
}: {
  items: Item[];
  filter: AdminOrderFilter;
}) {
  const t = useTranslations('admin.orders');
  const name = useLocalName();
  const money = useMoney();
  const time = useIstDateTime();
  const payment = usePaymentLabel();
  const head = 'px-3 py-3 text-start text-small font-semibold text-text';
  const cell = 'px-3 py-3 [overflow-wrap:anywhere]';
  return (
    <Card className="hidden desktop:block">
      <table className="w-full border-collapse text-small">
        <caption className="sr-only">
          {t('tableCaption', { filter: t(`filters.${filter}`) })}
        </caption>
        <thead className="bg-primary-soft">
          <tr>
            {(
              [
                'order',
                'business',
                'mode',
                'status',
                'total',
                'payment',
                'placed',
              ] as const
            ).map((column) => (
              <th key={column} scope="col" className={head}>
                {t(`columns.${column}`)}
              </th>
            ))}
            <th scope="col" className={head}>
              <span className="sr-only">{t('columns.action')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-border">
              <th
                scope="row"
                className="px-3 py-3 text-start font-semibold"
                dir="ltr"
              >
                {item.orderNumber}
              </th>
              <td className={cell}>{name(item.business)}</td>
              <td className={cell}>
                <ModeBadge mode={item.mode} />
              </td>
              <td className={cell}>
                <OrderStatusBadge status={item.status} mode={item.mode} />
              </td>
              <td className="px-3 py-3">{money(item.orderedTotalPaise)}</td>
              <td className={cell}>
                {payment(item.paymentMethod, item.paymentStatus, item.mode)}
              </td>
              <td className="px-3 py-3">
                <time dateTime={item.placedAt}>{time(item.placedAt)}</time>
              </td>
              <td className="px-3 py-3 text-end">
                <OpenLink item={item} filter={filter} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

/** Mobile labelled cards (hidden on desktop, where the table is shown). */
export function AdminOrderCards({
  items,
  filter,
}: {
  items: Item[];
  filter: AdminOrderFilter;
}) {
  const t = useTranslations('admin.orders');
  const name = useLocalName();
  const money = useMoney();
  const time = useIstDateTime();
  const payment = usePaymentLabel();
  const row = 'flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1';
  return (
    <ul className="m-0 grid list-none gap-3 p-0 desktop:hidden">
      {items.map((item) => (
        <li key={item.id}>
          <Card padded className="grid gap-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <span className="font-semibold" dir="ltr">
                {item.orderNumber}
              </span>
              <OrderStatusBadge status={item.status} mode={item.mode} />
            </div>
            <dl className="m-0 grid gap-2 text-small">
              <div className={row}>
                <dt className="text-text-2">{t('columns.business')}</dt>
                <dd className="m-0 min-w-0 text-end [overflow-wrap:anywhere]">
                  {name(item.business)}
                </dd>
              </div>
              <div className={row}>
                <dt className="text-text-2">{t('columns.mode')}</dt>
                <dd className="m-0">
                  <ModeBadge mode={item.mode} />
                </dd>
              </div>
              <div className={row}>
                <dt className="text-text-2">{t('columns.total')}</dt>
                <dd className="m-0 font-semibold">
                  {money(item.orderedTotalPaise)}
                </dd>
              </div>
              <div className={row}>
                <dt className="text-text-2">{t('columns.payment')}</dt>
                <dd className="m-0 min-w-0 text-end [overflow-wrap:anywhere]">
                  {payment(item.paymentMethod, item.paymentStatus, item.mode)}
                </dd>
              </div>
              <div className={row}>
                <dt className="text-text-2">{t('columns.placed')}</dt>
                <dd className="m-0">
                  <time dateTime={item.placedAt}>{time(item.placedAt)}</time>
                </dd>
              </div>
            </dl>
            <div className="flex justify-end">
              <OpenLink item={item} filter={filter} />
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
