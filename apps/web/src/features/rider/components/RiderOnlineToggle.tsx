'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { RiderSummary } from '@apnatown/shared/delivery';
import { Card } from '@apnatown/ui/cards/Card';
import { Switch } from '@apnatown/ui/primitives/Selection';
import { Notice, RiderStatusBadge, riderBase, useRiderError } from '../parts';
import { useRiderOnline } from '../queries';

/**
 * Online/offline toggle (S-RIDE-02). The switch always shows the server value:
 * no optimistic state, so a refused change (active job, not approved) simply
 * stays reverted with the localized server reason. Only approved riders can
 * toggle; everyone else sees the disabled switch with an explanation.
 */
export function RiderOnlineToggle({ summary }: { summary: RiderSummary }) {
  const t = useTranslations('rider.home');
  const message = useRiderError();
  const { mutation, toggle } = useRiderOnline();
  const approved = summary.approvalStatus === 'approved';
  const busy = mutation.isPending;
  return (
    <Card padded className="grid min-w-0 gap-3">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <span aria-hidden="true" className="text-h2">
          {summary.online ? '🟢' : '⚪'}
        </span>
        <div className="grid min-w-0 flex-1 basis-48 gap-1">
          <p className="m-0 font-semibold [overflow-wrap:anywhere]">
            {t(summary.online ? 'onlineTitle' : 'offlineTitle')}
          </p>
          <p className="m-0 text-small text-text-2 [overflow-wrap:anywhere]">
            {t(summary.online ? 'onlineBody' : 'offlineBody')}
          </p>
        </div>
      </div>
      <Switch
        label={t('toggleLabel')}
        {...(approved ? {} : { description: t('notApprovedHint') })}
        checked={summary.online}
        disabled={!approved || busy}
        aria-busy={busy || undefined}
        onChange={(event) => {
          mutation.reset();
          toggle(event.target.checked);
        }}
      />
      {!approved && (
        <Notice
          tone="warn"
          role="status"
          title={t('notApprovedTitle')}
          action={
            <Link
              href={`${riderBase}/profile`}
              className="inline-flex min-h-touch items-center underline"
            >
              {t('viewStatus')}
            </Link>
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <span>{t('statusLabel')}</span>
            <RiderStatusBadge status={summary.approvalStatus} />
          </div>
        </Notice>
      )}
      {mutation.isError && (
        <Notice tone="bad" role="alert" title={t('toggleFailed')}>
          <p className="m-0">{message(mutation.error)}</p>
        </Notice>
      )}
    </Card>
  );
}
