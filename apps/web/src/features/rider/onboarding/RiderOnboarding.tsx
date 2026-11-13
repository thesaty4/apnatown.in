'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { RiderProfile } from '@apnatown/shared/delivery';
import { Card } from '@apnatown/ui/cards/Card';
import { Button, buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { publicHref } from '../../../shared/i18n/preferences';
import { ReadState, RiderStatusBadge, riderBase } from '../parts';
import { ScreenHeader } from '../RiderShell';
import { useRiderMe } from '../queries';
import { RiderWizard } from './RiderWizard';

type StatusView = {
  icon: string;
  key:
    | 'pending'
    | 'rejected'
    | 'changesRequested'
    | 'suspended'
    | 'inactive'
    | 'approved';
};
const statusViews: Partial<Record<RiderProfile['status'], StatusView>> = {
  pending: { icon: '⏳', key: 'pending' },
  rejected: { icon: '✕', key: 'rejected' },
  changes_requested: { icon: '✎', key: 'changesRequested' },
  suspended: { icon: '⏸', key: 'suspended' },
  inactive: { icon: '○', key: 'inactive' },
  approved: { icon: '✓', key: 'approved' },
};

/** Non-draft application states (S-RIDE-01 special states). */
function StatusScreen({
  profile,
  onResubmit,
}: {
  profile: RiderProfile;
  onResubmit: () => void;
}) {
  const t = useTranslations('rider.onboard.state');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const view = statusViews[profile.status]!;
  const resubmit =
    (profile.status === 'rejected' || profile.status === 'changes_requested') &&
    profile.capabilities.canEdit;
  const support =
    profile.status === 'suspended' ||
    profile.status === 'inactive' ||
    (profile.status === 'rejected' && !resubmit);
  return (
    <Card padded className="grid min-w-0 justify-items-start gap-3">
      <span aria-hidden="true" className="text-h1">
        {view.icon}
      </span>
      <h2 className="m-0 text-h3 [overflow-wrap:anywhere]">
        {t(`${view.key}.title`)}
      </h2>
      <RiderStatusBadge status={profile.status} />
      <p className="m-0 text-text-2 [overflow-wrap:anywhere]">
        {t(`${view.key}.body`)}
      </p>
      {profile.reason && (
        <div className="grid w-full min-w-0 gap-1 rounded-md border border-border bg-surface-2 p-3">
          <p className="m-0 text-small font-semibold">{t('reasonLabel')}</p>
          <p className="m-0 [overflow-wrap:anywhere]">{profile.reason}</p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {profile.status === 'approved' && (
          <Link
            href={`${riderBase}/home`}
            className={buttonVariantClassName('primary')}
          >
            {t('goHome')}
          </Link>
        )}
        {resubmit && <Button onClick={onResubmit}>{t('resubmit')}</Button>}
        {support && (
          <Link
            href={publicHref('/help', locale)}
            className={buttonVariantClassName('primary')}
          >
            {t('contactSupport')}
          </Link>
        )}
        <Link
          href={`${riderBase}/profile`}
          className={buttonVariantClassName('outline')}
        >
          {t('viewProfile')}
        </Link>
      </div>
    </Card>
  );
}

/** S-RIDE-01: own application — wizard for a draft, otherwise its status. */
export function RiderOnboarding() {
  const t = useTranslations('rider.onboard');
  const me = useRiderMe();
  const [editing, setEditing] = useState(false);
  const profile = me.data;
  return (
    <div className="mx-auto grid w-full max-w-sheet min-w-0 gap-4">
      <ScreenHeader title={t('title')} />
      {!profile ? (
        <ReadState query={me} />
      ) : profile.status === 'draft' ||
        (editing && profile.capabilities.canEdit) ? (
        <>
          <p className="m-0 text-text-2 [overflow-wrap:anywhere]">
            {t('intro')}
          </p>
          <RiderWizard key={profile.status} profile={profile} />
        </>
      ) : (
        <StatusScreen profile={profile} onResubmit={() => setEditing(true)} />
      )}
    </div>
  );
}
