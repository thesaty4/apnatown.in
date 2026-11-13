'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { RiderOffer } from '@apnatown/shared/delivery';
import { Card } from '@apnatown/ui/cards/Card';
import { Button } from '@apnatown/ui/primitives/Button';
import type { OfferDecision } from '../job-queries';
import { Notice, useIstTime, useKm, useMoney } from '../parts';

/** Seconds left from the server's expiry, corrected by its clock skew. */
function useRemaining(offer: RiderOffer) {
  const [now, setNow] = useState(() => Date.now());
  const [skew, setSkew] = useState(
    () => Date.parse(offer.serverTime) - Date.now(),
  );
  // Each re-read (focus, reconnect, realtime hint) re-anchors the clock.
  useEffect(() => {
    setSkew(Date.parse(offer.serverTime) - Date.now());
  }, [offer.serverTime]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return Math.max(
    0,
    Math.ceil((Date.parse(offer.expiresAt) - (now + skew)) / 1000),
  );
}

/**
 * Current offer card (S-RIDE-03): pickup/drop areas, distance, immutable
 * estimate and a server-anchored countdown. Screen readers hear 30 s / 10 s /
 * expired milestones only, never each tick. Accept/Reject send the offer
 * version; both disable once the server expiry passes or while sending.
 */
export function RequestCountdownCard({
  offer,
  busy,
  pending,
  canAccept,
  onRespond,
}: {
  offer: RiderOffer;
  /** Any response is in flight (both buttons disabled). */
  busy: boolean;
  /** The response being sent (its button shows progress). */
  pending: OfferDecision | null;
  /** False while offline or not online for deliveries. */
  canAccept: boolean;
  onRespond: (decision: OfferDecision) => void;
}) {
  const t = useTranslations('rider.requests');
  const money = useMoney();
  const km = useKm();
  const time = useIstTime();
  const remaining = useRemaining(offer);
  const expired = remaining === 0;
  const milestone = expired
    ? t('expired')
    : remaining <= 10
      ? t('secondsLeft', { seconds: 10 })
      : remaining <= 30
        ? t('secondsLeft', { seconds: 30 })
        : '';
  return (
    <Card
      padded
      className={`grid min-w-0 gap-3 ${expired ? 'opacity-60' : ''}`}
      aria-labelledby={`offer-${offer.offerId}`}
    >
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="grid min-w-0 flex-1 basis-48 gap-1">
          <h2
            id={`offer-${offer.offerId}`}
            className="m-0 text-h3 [overflow-wrap:anywhere]"
          >
            {offer.pickup.businessName}
          </h2>
          <p className="m-0 text-small text-text-2 [overflow-wrap:anywhere]">
            {t('route', { pickup: offer.pickup.area, drop: offer.dropArea })}
          </p>
        </div>
        <p
          className="m-0 grid size-16 shrink-0 place-items-center rounded-pill border-4 border-primary text-h3 font-semibold"
          aria-hidden="true"
        >
          {remaining}
        </p>
      </div>
      <p className="sr-only" aria-live="polite">
        {milestone}
      </p>
      <dl className="m-0 grid grid-cols-2 gap-2 text-small">
        <div>
          <dt className="text-muted">{t('distance')}</dt>
          <dd className="m-0 font-semibold">{km(offer.distanceM)}</dd>
        </div>
        <div>
          <dt className="text-muted">{t('estimate')}</dt>
          <dd className="m-0 font-semibold">
            {money(offer.estimate.totalPaise)}
          </dd>
        </div>
        <div>
          <dt className="text-muted">{t('items')}</dt>
          <dd className="m-0 font-semibold">{offer.itemCount}</dd>
        </div>
        <div>
          <dt className="text-muted">{t('expiresAt')}</dt>
          <dd className="m-0 font-semibold">{time(offer.expiresAt)}</dd>
        </div>
      </dl>
      <p className="m-0 text-caption text-muted">{t('estimateNote')}</p>
      {expired ? (
        <Notice tone="warn" icon="⌛" role="status" title={t('expired')} />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            disabled={busy}
            loading={pending === 'reject'}
            onClick={() => onRespond('reject')}
          >
            {t('reject')}
          </Button>
          <Button
            disabled={busy || !canAccept}
            loading={pending === 'accept'}
            onClick={() => onRespond('accept')}
          >
            {t('accept')}
          </Button>
        </div>
      )}
    </Card>
  );
}
