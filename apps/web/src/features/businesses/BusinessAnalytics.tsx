'use client';

import { useLocale, useTranslations } from 'next-intl';
import type {
  BusinessAnalytics as Analytics,
  BusinessOwner,
} from '@apnatown/shared/businesses';
import { ENQUIRY_STATUSES } from '@apnatown/shared/services';
import { formatCompactCount } from '@apnatown/shared';
import { Card } from '@apnatown/ui/cards/Card';
import { EmptyState } from '@apnatown/ui/feedback/StateViews';
import { BarChart } from '../../shared/ui/BarChart';
import { KpiCard } from '../../shared/ui/KpiCard';
import { OwnerGate } from './BusinessDashboard';
import { OwnerQueryState } from './OwnerQueryState';
import { LockedNote } from './parts';
import { useBusinessAnalytics } from './queries';

/** S-PROV-14: reporting-v1 views, enquiries and conversion (30 IST days). */
export function BusinessAnalytics() {
  return (
    <OwnerGate kind="provider">
      {(business) => <AnalyticsScreen business={business} />}
    </OwnerGate>
  );
}

function AnalyticsScreen({ business }: { business: BusinessOwner }) {
  const t = useTranslations('business.analytics');
  const approved = business.status === 'approved';
  const query = useBusinessAnalytics('provider', approved);
  return (
    <div className="grid min-w-0 gap-4">
      <header>
        <h1 className="m-0 text-h1">{t('title')}</h1>
        <p className="m-0 text-small text-muted">{t('period30d')}</p>
      </header>
      {approved ? (
        <OwnerQueryState
          query={query}
          loadingLabel={t('loading')}
          errorTitle={t('error')}
        >
          {(data) => <AnalyticsBody data={data} />}
        </OwnerQueryState>
      ) : (
        <Card padded>
          <LockedNote />
        </Card>
      )}
    </div>
  );
}

function AnalyticsBody({ data }: { data: Analytics }) {
  const t = useTranslations('business.analytics');
  const ts = useTranslations('service.enquiries.status');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const count = (value: number | null) =>
    value === null ? null : formatCompactCount(value, locale);
  if (!data.views && !data.enquiries)
    return (
      <EmptyState icon="📈" title={t('emptyTitle')} message={t('empty')} action={null} />
    );
  const day = new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
  const percent = new Intl.NumberFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    style: 'percent',
    maximumFractionDigits: 1,
  });
  return (
    <>
      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 desktop:grid-cols-4">
        <li>
          <KpiCard label={t('views')} value={count(data.views)} unavailableLabel={t('unavailable')} />
        </li>
        <li>
          <KpiCard label={t('enquiries')} value={count(data.enquiries)} unavailableLabel={t('unavailable')} />
        </li>
        <li>
          <KpiCard label={t('converted')} value={count(data.converted)} unavailableLabel={t('unavailable')} />
        </li>
        <li>
          <KpiCard
            label={t('conversion')}
            value={data.conversionRate === null ? t('notApplicable') : percent.format(data.conversionRate)}
            unavailableLabel={t('unavailable')}
          />
        </li>
      </ul>
      {data.unavailable.includes('views_before_coverage') && (
        <p className="m-0 text-small text-muted">{t('partialViews')}</p>
      )}
      <Card padded>
        <BarChart
          caption={t('chartTitle')}
          tableLabel={t('showTable')}
          series={[
            { key: 'views', label: t('views'), colorClass: 'bg-primary' },
            { key: 'enquiries', label: t('enquiries'), colorClass: 'bg-info' },
          ]}
          rows={data.daily.map((entry) => ({
            label: day.format(new Date(`${entry.date}T00:00:00Z`)),
            values: { views: entry.views, enquiries: entry.enquiries },
          }))}
        />
      </Card>
      <Card padded className="grid gap-2">
        <h2 className="m-0 text-h4">{t('statusMix')}</h2>
        <ul className="m-0 grid list-none gap-1 p-0">
          {ENQUIRY_STATUSES.map((status) => (
            <li key={status} className="flex justify-between gap-2">
              <span>{ts(status)}</span>
              <span className="font-semibold">
                {count(data.statusCounts?.[status] ?? 0)}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
