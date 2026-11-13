'use client';

import { useTranslations } from 'next-intl';
import type { OrderDetail } from '@apnatown/shared/orders';
import { Card } from '@apnatown/ui/cards/Card';

/** Customer first name and the fulfilment snapshot (delivery address for a
 * delivery order, pickup point for pickup). Plain text only, never HTML. */
export function FulfilmentCard({ order }: { order: OrderDetail }) {
  const t = useTranslations('ownerOrders.detail');
  const address = order.deliveryAddress;
  const pickup = order.pickup;
  return (
    <Card padded className="grid gap-3">
      <h2 className="m-0 text-h3">{t('customer')}</h2>
      <dl className="m-0 grid gap-x-4 gap-y-2 tablet:grid-cols-[max-content_1fr]">
        <dt className="text-small text-muted">{t('name')}</dt>
        <dd className="m-0 [overflow-wrap:anywhere]">
          {order.customer?.firstName ?? t('notShared')}
        </dd>
        {order.mode === 'delivery' ? (
          <>
            <dt className="text-small text-muted">{t('deliverTo')}</dt>
            <dd className="m-0 grid gap-0.5 [overflow-wrap:anywhere]">
              {address ? (
                <>
                  {address.label && (
                    <span className="font-semibold">{address.label}</span>
                  )}
                  <span className="whitespace-pre-line">
                    {address.addressText}
                  </span>
                  {address.landmark && (
                    <span className="text-small text-text-2">
                      {t('landmark', { landmark: address.landmark })}
                    </span>
                  )}
                  {address.pinCode && (
                    <span className="text-small text-text-2" dir="ltr">
                      {t('pinCode', { pin: address.pinCode })}
                    </span>
                  )}
                </>
              ) : (
                t('notShared')
              )}
            </dd>
            {order.deliveryMethod && (
              <>
                <dt className="text-small text-muted">{t('deliveryBy')}</dt>
                <dd className="m-0">
                  {t(
                    order.deliveryMethod === 'self'
                      ? 'deliverySelf'
                      : 'deliveryRider',
                  )}
                </dd>
              </>
            )}
          </>
        ) : (
          <>
            <dt className="text-small text-muted">{t('pickup')}</dt>
            <dd className="m-0 grid gap-0.5 [overflow-wrap:anywhere]">
              <span>{t('customerWillCollect')}</span>
              {pickup?.addressText && (
                <span className="whitespace-pre-line text-small text-text-2">
                  {pickup.addressText}
                </span>
              )}
              {pickup?.instructions && (
                <span className="whitespace-pre-line text-small text-text-2">
                  {pickup.instructions}
                </span>
              )}
            </dd>
          </>
        )}
      </dl>
    </Card>
  );
}
