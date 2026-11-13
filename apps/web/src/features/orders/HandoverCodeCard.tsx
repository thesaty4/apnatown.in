'use client';

import { useFormatter, useTranslations } from 'next-intl';
import type { OrderDetail } from '@apnatown/shared/orders';
import { Card } from '@apnatown/ui/cards/Card';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { Button } from '@apnatown/ui/primitives/Button';
import { Notice } from '../../shared/ui/Notice';
import { useOrderError } from './errors';
import { useDeliveryCode, useReissueCode } from './queries';
import { isTerminal } from './status';
import { useNow } from './use-now';

/**
 * Customer handover code (BR-05). Only the dedicated no-store `/code` channel
 * reveals it, only while the server grants `view_code`; it is held in memory
 * (gcTime 0) and never logged, persisted or rendered server-side.
 */
export function HandoverCodeCard({ order }: { order: OrderDetail }) {
  const t = useTranslations('orders.code');
  if (order.allowedActions.includes('view_code'))
    return <LiveCode order={order} />;
  if (isTerminal(order.status) || order.fulfilmentNotice) return null;
  if (order.handover?.state === 'locked')
    return <Notice tone="bad">{t('locked')}</Notice>;
  return (
    <Notice tone="info">
      {t(order.mode === 'pickup' ? 'laterPickup' : 'laterDelivery')}
    </Notice>
  );
}

function LiveCode({ order }: { order: OrderDetail }) {
  const t = useTranslations('orders.code');
  const format = useFormatter();
  const errorText = useOrderError();
  const now = useNow();
  const query = useDeliveryCode(order);
  const reissue = useReissueCode(order.id);
  const time = (at: string) =>
    format.dateTime(new Date(at), {
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    });

  if (query.isPending)
    return (
      <Card padded>
        <Skeleton label={t('loading')} />
      </Card>
    );
  if (query.isError && !query.data)
    return (
      <Notice
        tone="bad"
        role="alert"
        action={
          <Button
            size="small"
            loading={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {t('retry')}
          </Button>
        }
      >
        {errorText(query.error)}
      </Notice>
    );

  const code = query.data;
  const pickup = code.kind === 'pickup_code';
  const expired = Date.parse(code.expiresAt) <= now;
  const cooling = Date.parse(code.reissueAvailableAt) > now;
  return (
    <Card
      padded
      className="grid justify-items-center gap-2 bg-primary-soft text-center"
    >
      <h2 className="m-0 text-h4">
        {t(pickup ? 'pickupTitle' : 'deliveryTitle')}
      </h2>
      {expired ? (
        <p className="m-0 font-semibold">{t('expired')}</p>
      ) : (
        <>
          <p
            aria-hidden="true"
            className="m-0 font-display text-h1 tracking-widest desktop:text-h1-desktop"
          >
            {code.code}
          </p>
          <p className="sr-only">
            {t('codeLabel', { digits: code.code.split('').join(' ') })}
          </p>
        </>
      )}
      <p className="m-0 text-small [overflow-wrap:anywhere]">
        {t(pickup ? 'showPickup' : 'showDelivery')}
      </p>
      {!expired && (
        <p className="m-0 text-caption text-muted">
          {t('validUntil', { time: time(code.expiresAt) })}
        </p>
      )}
      {order.handover?.attemptsRemaining != null && (
        <p className="m-0 text-caption text-muted">
          {t('attempts', { count: order.handover.attemptsRemaining })}
        </p>
      )}
      <Button
        variant="outline"
        size="small"
        disabled={cooling}
        loading={reissue.isPending}
        onClick={() => void reissue.run(code.codeVersion)}
      >
        {t('reissue')}
      </Button>
      {cooling && (
        <p className="m-0 text-caption text-muted">
          {t('cooldown', { time: time(code.reissueAvailableAt) })}
        </p>
      )}
      {reissue.isError && (
        <p role="alert" className="m-0 text-small text-error">
          {errorText(reissue.error)}
        </p>
      )}
      {query.isError && (
        <p role="alert" className="m-0 text-small text-error">
          {errorText(query.error)}
        </p>
      )}
    </Card>
  );
}
