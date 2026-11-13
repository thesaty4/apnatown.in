'use client';

import { useTranslations } from 'next-intl';
import type { OrderDeliveryBlock } from '@apnatown/shared/delivery';
import type { OrderDetail } from '@apnatown/shared/orders';
import { Card } from '@apnatown/ui/cards/Card';

type Step = { icon: string; key: string };

const jobStep: Record<OrderDeliveryBlock['jobStatus'], Step> = {
  requested: { icon: '🔎', key: 'looking' },
  accepted: { icon: '🛵', key: 'toShop' },
  reached_shop: { icon: '🏪', key: 'atShop' },
  picked_up: { icon: '➜', key: 'onTheWay' },
  reached_drop: { icon: '📍', key: 'arrived' },
  delivered: { icon: '✔', key: 'delivered' },
  failed: { icon: '⚠️', key: 'failed' },
  cancelled: { icon: '✕', key: 'cancelled' },
};

const LIVE = new Set<OrderDeliveryBlock['jobStatus']>([
  'accepted',
  'reached_shop',
  'picked_up',
  'reached_drop',
]);

/**
 * S-CUST-14 rider card for ApnaTown-rider orders: delivery status (icon +
 * text) and, once a rider accepted, their public name and vehicle. Order
 * realtime events refresh it. No phone or location is shown; masked calling
 * is not available yet and says so only while a rider is on the job.
 */
export function OrderRiderCard({ order }: { order: OrderDetail }) {
  const t = useTranslations('orders.rider');
  const delivery = order.delivery;
  if (!delivery) return null;
  const step = jobStep[delivery.jobStatus];
  const rider = delivery.rider;
  const name = rider?.displayName ?? t('riderFallback');
  return (
    <Card padded className="grid gap-3" aria-labelledby="order-rider">
      <h2 id="order-rider" className="m-0 text-h4">
        {t('title')}
      </h2>
      <p
        role="status"
        aria-live="polite"
        className="m-0 flex min-w-0 items-start gap-2 [overflow-wrap:anywhere]"
      >
        <span aria-hidden="true" className="shrink-0">
          {step.icon}
        </span>
        <span>{t(`status.${step.key}`, { name })}</span>
      </p>
      {rider && (
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-pill bg-surface-2"
          >
            🛵
          </span>
          <div className="grid min-w-0 gap-0.5">
            <p className="m-0 font-semibold [overflow-wrap:anywhere]">
              {rider.displayName}
            </p>
            {rider.vehicleLabel && (
              <p className="m-0 text-small text-text-2 [overflow-wrap:anywhere]">
                {rider.vehicleLabel}
              </p>
            )}
          </div>
        </div>
      )}
      {rider && LIVE.has(delivery.jobStatus) && (
        <p className="m-0 text-small text-text-2">{t('callUnavailable')}</p>
      )}
    </Card>
  );
}
