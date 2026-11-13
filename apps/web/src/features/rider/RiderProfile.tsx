'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@apnatown/ui/cards/Card';
import { EmptyState } from '@apnatown/ui/feedback/StateViews';
import { buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { Logout } from '../../shared/auth/Logout';
import { publicHref } from '../../shared/i18n/preferences';
import { DisputeSheet } from './DisputeSheet';
import {
  Notice,
  ReadState,
  RiderStatusBadge,
  riderBase,
  useIstTime,
} from './parts';
import { ScreenHeader } from './RiderShell';
import { useRiderMe } from './queries';

/**
 * S-RIDE-08: approval status (icon + text), server-masked payout only,
 * documents status, support link, dispute sheet and Logout. Editing is the
 * onboarding flow; sensitive-edit/reapproval policy is not invented here.
 */
export function RiderProfileScreen() {
  const t = useTranslations('rider.profile');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const time = useIstTime();
  const me = useRiderMe();
  const data = me.data;
  return (
    <div className="grid min-w-0 gap-4">
      <ScreenHeader title={t('title')} />
      {!data ? (
        <ReadState query={me} />
      ) : (
        <>
          <Card padded className="grid min-w-0 gap-2">
            <h2 className="m-0 text-h3 [overflow-wrap:anywhere]">
              {data.profile.fullName ?? t('noName')}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-small text-text-2">{t('status')}</span>
              <RiderStatusBadge status={data.status} />
            </div>
            {data.reason && (
              <p className="m-0 text-small [overflow-wrap:anywhere]">
                {t('reason', { reason: data.reason })}
              </p>
            )}
            {(data.profile.areaName || data.profile.cityName) && (
              <p className="m-0 text-small text-text-2 [overflow-wrap:anywhere]">
                {[data.profile.areaName, data.profile.cityName]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
            <Link
              href={`${riderBase}/onboarding`}
              className="inline-flex min-h-touch items-center underline"
            >
              {t(
                data.capabilities.canEdit
                  ? 'editApplication'
                  : 'viewApplication',
              )}
            </Link>
          </Card>
          <Card padded className="grid min-w-0 gap-2">
            <h2 className="m-0 text-h3">{t('payoutTitle')}</h2>
            {data.payoutMasked?.upi || data.payoutMasked?.bank ? (
              <dl className="m-0 grid gap-1 text-small">
                {data.payoutMasked.upi && (
                  <div className="flex flex-wrap gap-2">
                    <dt className="text-muted">{t('upi')}</dt>
                    <dd className="m-0 font-semibold">
                      <bdi>{data.payoutMasked.upi}</bdi>
                    </dd>
                  </div>
                )}
                {data.payoutMasked.bank && (
                  <div className="flex flex-wrap gap-2">
                    <dt className="text-muted">{t('bank')}</dt>
                    <dd className="m-0 font-semibold">
                      <bdi>{data.payoutMasked.bank}</bdi>
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="m-0 text-small text-text-2">{t('noPayout')}</p>
            )}
          </Card>
          <Card padded className="grid min-w-0 gap-2">
            <h2 className="m-0 text-h3">{t('documentsTitle')}</h2>
            {data.documents.length > 0 && (
              <ul className="m-0 grid list-none gap-1 p-0 text-small">
                {data.documents.map((document) => (
                  <li key={document.assetId}>
                    <span aria-hidden="true">✓ </span>
                    {t('documentUploaded', {
                      kind: t(
                        `documentKinds.${document.kind === 'id_proof' ? 'idProof' : document.kind}`,
                      ),
                      at: time(document.uploadedAt),
                    })}
                  </li>
                ))}
              </ul>
            )}
            {data.requirements.availability === 'unavailable' && (
              <Notice
                tone="info"
                role="status"
                title={t('documentsUnavailable')}
              >
                <p className="m-0">{t('documentsUnavailableBody')}</p>
              </Notice>
            )}
          </Card>
          <Card padded className="grid min-w-0 gap-3">
            <h2 className="m-0 text-h3">{t('supportTitle')}</h2>
            <div className="flex flex-wrap gap-2">
              <Link
                href={publicHref('/help', locale)}
                className={buttonVariantClassName('outline')}
              >
                <span aria-hidden="true">❓</span> {t('help')}
              </Link>
              <DisputeSheet />
            </div>
          </Card>
        </>
      )}
      <Logout />
    </div>
  );
}

/** S-RIDE-07: no Reviews endpoint ships yet → explicit unavailable state. */
export function RiderFeedbackScreen() {
  const t = useTranslations('rider.feedback');
  return (
    <div className="grid min-w-0 gap-4">
      <ScreenHeader title={t('title')} />
      <EmptyState
        headingLevel="h2"
        role="status"
        icon="⭐"
        title={t('unavailableTitle')}
        message={t('unavailableMessage')}
        action={null}
      />
    </div>
  );
}
