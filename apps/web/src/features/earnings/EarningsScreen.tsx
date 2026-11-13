'use client';

import { useFormatter, useLocale, useTranslations } from 'next-intl';
import type { BusinessOwner } from '@apnatown/shared/businesses';
import type { BillingOverview, Earnings } from '@apnatown/shared/earnings';
import { Card } from '@apnatown/ui/cards/Card';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { formatInr } from '../../shared/lib/money';
import { BarChart } from '../../shared/ui/BarChart';
import { KpiCard } from '../../shared/ui/KpiCard';
import { OwnerGate } from '../businesses/BusinessDashboard';
import { OwnerQueryState } from '../businesses/OwnerQueryState';
import { LockedNote } from '../businesses/parts';
import { useBilling, useEarnings } from './queries';

/** S-VEND-16 Earnings & plan (read-only; purchases/payouts/invoices not live yet). */
export function EarningsScreen() {
  return (
    <OwnerGate kind="shop">
      {(business) => <EarningsGate business={business} />}
    </OwnerGate>
  );
}

function EarningsGate({ business }: { business: BusinessOwner }) {
  const t = useTranslations('earnings.owner');
  const approved = business.status === 'approved';
  const earnings = useEarnings('shop', approved);
  const billing = useBilling('shop', approved);
  return (
    <div className="grid min-w-0 gap-4">
      <h1 className="m-0 text-h1">{t('title')}</h1>
      {approved ? (
        <>
          <OwnerQueryState query={earnings} loadingLabel={t('loading')} errorTitle={t('error')}>
            {(data) => <EarningsBody data={data} />}
          </OwnerQueryState>
          <OwnerQueryState query={billing} loadingLabel={t('loading')} errorTitle={t('error')}>
            {(data) => <BillingBody data={data} />}
          </OwnerQueryState>
          <Card padded className="grid gap-1">
            <h2 className="m-0 text-h4">{t('invoicesTitle')}</h2>
            <p className="m-0 text-small text-muted">{t('invoicesUnavailable')}</p>
          </Card>
        </>
      ) : (
        <Card padded>
          <LockedNote />
        </Card>
      )}
    </div>
  );
}

const monthDate = (month: string) => new Date(`${month}-01T00:00:00Z`);

function EarningsBody({ data }: { data: Earnings }) {
  const t = useTranslations('earnings.owner');
  const format = useFormatter();
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const inr = (paise: number | null) => (paise === null ? null : formatInr(paise, locale));
  const month = format.dateTime(monthDate(data.month), { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return (
    <>
      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 desktop:grid-cols-4">
        <li>
          <KpiCard label={t('gross')} value={inr(data.grossPaise)} hint={month} unavailableLabel={t('unavailable')} />
        </li>
        <li>
          <KpiCard
            label={t('commission')}
            value={inr(data.commissionPaise)}
            hint={data.commissionBps === null ? undefined : t('commissionRate', { rate: data.commissionBps / 100 })}
            unavailableLabel={t('unavailable')}
          />
        </li>
        <li>
          <KpiCard label={t('net')} value={inr(data.netPaise)} hint={t('estimated')} unavailableLabel={t('unavailable')} />
        </li>
        <li>
          <KpiCard label={t('nextPayout')} value={null} unavailableLabel={t('unavailable')} />
        </li>
      </ul>
      <p className="m-0 text-caption text-muted">{t('salesNote', { count: data.orders })}</p>
      <Card padded>
        <BarChart
          caption={t('chartTitle')}
          tableLabel={t('showTable')}
          format={(value) => formatInr(value, locale)}
          series={[{ key: 'gross', label: t('gross'), colorClass: 'bg-primary' }]}
          rows={data.months.map((entry) => ({
            label: format.dateTime(monthDate(entry.month), { month: 'short', timeZone: 'UTC' }),
            values: { gross: entry.grossPaise },
          }))}
        />
      </Card>
    </>
  );
}

function BillingBody({ data }: { data: BillingOverview }) {
  const t = useTranslations('earnings.owner');
  const format = useFormatter();
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const name = (item: { nameEn: string; nameHi: string }) => (locale === 'hi' ? item.nameHi : item.nameEn);
  return (
    <>
      <Card padded className="grid gap-3">
        <h2 className="m-0 text-h4">{t('plansTitle')}</h2>
        {data.plans === null ? (
          <p className="m-0 text-small text-muted">{t('plansUnavailable')}</p>
        ) : (
          <ul className="m-0 grid list-none gap-3 p-0 tablet:grid-cols-3">
            {data.plans.map((plan) => (
              <li key={plan.code} className={`grid content-start gap-1 rounded-md border p-3 ${plan.current ? 'border-primary' : 'border-border'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <b>{name(plan)}</b>
                  {plan.current && <StatusBadge tone="ok" icon="✓" label={t('currentPlan')} />}
                </div>
                <p className="m-0 text-h3">
                  {plan.pricePaise ? t('perMonth', { price: formatInr(plan.pricePaise, locale) }) : t('free')}
                </p>
                <p className="m-0 text-small text-text-2">{t('commissionRate', { rate: plan.commissionBps / 100 })}</p>
                {!plan.current && (
                  <Button size="small" variant="outline" disabled className="justify-self-start">
                    {t('switch')}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        {data.currentEndsAt && (
          <p className="m-0 text-small">
            {t('paidThrough', { date: format.dateTime(new Date(data.currentEndsAt), { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }) })}
          </p>
        )}
        <p className="m-0 text-caption text-muted">{t('purchaseUnavailable')}</p>
      </Card>
      <Card padded className="grid gap-2">
        <h2 className="m-0 text-h4">{t('promotionsTitle')}</h2>
        {data.promotions === null || !data.promotions.length ? (
          <p className="m-0 text-small text-muted">{t('promotionsUnavailable')}</p>
        ) : (
          <ul className="m-0 grid list-none gap-2 p-0">
            {data.promotions.map((promo) => (
              <li key={promo.code} className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 first:border-0 first:pt-0">
                <span>
                  {name(promo)} · <b>{formatInr(promo.pricePaise, locale)}</b>
                </span>
                <Button size="small" variant="outline" disabled>
                  {t('buy')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
