'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type {
  BusinessKind,
  BusinessOwner,
  BusinessStatus,
  BusinessSummary,
} from '@apnatown/shared/businesses';
import { StatusBadge, type BadgeTone } from '@apnatown/ui/primitives/Badge';
import { Button, buttonVariantClassName } from '@apnatown/ui/primitives/Button';

/** Private dashboard base per business kind (`/vendor/*` vs `/provider/*`). */
export const dashboardBase = (kind: BusinessKind) =>
  kind === 'shop' ? '/vendor' : '/provider';

/** Public profile path; only meaningful once the server allocates a slug. */
export const publicPath = (kind: BusinessKind, slug: string) =>
  `/${kind === 'shop' ? 'shop' : 'provider'}/${slug}`;

export function businessName(
  business: Pick<BusinessSummary, 'nameEn' | 'nameHi'>,
  locale: string,
) {
  return (
    (locale === 'hi' ? business.nameHi : business.nameEn) ??
    business.nameEn ??
    business.nameHi
  );
}

/** `+91 ••••••3210`: confirms the verified number without exposing it. */
export function maskPhone(e164: string) {
  const national = e164.replace(/^\+91/, '');
  return `+91 ${'•'.repeat(Math.max(national.length - 4, 0))}${national.slice(-4)}`;
}

/** 10-digit Indian mobile shown in forms; the wire format stays E.164. */
export const nationalMobile = (e164: string | null) =>
  e164 ? e164.replace(/^\+91/, '') : '';

const statusPresentation: Record<
  BusinessStatus,
  { icon: string; tone: BadgeTone }
> = {
  draft: { icon: '✎', tone: 'neutral' },
  pending: { icon: '⏳', tone: 'ap-pending' },
  approved: { icon: '✓', tone: 'ap-approved' },
  rejected: { icon: '✕', tone: 'ap-rejected' },
  changes_requested: { icon: '✎', tone: 'ap-pending' },
  suspended: { icon: '⏸', tone: 'ap-suspended' },
  inactive: { icon: '○', tone: 'ap-inactive' },
};

export function BusinessStatusBadge({ status }: { status: BusinessStatus }) {
  const t = useTranslations('business.status');
  const presentation = statusPresentation[status];
  return (
    <StatusBadge
      tone={presentation.tone}
      icon={presentation.icon}
      label={t(status === 'changes_requested' ? 'changesRequested' : status)}
    />
  );
}

export type AlertTone = 'ok' | 'warn' | 'bad' | 'info';
const alertTone: Record<AlertTone, { box: string; icon: string }> = {
  ok: { box: 'border-success bg-success-soft', icon: '✓' },
  warn: { box: 'border-warning bg-warning-soft', icon: '⚠️' },
  bad: { box: 'border-error bg-error-soft', icon: '⛔' },
  info: { box: 'border-info bg-info-soft', icon: 'ℹ️' },
};

/** Prototype `.alert`: tinted, bordered, icon + text (never colour-only). */
export function Alert({
  tone,
  title,
  children,
  action,
  role,
  icon,
}: {
  tone: AlertTone;
  title?: string | undefined;
  children?: ReactNode;
  action?: ReactNode;
  role?: 'status' | 'alert' | 'note' | undefined;
  icon?: string | undefined;
}) {
  return (
    <div
      role={role}
      className={`flex min-w-0 flex-wrap items-start gap-3 rounded-md border px-3.5 py-3 text-small text-text ${alertTone[tone].box}`}
    >
      <span aria-hidden="true" className="shrink-0">
        {icon ?? alertTone[tone].icon}
      </span>
      <div className="grid min-w-0 flex-1 basis-48 gap-1 [overflow-wrap:anywhere]">
        {title && <p className="m-0 font-semibold">{title}</p>}
        {children}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

const gate: Partial<
  Record<
    BusinessStatus,
    {
      tone: AlertTone;
      key: string;
      action?: 'resubmit' | 'reactivate' | 'finish';
    }
  >
> = {
  draft: { tone: 'info', key: 'draft', action: 'finish' },
  pending: { tone: 'warn', key: 'pending' },
  rejected: { tone: 'bad', key: 'rejected', action: 'resubmit' },
  changes_requested: {
    tone: 'warn',
    key: 'changesRequested',
    action: 'resubmit',
  },
  suspended: { tone: 'bad', key: 'suspended' },
  inactive: { tone: 'info', key: 'inactive', action: 'reactivate' },
};

/**
 * ST-approval banner (prototype `gateNote`). Actions render only when the
 * server capability allows them; the admin note is plain text, never HTML.
 */
export function StatusBanner({
  business,
  onReactivate,
  reactivating = false,
  hideFinish = false,
}: {
  business: BusinessOwner;
  onReactivate?: (() => void) | undefined;
  reactivating?: boolean;
  /** The onboarding screen itself needs no "continue" link. */
  hideFinish?: boolean;
}) {
  const t = useTranslations('business.onboarding');
  const entry = gate[business.status];
  if (!entry) return null;
  const onboarding = `${dashboardBase(business.kind)}/onboarding`;
  let action: ReactNode = null;
  if (
    entry.action === 'resubmit' &&
    business.capabilities.submit &&
    !hideFinish
  )
    action = (
      <Link
        href={onboarding}
        className={buttonVariantClassName('primary', 'small')}
      >
        {t('resubmit')}
      </Link>
    );
  else if (entry.action === 'finish' && !hideFinish)
    action = (
      <Link
        href={onboarding}
        className={buttonVariantClassName('primary', 'small')}
      >
        {t('continue')}
      </Link>
    );
  else if (
    entry.action === 'reactivate' &&
    business.capabilities.reactivate &&
    onReactivate
  )
    action = (
      <Button size="small" disabled={reactivating} onClick={onReactivate}>
        {t('reactivate')}
      </Button>
    );
  return (
    <Alert
      tone={entry.tone}
      role="status"
      title={t(`${entry.key}.title`)}
      action={action}
    >
      <p className="m-0">{t(`${entry.key}.body`)}</p>
      {business.reviewReason &&
        ['rejected', 'changes_requested', 'suspended'].includes(
          business.status,
        ) && (
          <p className="m-0">
            <strong>{t('adminNote')}</strong>{' '}
            <bdi className="whitespace-pre-line">{business.reviewReason}</bdi>
          </p>
        )}
    </Alert>
  );
}

/** Prototype locked screen for features that open after approval. */
export function LockedNote({
  headingLevel = 'h2',
}: {
  headingLevel?: 'h2' | 'h3';
}) {
  const t = useTranslations('business.dashboard');
  const Heading = headingLevel;
  return (
    <div className="grid justify-items-center gap-2 px-4 py-6 text-center">
      <span aria-hidden="true" className="text-h2">
        🔒
      </span>
      <Heading className="m-0 text-h4">{t('lockedTitle')}</Heading>
      <p className="m-0 max-w-state-copy text-small text-text-2">
        {t('lockedBody')}
      </p>
    </div>
  );
}

/** Localized `business.errors.*` key for a normalized failure code. */
export function errorKey(code: string) {
  switch (code) {
    case 'BUSINESS_VERSION_CONFLICT':
      return 'versionConflict';
    case 'BUSINESS_STATE_CONFLICT':
      return 'stateConflict';
    case 'BUSINESS_ALREADY_EXISTS':
      return 'alreadyExists';
    case 'BUSINESS_CONTEXT_REQUIRED':
      return 'contextRequired';
    case 'VALIDATION_ERROR':
    case 'COMMON_VALIDATION':
      return 'validation';
    case 'BUSINESS_MEDIA_INVALID':
      return 'mediaInvalid';
    case 'COMMON_RATE_LIMITED':
      return 'rateLimited';
    case 'BUSINESS_NOT_OWNED':
    case 'COMMON_FORBIDDEN':
      return 'forbidden';
    default:
      return 'requestFailed';
  }
}

export const deniedCodes = new Set([
  'COMMON_FORBIDDEN',
  'BUSINESS_NOT_OWNED',
  'BUSINESS_SCOPE_DENIED',
]);

/** Today's IST date in the active locale (prototype header subline). */
export function istToday(locale: string) {
  return new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());
}
