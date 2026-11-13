'use client';

import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import { buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { RiderOnlineToggle } from './components/RiderOnlineToggle';
import {
  Kpi,
  Notice,
  PeriodBounds,
  ReadState,
  riderBase,
  useMoney,
} from './parts';
import { ScreenHeader } from './RiderShell';
import { useCurrentOffer, useRiderSummary } from './queries';

/** S-RIDE-02: online toggle, rolling-24 h KPIs (server bounds), quick links. */
export function RiderHome() {
  const t = useTranslations('rider.home');
  const money = useMoney();
  const format = useFormatter();
  const summary = useRiderSummary();
  const data = summary.data;
  // Live offer hint (realtime `delivery` events refresh both reads).
  const offer = useCurrentOffer(Boolean(data && !data.activeJobId));
  const hasOffer = Boolean(data && !data.activeJobId && offer.data?.offer);
  return (
    <div className="grid min-w-0 gap-4">
      <ScreenHeader title={t('title')} />
      {!data ? (
        <ReadState query={summary} />
      ) : (
        <>
          <RiderOnlineToggle summary={data} />
          {hasOffer && (
            <Notice
              tone="info"
              icon="🛵"
              role="status"
              title={t('newRequest')}
              action={
                <Link
                  href={`${riderBase}/requests`}
                  className={buttonVariantClassName('primary')}
                >
                  {t('viewRequest')}
                </Link>
              }
            />
          )}
          <section aria-labelledby="rider-today" className="grid gap-2">
            <h2 id="rider-today" className="m-0 text-h3">
              {t('today')}
            </h2>
            <PeriodBounds start={data.periodStart} end={data.periodEnd} />
            <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0">
              <li>
                <Kpi
                  label={t('deliveries')}
                  value={format.number(data.completedCount)}
                />
              </li>
              <li>
                <Kpi label={t('earnings')} value={money(data.totalPaise)} />
              </li>
            </ul>
          </section>
          <nav aria-label={t('quickLinks')} className="flex flex-wrap gap-2">
            {data.activeJobId ? (
              <Link
                href={`${riderBase}/active`}
                className={buttonVariantClassName('primary')}
              >
                <span aria-hidden="true">🚚</span> {t('openActive')}
              </Link>
            ) : (
              <Link
                href={`${riderBase}/requests`}
                className={buttonVariantClassName('outline')}
              >
                <span aria-hidden="true">🛵</span> {t('openRequests')}
              </Link>
            )}
            <Link
              href={`${riderBase}/earnings`}
              className={buttonVariantClassName('outline')}
            >
              <span aria-hidden="true">💳</span> {t('openEarnings')}
            </Link>
          </nav>
        </>
      )}
    </div>
  );
}
