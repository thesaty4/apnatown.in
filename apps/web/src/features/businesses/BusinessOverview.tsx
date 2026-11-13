'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type {
  BusinessKind,
  BusinessOverview as Overview,
  BusinessOwner,
} from '@apnatown/shared/businesses';
import { formatCompactCount } from '@apnatown/shared';
import { Card } from '@apnatown/ui/cards/Card';
import { Button, buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { ErrorState, OfflineState } from '@apnatown/ui/feedback/StateViews';
import { failureCode } from '../../shared/api/result';
import { useOnline } from '../../shared/hooks/use-online';
import { OwnerGate } from './BusinessDashboard';
import {
  Alert,
  BusinessStatusBadge,
  LockedNote,
  StatusBanner,
  businessName,
  dashboardBase,
  errorKey,
  istToday,
  publicPath,
} from './parts';
import { useBusinessOverview, useReactivateBusiness } from './queries';

export function BusinessOverview({ kind }: { kind: BusinessKind }) {
  return (
    <OwnerGate kind={kind}>
      {(business) => <OverviewScreen business={business} />}
    </OwnerGate>
  );
}

function OverviewScreen({ business }: { business: BusinessOwner }) {
  const t = useTranslations('business.dashboard');
  const common = useTranslations('business.common');
  const te = useTranslations('business.errors');
  const locale = useLocale();
  const kind = business.kind;
  const reactivate = useReactivateBusiness(kind);
  const approved = business.status === 'approved';
  const name = businessName(business, locale) ?? common('unnamed');
  return (
    <div className="grid min-w-0 gap-4">
      <header className="flex min-w-0 flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1 basis-64">
          <h1 className="m-0 text-h1 [overflow-wrap:anywhere]">
            {t('greeting', { name })}
          </h1>
          <p className="m-0 text-small text-muted">{istToday(locale)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BusinessStatusBadge status={business.status} />
          {business.capabilities.publicProfile && business.slug && (
            <Link
              href={publicPath(kind, business.slug)}
              className={buttonVariantClassName('outline', 'small')}
            >
              <span aria-hidden="true">👁</span> {common('viewPublic')}
            </Link>
          )}
        </div>
      </header>
      <StatusBanner
        business={business}
        reactivating={reactivate.mutation.isPending}
        onReactivate={() => void reactivate.run(business.version)}
      />
      {reactivate.mutation.isError && (
        <p role="alert" className="m-0 text-small text-error">
          {te(errorKey(failureCode(reactivate.mutation.error)))}
        </p>
      )}
      {!approved && (
        <Alert tone="info" icon="🔒" title={t('limitedTitle')}>
          <p className="m-0">{t('limitedAccess')}</p>
        </Alert>
      )}
      <Kpis kind={kind} />
      <div className="grid min-w-0 gap-4 desktop:grid-cols-2">
        {kind === 'shop' ? (
          <>
            <SectionCard title={t('pendingActions')}>
              {approved ? <Unavailable /> : <LockedNote headingLevel="h3" />}
            </SectionCard>
            <SectionCard title={t('lowStock')}>
              {approved ? <Unavailable /> : <LockedNote headingLevel="h3" />}
            </SectionCard>
          </>
        ) : (
          <>
            <SectionCard title={t('latestEnquiries')}>
              {approved ? <Unavailable /> : <LockedNote headingLevel="h3" />}
            </SectionCard>
            <ComingSoonPanel />
          </>
        )}
      </div>
      <QuickLinks kind={kind} />
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card padded className="grid min-w-0 content-start gap-2">
      <h2 className="m-0 text-h4">{title}</h2>
      {children}
    </Card>
  );
}

/** A source module that has not shipped: never rendered as zero. */
function Unavailable() {
  const t = useTranslations('business.analytics');
  return (
    <p className="m-0 flex items-start gap-2 text-small text-text-2">
      <span aria-hidden="true">⌛</span>
      {t('sourcePending')}
    </p>
  );
}

type SectionName = Exclude<
  keyof Overview,
  'business' | 'status' | 'capabilities'
>;
const kpiOrder: Record<BusinessKind, SectionName[]> = {
  shop: [
    'orders',
    'earnings',
    'analytics',
    'enquiries',
    'rating',
    'products',
    'followers',
  ],
  provider: ['analytics', 'enquiries', 'rating', 'followers'],
};

/** KPI section: its own loading / offline / error+retry, independent of the header. */
function Kpis({ kind }: { kind: BusinessKind }) {
  const t = useTranslations('business.dashboard');
  const ta = useTranslations('business.analytics');
  const common = useTranslations('business.common');
  const te = useTranslations('business.errors');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const online = useOnline();
  const overview = useBusinessOverview(kind);
  let body: ReactNode;
  if (overview.isPending && (!online || overview.fetchStatus === 'paused'))
    body = (
      <OfflineState
        headingLevel="h2"
        title={common('offlineTitle')}
        message={common('offlineMessage')}
        action={null}
      />
    );
  else if (overview.isPending) body = <Skeleton label={t('kpiLoading')} />;
  else if (overview.isError)
    body = (
      <ErrorState
        headingLevel="h2"
        title={t('kpiError')}
        message={te(errorKey(failureCode(overview.error)))}
        action={
          <Button
            disabled={overview.isFetching}
            onClick={() => void overview.refetch()}
          >
            {common('retry')}
          </Button>
        }
      />
    );
  else {
    const data = overview.data;
    body = (
      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 tablet:grid-cols-3 desktop:grid-cols-4">
        {kpiOrder[kind].map((name) => {
          const section = data[name];
          if (
            section.state === 'unavailable' &&
            section.code === 'NOT_APPLICABLE'
          )
            return null;
          const ready =
            name === 'analytics' && data.analytics.state === 'ready'
              ? data.analytics.data
              : null;
          return (
            <li key={name}>
              <Card padded className="grid h-full min-w-0 content-start gap-1">
                <p className="m-0 text-small text-muted [overflow-wrap:anywhere]">
                  {t(`kpi.${name}`)}
                </p>
                {ready ? (
                  <>
                    <p className="m-0 text-kpi-value">
                      {formatCompactCount(ready.views, locale)}
                    </p>
                    <p className="m-0 text-caption text-muted">
                      {ta('period30d')}
                    </p>
                  </>
                ) : (
                  <>
                    <p
                      className="m-0 text-kpi-value text-muted"
                      aria-hidden="true"
                    >
                      —
                    </p>
                    <StatusBadge
                      tone="neutral"
                      icon="⌛"
                      label={ta('unavailable')}
                      className="justify-self-start"
                    />
                  </>
                )}
              </Card>
            </li>
          );
        })}
      </ul>
    );
  }
  return (
    <section aria-labelledby="business-kpis" className="grid min-w-0 gap-2">
      <h2 id="business-kpis" className="sr-only">
        {t('kpiHeading')}
      </h2>
      {body}
    </section>
  );
}

/** Provider: booking/quotation/payment are designed but not actionable. */
function ComingSoonPanel() {
  const t = useTranslations('business.dashboard.comingSoon');
  const common = useTranslations('business.common');
  return (
    <section className="grid min-w-0 content-start gap-2 rounded-lg border-2 border-dashed border-border-strong bg-surface p-4">
      <StatusBadge
        tone="info"
        icon="🕒"
        label={common('comingSoon')}
        className="justify-self-start"
      />
      <h2 className="m-0 text-h4">{t('title')}</h2>
      <p className="m-0 text-small text-text-2">{t('body')}</p>
    </section>
  );
}

function QuickLinks({ kind }: { kind: BusinessKind }) {
  const t = useTranslations('business.nav');
  const base = dashboardBase(kind);
  const links = [
    {
      href: `${base}/profile`,
      label: t(kind === 'shop' ? 'businessProfile' : 'profile'),
      icon: '🏪',
    },
    { href: `${base}/qr`, label: t('qr'), icon: '🔳' },
    { href: `${base}/media`, label: t('media'), icon: '📷' },
  ];
  return (
    <nav aria-label={t('quickLinks')} className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={buttonVariantClassName('secondary', 'small')}
        >
          <span aria-hidden="true">{link.icon}</span> {link.label}
        </Link>
      ))}
    </nav>
  );
}
