'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import type { OrderDetail } from '@apnatown/shared/orders';
import { formatMoney } from '@apnatown/shared/formatters';
import { Card } from '@apnatown/ui/cards/Card';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';
import { publicHref } from '../../shared/i18n/preferences';
import { NavIcon } from '../../shared/ui/NavIcon';
import { localName } from './format';
import { paymentMethodKey } from './status';

type Amounts = OrderDetail['orderedAmounts'];

const paymentTone = {
  pending: { tone: 'warn', icon: '⏳' },
  paid: { tone: 'ok', icon: '✓' },
  collected: { tone: 'ok', icon: '✓' },
  failed: { tone: 'bad', icon: '✕' },
  refunded: { tone: 'info', icon: '↺' },
} as const;

/** Business link, purchased items and the immutable ordered bill; a revised
 * fulfilled bill and current payable appear only when they differ. */
export function OrderSummaryCard({ order }: { order: OrderDetail }) {
  const t = useTranslations('orders.detail');
  const payment = useTranslations('orders.payment');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const money = (paise: number) => formatMoney(paise, locale);
  const { business } = order;
  const area = locale === 'hi' ? business.areaNameHi : business.areaNameEn;
  const profile = business.slug
    ? publicHref(
        `/${business.kind === 'provider' ? 'provider' : 'shop'}/${business.slug}`,
        locale,
      )
    : null;
  const revised =
    order.fulfilledAmounts.totalPaise !== order.orderedAmounts.totalPaise;
  const method =
    order.payment.method === 'cash'
      ? order.mode === 'pickup'
        ? 'cashPickup'
        : 'cashDelivery'
      : `method.${paymentMethodKey[order.payment.method]}`;
  const status = paymentTone[order.payment.status];
  const shop = (
    <span className="grid min-w-0 flex-1 gap-0.5">
      <b className="[overflow-wrap:anywhere]">{localName(business, locale)}</b>
      {(area ?? business.areaNameEn) && (
        <span className="text-caption text-muted [overflow-wrap:anywhere]">
          {area ?? business.areaNameEn}
        </span>
      )}
    </span>
  );
  return (
    <Card padded className="grid gap-3">
      {profile ? (
        <Link
          href={profile}
          className="flex min-h-touch items-center gap-2 rounded-sm focus-visible:ring-focus"
        >
          {shop}
          <NavIcon name="cr" className="size-5 shrink-0 rtl:-scale-x-100" />
        </Link>
      ) : (
        <div className="flex items-center gap-2">{shop}</div>
      )}
      <h2 className="sr-only">{t('items')}</h2>
      <ul className="m-0 grid list-none gap-2 p-0 text-small">
        {order.items.map((item) => (
          <li key={item.id} className="flex flex-wrap justify-between gap-x-3">
            <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
              {item.variantLabel
                ? t('lineVariant', {
                    name: localName(item, locale),
                    variant: item.variantLabel,
                    quantity: item.orderedQuantity,
                  })
                : t('line', {
                    name: localName(item, locale),
                    quantity: item.orderedQuantity,
                  })}
              {item.availability === 'unavailable' && (
                <span className="ms-2 inline-flex">
                  <StatusBadge tone="bad" icon="✕" label={t('unavailable')} />
                </span>
              )}
            </span>
            <span>{money(item.orderedLineTotalPaise)}</span>
          </li>
        ))}
      </ul>
      <AmountRows amounts={order.orderedAmounts} money={money} />
      {revised && (
        <dl className="m-0 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 text-small">
          <dt className="font-semibold">{t('revisedTotal')}</dt>
          <dd className="m-0 text-end font-semibold">
            {money(order.fulfilledAmounts.totalPaise)}
          </dd>
          <dt className="text-text-2">{t('currentPayable')}</dt>
          <dd className="m-0 text-end">{money(order.currentPayablePaise)}</dd>
        </dl>
      )}
      <div className="grid gap-1 border-t border-border pt-3">
        <h2 className="m-0 text-small font-semibold">{payment('title')}</h2>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>{payment(method)}</span>
          <StatusBadge
            tone={status.tone}
            icon={status.icon}
            label={payment(`status.${order.payment.status}`)}
          />
        </div>
        {order.payment.outstandingPaise > 0 && (
          <p className="m-0 text-small text-text-2">
            {payment(order.mode === 'pickup' ? 'duePickup' : 'dueDelivery', {
              amount: money(order.payment.outstandingPaise),
            })}
          </p>
        )}
      </div>
    </Card>
  );
}

function AmountRows({
  amounts,
  money,
}: {
  amounts: Amounts;
  money: (paise: number) => string;
}) {
  const t = useTranslations('orders.detail');
  return (
    <dl className="m-0 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 border-t border-border pt-3 text-small">
      <dt className="text-text-2">{t('subtotal')}</dt>
      <dd className="m-0 text-end">{money(amounts.itemsSubtotalPaise)}</dd>
      {amounts.discountPaise > 0 && (
        <>
          <dt className="text-text-2">{t('discount')}</dt>
          <dd className="m-0 text-end text-success">
            {t('minus', { amount: money(amounts.discountPaise) })}
          </dd>
        </>
      )}
      <dt className="text-text-2">{t('delivery')}</dt>
      <dd className="m-0 text-end">{money(amounts.deliveryFeePaise)}</dd>
      <dt className="text-text-2">{t('platformFee')}</dt>
      <dd className="m-0 text-end">{money(amounts.platformFeePaise)}</dd>
      <dt className="font-bold">{t('total')}</dt>
      <dd className="m-0 text-end font-bold">{money(amounts.totalPaise)}</dd>
    </dl>
  );
}
