'use client';

import type { ReactNode } from 'react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { formatDistanceKm, formatMoney } from '@apnatown/shared/formatters';
import { RIDER_TIME_ZONE, type RiderStatus } from '@apnatown/shared/delivery';
import { Card } from '@apnatown/ui/cards/Card';
import { StatusBadge, type BadgeTone } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import {
  ErrorState,
  NoPermissionState,
  OfflineState,
} from '@apnatown/ui/feedback/StateViews';
import { failureCode } from '../../shared/api/result';
import { useOnline } from '../../shared/hooks/use-online';

/** Rider dashboard base; every working screen lives under it. */
export const riderBase = '/rider';

const statusPresentation: Record<
  RiderStatus,
  { icon: string; tone: BadgeTone; key: string }
> = {
  draft: { icon: '✎', tone: 'neutral', key: 'draft' },
  pending: { icon: '⏳', tone: 'ap-pending', key: 'pending' },
  approved: { icon: '✓', tone: 'ap-approved', key: 'approved' },
  rejected: { icon: '✕', tone: 'ap-rejected', key: 'rejected' },
  changes_requested: {
    icon: '✎',
    tone: 'ap-pending',
    key: 'changesRequested',
  },
  suspended: { icon: '⏸', tone: 'ap-suspended', key: 'suspended' },
  inactive: { icon: '○', tone: 'ap-inactive', key: 'inactive' },
};

/** Approval status: icon + localized text, never colour alone. */
export function RiderStatusBadge({ status }: { status: RiderStatus }) {
  const t = useTranslations('rider.status');
  const presentation = statusPresentation[status];
  return (
    <StatusBadge
      tone={presentation.tone}
      icon={presentation.icon}
      label={t(presentation.key)}
    />
  );
}

export type NoticeTone = 'ok' | 'warn' | 'bad' | 'info';
const noticeTone: Record<NoticeTone, { box: string; icon: string }> = {
  ok: { box: 'border-success bg-success-soft', icon: '✓' },
  warn: { box: 'border-warning bg-warning-soft', icon: '⚠️' },
  bad: { box: 'border-error bg-error-soft', icon: '⛔' },
  info: { box: 'border-info bg-info-soft', icon: 'ℹ️' },
};

/** Tinted, bordered note: icon + text (never colour-only). */
export function Notice({
  tone,
  title,
  children,
  action,
  role,
  icon,
}: {
  tone: NoticeTone;
  title?: string | undefined;
  children?: ReactNode;
  action?: ReactNode;
  role?: 'status' | 'alert' | 'note' | undefined;
  icon?: string | undefined;
}) {
  return (
    <div
      role={role}
      className={`flex min-w-0 flex-wrap items-start gap-3 rounded-md border px-3.5 py-3 text-small text-text ${noticeTone[tone].box}`}
    >
      <span aria-hidden="true" className="shrink-0">
        {icon ?? noticeTone[tone].icon}
      </span>
      <div className="grid min-w-0 flex-1 basis-48 gap-1 [overflow-wrap:anywhere]">
        {title && <p className="m-0 font-semibold">{title}</p>}
        {children}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

/** Integer paise -> INR with Indian grouping via the shared formatter. */
export function useMoney() {
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  return (paise: number) => formatMoney(paise, locale);
}

/** Signed paise (e.g. rounding): explicit minus sign + absolute amount. */
export function useSignedMoney() {
  const money = useMoney();
  return (paise: number) =>
    paise < 0 ? `\u2212${money(-paise)}` : money(paise);
}

/** UTC instant -> IST 12-hour display (display zone only; bounds stay UTC). */
export function useIstTime() {
  const format = useFormatter();
  return (iso: string) =>
    format.dateTime(new Date(iso), {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: RIDER_TIME_ZONE,
    });
}

/** KPI tile (prototype `KpiCard`): label + already formatted value. */
export function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card padded className="grid h-full min-w-0 content-start gap-1">
      <p className="m-0 text-small text-muted [overflow-wrap:anywhere]">
        {label}
      </p>
      <p className="m-0 text-kpi-value [overflow-wrap:anywhere]">{value}</p>
    </Card>
  );
}

/** Distance in metres → localized km via the shared formatter. */
export function useKm() {
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  return (metres: number) => formatDistanceKm(metres / 1000, locale);
}

/** Returned reporting period, shown so totals never rely on browser time. */
export function PeriodBounds({
  start,
  end,
}: {
  start: string | null;
  end: string;
}) {
  const t = useTranslations('rider.common');
  const time = useIstTime();
  return (
    <p className="m-0 text-small text-text-2 [overflow-wrap:anywhere]">
      {start
        ? t('period', { start: time(start), end: time(end) })
        : t('periodUntil', { end: time(end) })}
    </p>
  );
}

const errorKeys: Record<string, string> = {
  RIDER_NOT_APPROVED: 'riderNotApproved',
  RIDER_NOT_ONLINE: 'riderNotOnline',
  RIDER_HAS_ACTIVE_JOB: 'riderHasActiveJob',
  RIDER_STATE_CONFLICT: 'riderStateConflict',
  RIDER_REQUIREMENTS_UNAVAILABLE: 'requirementsUnavailable',
  DELIVERY_JOB_NOT_FOUND: 'jobNotFound',
  DELIVERY_VERSION_CONFLICT: 'versionConflict',
  COMMON_VALIDATION_FAILED: 'validation',
  VALIDATION_ERROR: 'validation',
  AREA_NOT_FOUND: 'areaInvalid',
  CITY_NOT_FOUND: 'areaInvalid',
  COMMON_RATE_LIMITED: 'rateLimited',
  COMMON_FORBIDDEN: 'forbidden',
};

/** `errors.delivery` / `rider.errors` key for a normalized code; never server text. */
export function useRiderError() {
  const delivery = useTranslations('errors.delivery');
  const local = useTranslations('rider.errors');
  return (error: unknown) => {
    const key = errorKeys[failureCode(error)] ?? 'requestFailed';
    return key in deliveryKeys ? delivery(key) : local(key);
  };
}
const deliveryKeys = {
  riderNotApproved: true,
  riderNotOnline: true,
  riderHasActiveJob: true,
  riderStateConflict: true,
  requirementsUnavailable: true,
  jobNotFound: true,
  versionConflict: true,
} as const;

const deniedCodes = new Set(['COMMON_FORBIDDEN', 'RIDER_NOT_APPROVED']);

/**
 * Shared non-success states for a rider read: skeleton (initial load only),
 * offline, no-permission and error+retry. Empty states are decided by the
 * caller, only after a successful empty response.
 */
export function ReadState({
  query,
  headingLevel = 'h2',
}: {
  query: {
    isPending: boolean;
    isFetching: boolean;
    fetchStatus: string;
    error: unknown;
    refetch: () => unknown;
  };
  headingLevel?: 'h1' | 'h2';
}) {
  const t = useTranslations('rider.common');
  const message = useRiderError();
  const online = useOnline();
  const retry = (
    <Button disabled={query.isFetching} onClick={() => void query.refetch()}>
      {t('retry')}
    </Button>
  );
  if (query.isPending && query.fetchStatus !== 'paused' && online)
    return <Skeleton label={t('loading')} />;
  if (!online || query.fetchStatus === 'paused')
    return (
      <OfflineState
        headingLevel={headingLevel}
        title={t('offlineTitle')}
        message={t('offlineMessage')}
        action={query.isPending ? null : retry}
      />
    );
  if (deniedCodes.has(failureCode(query.error)))
    return (
      <NoPermissionState
        headingLevel={headingLevel}
        title={t('forbiddenTitle')}
        message={message(query.error)}
        action={null}
      />
    );
  return (
    <ErrorState
      headingLevel={headingLevel}
      title={t('errorTitle')}
      message={message(query.error)}
      action={retry}
    />
  );
}
