'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { Card } from '@apnatown/ui/cards/Card';
import { EmptyState } from '@apnatown/ui/feedback/StateViews';
import { Button } from '@apnatown/ui/primitives/Button';
import {
  EARNINGS_RANGES,
  HISTORY_RANGES,
  parseHistoryRange,
  type EarningsRange,
  type HistoryRange,
} from './api';
import {
  Kpi,
  Notice,
  PeriodBounds,
  ReadState,
  useMoney,
  useRiderError,
} from './parts';
import { ScreenHeader } from './RiderShell';
import { RangeChips, RideRow } from './rides';
import { useRiderEarnings, useRiderHistory } from './queries';

/** S-RIDE-05: `?range=` survives reload/Back; each filter has its own empty. */
export function RiderHistoryScreen() {
  const t = useTranslations('rider.history');
  const message = useRiderError();
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const range = parseHistoryRange(params.get('range'));
  const history = useRiderHistory(range);
  const pages = history.data?.pages;
  const items = pages?.flatMap((page) => page.items) ?? [];
  const first = pages?.[0];
  function select(next: HistoryRange) {
    const query = new URLSearchParams(params);
    if (next === 'all') query.delete('range');
    else query.set('range', next);
    const search = query.toString();
    router.replace(search ? `${path}?${search}` : path, { scroll: false });
  }
  return (
    <div className="grid min-w-0 gap-4">
      <ScreenHeader title={t('title')} />
      <RangeChips
        label={t('filterLabel')}
        ranges={HISTORY_RANGES}
        value={range}
        onChange={select}
        labelOf={(value) => t(`range.${value}`)}
      />
      {!first ? (
        <ReadState query={history} />
      ) : (
        <>
          <PeriodBounds start={first.periodStart} end={first.periodEnd} />
          {items.length === 0 ? (
            <EmptyState
              headingLevel="h2"
              icon="📋"
              title={t(`empty.${range}`)}
              message={t('emptyMessage')}
              action={null}
            />
          ) : (
            <ul className="m-0 grid list-none gap-2 p-0">
              {items.map((ride) => (
                <RideRow key={ride.jobId} ride={ride} />
              ))}
            </ul>
          )}
          {history.hasNextPage && (
            <Button
              variant="outline"
              className="justify-self-start"
              loading={history.isFetchingNextPage}
              disabled={history.isFetchingNextPage}
              onClick={() => void history.fetchNextPage()}
            >
              {t('loadMore')}
            </Button>
          )}
          {history.isFetchNextPageError && (
            <Notice tone="bad" role="alert" title={message(history.error)} />
          )}
        </>
      )}
    </div>
  );
}

/**
 * S-RIDE-06: day/week totals from the returned period, persisted per-ride
 * breakdown, and an explicit payout availability (never an invented ₹0 paid).
 */
export function RiderEarningsScreen() {
  const t = useTranslations('rider.earnings');
  const money = useMoney();
  const format = useFormatter();
  const [range, setRange] = useState<EarningsRange>('day');
  const earnings = useRiderEarnings(range);
  const data = earnings.data;
  return (
    <div className="grid min-w-0 gap-4">
      <ScreenHeader title={t('title')} />
      <RangeChips
        label={t('rangeLabel')}
        ranges={EARNINGS_RANGES}
        value={range}
        onChange={setRange}
        labelOf={(value) => t(`range.${value}`)}
      />
      {!data ? (
        <ReadState query={earnings} />
      ) : (
        <>
          <PeriodBounds start={data.periodStart} end={data.periodEnd} />
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0">
            <li>
              <Kpi label={t('total')} value={money(data.totalPaise)} />
            </li>
            <li>
              <Kpi
                label={t('rides')}
                value={format.number(data.completedCount)}
              />
            </li>
          </ul>
          <section aria-labelledby="rider-rides" className="grid gap-2">
            <h2 id="rider-rides" className="m-0 text-h3">
              {t('breakdownTitle')}
            </h2>
            {data.rides.length === 0 ? (
              <p className="m-0 text-text-2">{t(`empty.${range}`)}</p>
            ) : (
              <ul className="m-0 grid list-none gap-2 p-0">
                {data.rides.map((ride) => (
                  <RideRow key={ride.jobId} ride={ride} breakdown />
                ))}
              </ul>
            )}
          </section>
          <Card padded className="grid gap-2">
            <h2 className="m-0 text-h3">{t('payoutTitle')}</h2>
            {data.payout.availability === 'available' &&
            data.payout.pendingPaise !== null ? (
              <p className="m-0">
                {t('payoutPending', {
                  amount: money(data.payout.pendingPaise),
                })}
              </p>
            ) : (
              <Notice tone="info" role="status" title={t('payoutUnavailable')}>
                <p className="m-0">{t('payoutUnavailableBody')}</p>
              </Notice>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
