'use client';

import { useLocale, useTranslations } from 'next-intl';
import type {
  AdminListingReport,
  ListingReportReason,
} from '@apnatown/shared/admin';
import { Badge, StatusBadge } from '@apnatown/ui/primitives/Badge';
import { adminErrorKey, isDenied } from '../parts';

/** Listing-specific codes get their own copy (`admin.listings.errors`);
 * everything else reuses `admin.errors`. Never server text. */
const listingErrors: Record<string, string> = {
  BUSINESS_VERSION_CONFLICT: 'conflict',
  PRODUCT_VERSION_CONFLICT: 'conflict',
  ADMIN_VERSION_CONFLICT: 'conflict',
  BUSINESS_STATE_CONFLICT: 'stateConflict',
  ADMIN_SELF_ACTION: 'self',
  ADMIN_SCOPE_FORBIDDEN: 'outOfScope',
  BUSINESS_SCOPE_DENIED: 'outOfScope',
  ADMIN_INFLIGHT_POLICY_REQUIRED: 'inflight',
  ADMIN_CREATION_POLICY_REQUIRED: 'creationBlocked',
  BUSINESS_NOT_FOUND: 'notFound',
  PRODUCT_NOT_FOUND: 'productNotFound',
  COMMON_NOT_FOUND: 'notFound',
};

export const isListingConflict = (code: string) =>
  listingErrors[code] === 'conflict' || listingErrors[code] === 'stateConflict';
/** Authority (not just this item) may have changed: re-read `/admin/me`. */
export const isListingDenied = (code: string) =>
  code === 'BUSINESS_SCOPE_DENIED' || isDenied(code);

export function useListingError() {
  const tl = useTranslations('admin.listings.errors');
  const te = useTranslations('admin.errors');
  return (code: string) =>
    listingErrors[code] ? tl(listingErrors[code]) : te(adminErrorKey(code));
}

/** Display name in the current locale with the other language as fallback. */
export function useListingName() {
  const t = useTranslations('admin.listings');
  const locale = useLocale();
  return (item: { nameEn: string | null; nameHi: string | null }) =>
    (locale === 'hi' ? item.nameHi : item.nameEn) ??
    item.nameEn ??
    item.nameHi ??
    t('unnamed');
}

/** Open-report count: flag icon + text, never colour alone. */
export function OpenReportsBadge({ count }: { count: number }) {
  const t = useTranslations('admin.listings.reports');
  if (count <= 0) return null;
  return <Badge tone="bad" icon="🚩" label={t('openCount', { count })} />;
}

export function ReportReasonLabel({ reason }: { reason: ListingReportReason }) {
  const t = useTranslations('admin.listings.reports.reasons');
  return <>{t(reason)}</>;
}

export function ReportStatusBadge({ report }: { report: AdminListingReport }) {
  const t = useTranslations('admin.listings.reports');
  if (report.status === 'open')
    return <StatusBadge tone="ap-pending" icon="⏳" label={t('status.open')} />;
  return (
    <StatusBadge
      tone="ap-approved"
      icon="✓"
      label={
        report.resolution === 'action_taken'
          ? t('status.actionTaken')
          : t('status.dismissed')
      }
    />
  );
}
