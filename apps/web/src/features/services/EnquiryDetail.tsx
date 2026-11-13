'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { BusinessKind, BusinessOwner } from '@apnatown/shared/businesses';
import type {
  EnquiryDetail,
  EnquiryTargetStatus,
} from '@apnatown/shared/services';
import { Card } from '@apnatown/ui/cards/Card';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import {
  ErrorState,
  NoPermissionState,
  OfflineState,
} from '@apnatown/ui/feedback/StateViews';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import {
  Button,
  buttonVariantClassName,
} from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../shared/api/result';
import { useOnline } from '../../shared/hooks/use-online';
import { NavIcon } from '../../shared/ui/NavIcon';
import { OwnerGate } from '../businesses/BusinessDashboard';
import {
  Alert,
  LockedNote,
  StatusBanner,
  deniedCodes,
  errorKey,
} from '../businesses/parts';
import { formatPhone, telHref, whatsappHref } from './api';
import { inboxHref, readInboxFilters } from './filters';
import {
  EnquiryStatusBadge,
  ToastRegion,
  useIstDateTime,
  usePreferredDate,
  useToast,
} from './parts';
import { useEnquiry, useEnquiryStatus } from './queries';

/** Terminal edges need an explicit confirmation (no reset to `new`). */
const TERMINAL: ReadonlySet<EnquiryTargetStatus> = new Set([
  'converted',
  'closed',
]);

/** S-VEND-14 / S-PROV-03 enquiry detail shared by vendor and provider. */
export function EnquiryDetailScreen({
  kind,
  id,
}: {
  kind: BusinessKind;
  id: string;
}) {
  return (
    <OwnerGate kind={kind}>
      {(business) => <DetailGate business={business} id={id} />}
    </OwnerGate>
  );
}

function BackLink({ kind }: { kind: BusinessKind }) {
  const t = useTranslations('service.enquiries');
  const params = useSearchParams();
  const filters = useMemo(
    () => readInboxFilters((name) => params.get(name)),
    [params],
  );
  return (
    <Link
      href={inboxHref(kind, filters)}
      className={`${buttonVariantClassName('text', 'small')} justify-self-start`}
    >
      <NavIcon name="cl" className="size-4" />
      {t('back')}
    </Link>
  );
}

function DetailGate({
  business,
  id,
}: {
  business: BusinessOwner;
  id: string;
}) {
  const t = useTranslations('service.enquiries');
  if (!business.capabilities.sell)
    return (
      <div className="grid min-w-0 gap-4">
        <BackLink kind={business.kind} />
        <h1 className="m-0 text-h1">{t('title')}</h1>
        <StatusBanner business={business} />
        <LockedNote />
      </div>
    );
  return <Detail kind={business.kind} id={id} />;
}

function Detail({ kind, id }: { kind: BusinessKind; id: string }) {
  const t = useTranslations('service.enquiries');
  const te = useTranslations('business.errors');
  const online = useOnline();
  const enquiry = useEnquiry(kind, id, true);
  const retry = (
    <Button
      disabled={enquiry.isFetching}
      onClick={() => void enquiry.refetch()}
    >
      {t('retry')}
    </Button>
  );

  let body;
  if (enquiry.data) body = <Loaded kind={kind} enquiry={enquiry.data} />;
  else if (enquiry.isPending)
    body =
      enquiry.fetchStatus === 'paused' || !online ? (
        <OfflineState
          icon="📡"
          title={t('offlineTitle')}
          message={t('offlineMessage')}
          action={null}
        />
      ) : (
        <Skeleton label={t('detailLoading')} />
      );
  else {
    const code = failureCode(enquiry.error);
    // Another business's enquiry is indistinguishable from a missing one; no
    // PII is ever shown for it.
    if (code === 'COMMON_NOT_FOUND' || deniedCodes.has(code))
      body = (
        <NoPermissionState
          icon="🔒"
          title={t('notFoundTitle')}
          message={t('notFoundMessage')}
          action={null}
        />
      );
    else if (!online)
      body = (
        <OfflineState
          icon="📡"
          title={t('offlineTitle')}
          message={t('offlineMessage')}
          action={retry}
        />
      );
    else
      body = (
        <ErrorState
          icon="⚠️"
          title={t('errorTitle')}
          message={te(errorKey(code))}
          action={retry}
        />
      );
  }
  return (
    <div className="grid min-w-0 gap-5">
      <BackLink kind={kind} />
      {body}
    </div>
  );
}

function Loaded({
  kind,
  enquiry,
}: {
  kind: BusinessKind;
  enquiry: EnquiryDetail;
}) {
  const t = useTranslations('service.enquiries');
  const te = useTranslations('business.errors');
  const locale = useLocale();
  const online = useOnline();
  const dateTime = useIstDateTime();
  const preferredDate = usePreferredDate();
  const reload = useEnquiry(kind, enquiry.id, true);
  const update = useEnquiryStatus(kind, enquiry.id);
  const { toast, show, dismiss } = useToast();
  const [confirm, setConfirm] = useState<EnquiryTargetStatus>();
  /** The last requested edge and whether Call/WhatsApp requested it. */
  const [request, setRequest] = useState<{
    status: EnquiryTargetStatus;
    source: 'contact' | 'action';
  }>();

  const pending = update.mutation.isPending;
  const code = update.mutation.isError
    ? failureCode(update.mutation.error)
    : undefined;
  const stale =
    code === 'SERVICES_VERSION_CONFLICT' ||
    code === 'SERVICES_INVALID_TRANSITION';
  const contactFailed = Boolean(
    code && !stale && request?.source === 'contact',
  );

  const change = (status: EnquiryTargetStatus, source: 'contact' | 'action') => {
    if (pending || !enquiry.allowedStatuses.includes(status)) return;
    setRequest({ status, source });
    setConfirm(undefined);
    update.mutation.reset();
    update.run({ status, expectedVersion: enquiry.version }, () =>
      show(t('statusUpdated')),
    );
  };

  // Call/WhatsApp open immediately (user-initiated links); only a `new`
  // enquiry additionally requests `contacted`. A failed save never claims the
  // message was delivered.
  const contacted = () => {
    if (enquiry.status === 'new' && enquiry.allowedStatuses.includes('contacted'))
      change('contacted', 'contact');
  };

  const name = enquiry.name;
  const serviceName =
    (locale === 'hi' ? enquiry.service.nameHi : null) ?? enquiry.service.nameEn;
  const call = telHref(enquiry.phone);
  const whatsapp = whatsappHref(
    enquiry.phone,
    t('whatsappText', { name }),
  );

  return (
    <>
      <header className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 min-w-0 text-h1 [overflow-wrap:anywhere]">
          {name}
        </h1>
        <EnquiryStatusBadge status={enquiry.status} />
      </header>
      <Card padded className="grid gap-4">
        <p className="m-0 whitespace-pre-wrap [overflow-wrap:anywhere]">
          {enquiry.message}
        </p>
        <dl className="m-0 grid gap-x-4 gap-y-2 tablet:grid-cols-[max-content_1fr]">
          <dt className="text-small text-muted">{t('service')}</dt>
          <dd className="m-0 [overflow-wrap:anywhere]">{serviceName}</dd>
          <dt className="text-small text-muted">{t('phone')}</dt>
          <dd className="m-0" dir="ltr">
            {formatPhone(enquiry.phone)}
          </dd>
          <dt className="text-small text-muted">{t('preferredDate')}</dt>
          <dd className="m-0">
            {enquiry.preferredDate
              ? preferredDate(enquiry.preferredDate)
              : t('anyDate')}
          </dd>
          <dt className="text-small text-muted">{t('received')}</dt>
          <dd className="m-0">
            <time dateTime={enquiry.createdAt}>
              {dateTime(enquiry.createdAt)}
            </time>
          </dd>
          {enquiry.convertedAt && (
            <>
              <dt className="text-small text-muted">{t('convertedAt')}</dt>
              <dd className="m-0">
                <time dateTime={enquiry.convertedAt}>
                  {dateTime(enquiry.convertedAt)}
                </time>
              </dd>
            </>
          )}
        </dl>
        <div className="grid gap-3 tablet:grid-cols-2">
          {call && (
            <a
              href={call}
              className={buttonVariantClassName('primary')}
              aria-label={t('callLabel', { name })}
              onClick={contacted}
            >
              <NavIcon name="phone" className="size-4.5" />
              {t('call')}
            </a>
          )}
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariantClassName('secondary')}
              onClick={contacted}
            >
              <NavIcon name="chat" className="size-4.5" />
              {t('whatsapp')}
              <span className="sr-only"> {t('newWindow')}</span>
            </a>
          )}
        </div>
        {contactFailed && (
          <Alert tone="warn" role="alert">
            {t('contactSaveFailed')}
          </Alert>
        )}
      </Card>
      <Card padded className="grid gap-3">
        <h2 className="m-0 text-h3">{t('updateStatus')}</h2>
        {stale ? (
          <Alert
            tone="warn"
            role="alert"
            action={
              <Button
                size="small"
                variant="outline"
                disabled={reload.isFetching || !online}
                loading={reload.isFetching}
                onClick={() => {
                  update.mutation.reset();
                  void reload.refetch();
                }}
              >
                {t('reload')}
              </Button>
            }
          >
            {code === 'SERVICES_VERSION_CONFLICT'
              ? t('versionConflict')
              : t('invalidTransition')}
          </Alert>
        ) : (
          code &&
          !contactFailed && (
            <Alert tone="bad" role="alert">
              {te(errorKey(code))}
            </Alert>
          )
        )}
        {enquiry.allowedStatuses.length === 0 ? (
          <p className="m-0 text-small text-text-2">{t('noActions')}</p>
        ) : (
          <div className="flex min-w-0 flex-wrap gap-2">
            {enquiry.allowedStatuses.map((status) => (
              <Button
                key={status}
                variant={status === 'closed' ? 'ghost' : 'outline'}
                disabled={!online || pending || stale}
                loading={pending && request?.status === status}
                onClick={() =>
                  TERMINAL.has(status)
                    ? setConfirm(status)
                    : change(status, 'action')
                }
              >
                {t('markAs', { status: t(`status.${status}`) })}
              </Button>
            ))}
          </div>
        )}
      </Card>
      <ConfirmDialog
        open={confirm !== undefined}
        onOpenChange={(open) => {
          if (!open && !pending) setConfirm(undefined);
        }}
        title={
          confirm === 'closed'
            ? t('confirmClosedTitle')
            : t('confirmConvertedTitle')
        }
        impact={
          confirm === 'closed'
            ? t('confirmClosedImpact')
            : t('confirmConvertedImpact')
        }
        cancelLabel={t('cancel')}
        confirmLabel={t('confirm')}
        tone={confirm === 'closed' ? 'danger' : 'primary'}
        busy={pending}
        confirmDisabled={!online}
        onConfirm={() => {
          if (confirm) change(confirm, 'action');
        }}
      />
      <ToastRegion
        toast={toast}
        dismiss={dismiss}
        dismissLabel={t('dismiss')}
      />
    </>
  );
}
