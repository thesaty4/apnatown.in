'use client';

import { useTranslations } from 'next-intl';
import {
  BUSINESS_REJECT_REASONS,
  CUSTOMER_CANCEL_REASONS,
  type OrderDetail,
} from '@apnatown/shared/orders';
import { Card } from '@apnatown/ui/cards/Card';
import { Badge } from '@apnatown/ui/primitives/Badge';
import {
  useIstDateTime,
  useLocalName,
  useMoney,
  usePaymentLabel,
  useStatusLabel,
} from './parts';

const camel = (key: string) =>
  key.replace(/_([a-z])/gu, (_match, letter: string) => letter.toUpperCase());
const knownReasons: ReadonlySet<string> = new Set([
  ...BUSINESS_REJECT_REASONS,
  ...CUSTOMER_CANCEL_REASONS,
]);

/** Localized reject/cancel reason; unknown server keys are not shown raw. */
export function useReasonLabel() {
  const t = useTranslations('ownerOrders.reasons');
  return (key: string | null) =>
    key && knownReasons.has(key) ? t(camel(key)) : null;
}

/** Items (immutable snapshot) and the ordered bill; adjusted amounts appear
 * only when the server reports a different current payable. */
export function OrderItemsCard({ order }: { order: OrderDetail }) {
  const t = useTranslations('ownerOrders.detail');
  const money = useMoney();
  const name = useLocalName();
  const payment = usePaymentLabel();
  const amounts = order.orderedAmounts;
  const row =
    'flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-1';
  return (
    <Card padded className="grid gap-3">
      <h2 className="m-0 text-h3">{t('items')}</h2>
      <ul className="m-0 grid list-none gap-2 p-0">
        {order.items.map((item) => (
          <li key={item.id} className={row}>
            <span className="min-w-0 [overflow-wrap:anywhere]">
              {t('itemLine', {
                name: name(item),
                quantity: item.orderedQuantity,
              })}
              {item.variantLabel && (
                <span className="text-text-2"> ({item.variantLabel})</span>
              )}
              {item.availability === 'unavailable' && (
                <Badge
                  tone="bad"
                  icon="✕"
                  label={t('itemUnavailable')}
                  className="ms-2"
                />
              )}
            </span>
            <span className="font-semibold">
              {money(item.orderedLineTotalPaise)}
            </span>
          </li>
        ))}
      </ul>
      <hr className="m-0 border-border" />
      <dl className="m-0 grid gap-2 text-small">
        <div className={row}>
          <dt className="text-text-2">{t('subtotal')}</dt>
          <dd className="m-0">{money(amounts.itemsSubtotalPaise)}</dd>
        </div>
        {amounts.discountPaise > 0 && (
          <div className={row}>
            <dt className="text-text-2">{t('discount')}</dt>
            <dd className="m-0">−{money(amounts.discountPaise)}</dd>
          </div>
        )}
        {order.mode === 'delivery' && (
          <div className={row}>
            <dt className="text-text-2">{t('deliveryFee')}</dt>
            <dd className="m-0">{money(amounts.deliveryFeePaise)}</dd>
          </div>
        )}
        {amounts.platformFeePaise > 0 && (
          <div className={row}>
            <dt className="text-text-2">{t('platformFee')}</dt>
            <dd className="m-0">{money(amounts.platformFeePaise)}</dd>
          </div>
        )}
        <div className={`${row} text-body font-semibold`}>
          <dt>{t('total')}</dt>
          <dd className="m-0">{money(amounts.totalPaise)}</dd>
        </div>
        {order.currentPayablePaise !== amounts.totalPaise && (
          <div className={`${row} font-semibold`}>
            <dt>{t('currentPayable')}</dt>
            <dd className="m-0">{money(order.currentPayablePaise)}</dd>
          </div>
        )}
        <div className={row}>
          <dt className="text-text-2">{t('payment')}</dt>
          <dd className="m-0 [overflow-wrap:anywhere]">
            {payment(order.payment.method, order.payment.status, order.mode)}
          </dd>
        </div>
        {order.payment.outstandingPaise > 0 && (
          <div className={row}>
            <dt className="text-text-2">{t('outstanding')}</dt>
            <dd className="m-0">{money(order.payment.outstandingPaise)}</dd>
          </div>
        )}
      </dl>
    </Card>
  );
}

/** Server timeline, oldest first; status icon + text, IST times. */
export function OrderTimeline({ order }: { order: OrderDetail }) {
  const t = useTranslations('ownerOrders.detail');
  const status = useStatusLabel();
  const time = useIstDateTime();
  const reason = useReasonLabel();
  return (
    <Card padded className="grid gap-3">
      <h2 className="m-0 text-h3">{t('timeline')}</h2>
      {order.timeline.length === 0 ? (
        <p className="m-0 text-small text-text-2">{t('timelineEmpty')}</p>
      ) : (
        <ol className="m-0 grid list-none gap-3 border-s-2 border-border p-0 ps-4">
          {order.timeline.map((entry, index) => {
            const why = reason(entry.reasonKey);
            return (
              <li
                key={`${entry.status}-${entry.at}-${index}`}
                className="grid gap-0.5"
              >
                <span className="font-semibold">
                  <span aria-hidden="true">● </span>
                  {status(entry.status, order.mode)}
                </span>
                <span className="text-caption text-muted">
                  <time dateTime={entry.at}>{time(entry.at)}</time>
                  {' · '}
                  {t(`actor.${entry.actorKind}`)}
                </span>
                {why && (
                  <span className="text-small text-text-2 [overflow-wrap:anywhere]">
                    {t('reason', { reason: why })}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
