'use client';

import { useTranslations } from 'next-intl';
import type { OrderDetail } from '@apnatown/shared/orders';
import { Card } from '@apnatown/ui/cards/Card';
import { Notice } from '../../shared/ui/Notice';

/** Delivery address snapshot or pickup point (plain text, never HTML). */
export function OrderFulfilmentCard({ order }: { order: OrderDetail }) {
  const t = useTranslations('orders.detail');
  const pickup = order.mode === 'pickup';
  const address = order.deliveryAddress;
  return (
    <Card padded className="grid gap-2">
      <h2 className="m-0 text-h4">
        {t(pickup ? 'pickupTitle' : 'addressTitle')}
      </h2>
      {pickup ? (
        order.pickup?.addressText || order.pickup?.instructions ? (
          <>
            {order.pickup.addressText && (
              <p className="m-0 [overflow-wrap:anywhere]">
                {order.pickup.addressText}
              </p>
            )}
            {order.pickup.instructions && (
              <p className="m-0 text-small text-text-2 [overflow-wrap:anywhere]">
                {order.pickup.instructions}
              </p>
            )}
          </>
        ) : (
          <p className="m-0 text-small text-text-2">{t('pickupUnknown')}</p>
        )
      ) : address ? (
        <>
          {address.label && (
            <b className="[overflow-wrap:anywhere]">{address.label}</b>
          )}
          <p className="m-0 [overflow-wrap:anywhere]">{address.addressText}</p>
          {address.landmark && (
            <p className="m-0 text-small text-text-2 [overflow-wrap:anywhere]">
              {t('landmark', { landmark: address.landmark })}
            </p>
          )}
          {address.pinCode && (
            <p className="m-0 text-small text-text-2">
              {t('pin', { pin: address.pinCode })}
            </p>
          )}
        </>
      ) : (
        <p className="m-0 text-small text-text-2">{t('addressUnknown')}</p>
      )}
      {order.fulfilmentNotice === 'rider_dispatch_unavailable' && (
        <Notice tone="info">{t('riderUnavailable')}</Notice>
      )}
    </Card>
  );
}
