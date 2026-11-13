'use client';

import { useEffect } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import type {
  BusinessDecisionAction,
  BusinessDocumentKind,
  BusinessStatus,
} from '@apnatown/shared/businesses';
import { StatusBadge, type BadgeTone } from '@apnatown/ui/primitives/Badge';
import { categoriesOptions } from '../../catalog/queries';
import { areaOptions, cityOptions, geoName } from '../../geo/api';
import { useAdmin } from '../AdminShell';
import { adminErrorKey, isDenied } from '../parts';

/** Message keys are camelCase; API enums are snake_case. */
export const statusKey = {
  draft: 'draft',
  pending: 'pending',
  changes_requested: 'changesRequested',
  approved: 'approved',
  rejected: 'rejected',
  suspended: 'suspended',
  inactive: 'inactive',
} as const satisfies Record<BusinessStatus, string>;
export const actionKey = {
  approve: 'approve',
  reject: 'reject',
  request_changes: 'requestChanges',
  suspend: 'suspend',
  deactivate: 'deactivate',
  restore: 'restore',
} as const satisfies Record<BusinessDecisionAction, string>;
export const documentKindKey = {
  owner_id: 'ownerId',
  business_photo: 'businessPhoto',
  registration_document: 'registrationDocument',
} as const satisfies Record<BusinessDocumentKind, string>;

/** ST-approval presentation: icon + localized text, never colour alone. */
const statusPresentation: Record<
  BusinessStatus,
  { icon: string; tone: BadgeTone }
> = {
  draft: { icon: '✎', tone: 'ap-inactive' },
  pending: { icon: '⏳', tone: 'ap-pending' },
  changes_requested: { icon: '✎', tone: 'ap-pending' },
  approved: { icon: '✓', tone: 'ap-approved' },
  rejected: { icon: '✕', tone: 'ap-rejected' },
  suspended: { icon: '⏸', tone: 'ap-suspended' },
  inactive: { icon: '○', tone: 'ap-inactive' },
};

export function ApprovalStatusBadge({ status }: { status: BusinessStatus }) {
  const t = useTranslations('admin.approvals.status');
  const { icon, tone } = statusPresentation[status];
  return <StatusBadge tone={tone} icon={icon} label={t(statusKey[status])} />;
}

/** Display name in the current locale, falling back to the other language;
 * an application without a name says so instead of showing an ID. */
export function useApplicationName() {
  const t = useTranslations('admin.approvals');
  const locale = useLocale();
  return (item: { nameEn: string | null; nameHi: string | null }) =>
    (locale === 'hi' ? item.nameHi : item.nameEn) ??
    item.nameEn ??
    item.nameHi ??
    t('unnamed');
}

/** IST, 12-hour submitted/decided time through the shared next-intl formatter. */
export function useIstTime() {
  const format = useFormatter();
  return (iso: string) =>
    format.dateTime(new Date(iso), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
}

/** Area name: the admin's own grants first, else the public area reference
 * list of that city (both names from the API, never translated here). Extra
 * pages load only until the area is found. */
export function AreaName({
  cityId,
  areaId,
}: {
  cityId: string | null;
  areaId: string | null;
}) {
  const t = useTranslations('admin.approvals');
  const { api, me } = useAdmin();
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const granted = me.areas.find((area) => area.id === areaId);
  const areas = useInfiniteQuery({
    ...areaOptions(api, cityId ?? ''),
    enabled: Boolean(cityId && areaId && !granted),
  });
  const found =
    granted ??
    areas.data?.pages
      .flatMap((page) => page.items)
      .find((area) => area.id === areaId);
  const { hasNextPage, isFetchingNextPage, isError, fetchNextPage } = areas;
  useEffect(() => {
    if (!found && hasNextPage && !isFetchingNextPage && !isError)
      void fetchNextPage();
  }, [found, hasNextPage, isFetchingNextPage, isError, fetchNextPage]);
  if (!areaId) return <>{t('notSet')}</>;
  if (found) return <>{geoName(found, locale)}</>;
  return <span className="text-muted">{t('unknown')}</span>;
}

/** City name from the public city reference list (pages load until found). */
export function CityName({ cityId }: { cityId: string | null }) {
  const t = useTranslations('admin.approvals');
  const { api } = useAdmin();
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const cities = useInfiniteQuery({
    ...cityOptions(api),
    enabled: Boolean(cityId),
  });
  const found = cities.data?.pages
    .flatMap((page) => page.items)
    .find((city) => city.id === cityId);
  const { hasNextPage, isFetchingNextPage, isError, fetchNextPage } = cities;
  useEffect(() => {
    if (!found && hasNextPage && !isFetchingNextPage && !isError)
      void fetchNextPage();
  }, [found, hasNextPage, isFetchingNextPage, isError, fetchNextPage]);
  if (!cityId) return <>{t('notSet')}</>;
  if (found) return <>{geoName(found, locale)}</>;
  return <span className="text-muted">{t('unknown')}</span>;
}

/** Category name from the public taxonomy reference (EN/HI in the response). */
export function CategoryName({ categoryId }: { categoryId: string | null }) {
  const t = useTranslations('admin.approvals');
  const { api } = useAdmin();
  const locale = useLocale();
  const categories = useQuery({
    ...categoriesOptions(api),
    enabled: Boolean(categoryId),
  });
  if (!categoryId) return <>{t('notSet')}</>;
  const category = categories.data?.items.find(
    (item) => item.id === categoryId,
  );
  if (!category) return <span className="text-muted">{t('unknown')}</span>;
  return <>{locale === 'hi' ? category.nameHi : category.nameEn}</>;
}

/** Approval-specific codes get their own copy; everything else reuses the
 * shared admin catalogue (`admin.errors`). Never server text. */
const approvalErrors: Record<string, string> = {
  ADMIN_SELF_ACTION: 'self',
  BUSINESS_VERSION_CONFLICT: 'conflict',
  BUSINESS_STATE_CONFLICT: 'conflict',
  BUSINESS_NOT_FOUND: 'notFound',
  BUSINESS_SCOPE_DENIED: 'outOfScope',
  ADMIN_SCOPE_FORBIDDEN: 'outOfScope',
};

export const isApprovalConflict = (code: string) =>
  approvalErrors[code] === 'conflict';
/** Authority (not just this item) may have changed: re-read `/admin/me`. */
export const isApprovalDenied = (code: string) =>
  code === 'BUSINESS_SCOPE_DENIED' || isDenied(code);

export function useApprovalError() {
  const ta = useTranslations('admin.approvals.errors');
  const te = useTranslations('admin.errors');
  return (code: string) =>
    approvalErrors[code] ? ta(approvalErrors[code]) : te(adminErrorKey(code));
}
