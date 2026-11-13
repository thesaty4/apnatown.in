'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card } from '@apnatown/ui/cards/Card';
import { EmptyState } from '@apnatown/ui/feedback/StateViews';
import { buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { RequestCountdownCard } from './components/RequestCountdownCard';
import { Notice, ReadState, riderBase, useKm, useMoney } from './parts';
import { ScreenHeader } from './RiderShell';
import { noActiveJob, useActiveJob, useCurrentOffer } from './queries';

/** S-RIDE-03: the current offer, or an explicit "no requests" empty state. */
export function RiderRequests() {
  const t = useTranslations('rider.requests');
  const offer = useCurrentOffer();
  return (
    <div className="grid min-w-0 gap-4">
      <ScreenHeader title={t('title')} />
      {!offer.data ? (
        <ReadState query={offer} />
      ) : offer.data.offer ? (
        <RequestCountdownCard
          key={offer.data.offer.offerId}
          offer={offer.data.offer}
        />
      ) : (
        <EmptyState
          headingLevel="h2"
          icon="🛵"
          title={t('emptyTitle')}
          message={t('emptyMessage')}
          action={
            <Link
              href={`${riderBase}/home`}
              className={buttonVariantClassName('outline')}
            >
              {t('backHome')}
            </Link>
          }
        />
      )}
    </div>
  );
}

/**
 * S-RIDE-04: 404 DELIVERY_JOB_NOT_FOUND is the "no active delivery" answer.
 * Step actions are not shipped by the API yet, so an assigned job is shown
 * read-only with that explanation; no code, phone or completion is invented.
 */
export function RiderActive() {
  const t = useTranslations('rider.active');
  const money = useMoney();
  const km = useKm();
  const job = useActiveJob();
  const data = job.data;
  return (
    <div className="grid min-w-0 gap-4">
      <ScreenHeader title={t('title')} />
      {data ? (
        <Card padded className="grid min-w-0 gap-3">
          <h2 className="m-0 text-h3 [overflow-wrap:anywhere]">
            {t('order', { number: data.orderNumber })}
          </h2>
          <dl className="m-0 grid gap-2 text-small tablet:grid-cols-2">
            <div>
              <dt className="text-muted">{t('pickup')}</dt>
              <dd className="m-0 font-semibold [overflow-wrap:anywhere]">
                {data.pickup.businessName} · {data.pickup.area}
              </dd>
            </div>
            <div>
              <dt className="text-muted">{t('drop')}</dt>
              <dd className="m-0 font-semibold [overflow-wrap:anywhere]">
                {data.drop.firstName} · {data.drop.address}
              </dd>
            </div>
            <div>
              <dt className="text-muted">{t('distance')}</dt>
              <dd className="m-0 font-semibold">{km(data.distanceM)}</dd>
            </div>
            <div>
              <dt className="text-muted">{t('estimate')}</dt>
              <dd className="m-0 font-semibold">
                {money(data.estimate.totalPaise)}
              </dd>
            </div>
          </dl>
          <Notice tone="info" title={t('stepsUnavailable')} />
        </Card>
      ) : job.isError && noActiveJob(job.error) ? (
        <EmptyState
          headingLevel="h2"
          icon="🚚"
          title={t('emptyTitle')}
          message={t('emptyMessage')}
          action={
            <Link
              href={`${riderBase}/requests`}
              className={buttonVariantClassName('outline')}
            >
              {t('openRequests')}
            </Link>
          }
        />
      ) : (
        <ReadState query={job} />
      )}
    </div>
  );
}
