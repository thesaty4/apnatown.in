'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card } from '@apnatown/ui/cards/Card';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { Button, buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { useSession } from '../../shared/auth/SessionProvider';
import { RiderStatusBadge, riderBase } from './parts';
import { useRiderMe } from './queries';

/**
 * Account entry (like the shop/provider entry): riders open their dashboard;
 * anyone else sees their own application status or "Become a rider". The
 * role is only a navigation hint — every rider screen is API-authorized.
 */
export function AccountRiderEntry() {
  const t = useTranslations('rider.account');
  const { state } = useSession();
  const rider = state.kind === 'ready' && state.data.roles.includes('rider');
  const me = useRiderMe(!rider);
  let body;
  if (rider)
    body = (
      <>
        <span className="min-w-0 flex-1 basis-48 font-semibold [overflow-wrap:anywhere]">
          {t('dashboard')}
        </span>
        <Link
          href={`${riderBase}/home`}
          className={buttonVariantClassName('primary', 'small')}
        >
          {t('open')}
        </Link>
      </>
    );
  else if (me.isPending) body = <Skeleton label={t('loading')} />;
  else if (me.data) {
    const fresh = me.data.status === 'draft' && me.data.version === 0;
    body = (
      <>
        <div className="grid min-w-0 flex-1 basis-48 gap-1">
          <span className="font-semibold [overflow-wrap:anywhere]">
            {t(fresh ? 'become' : 'application')}
          </span>
          {fresh ? (
            <span className="text-small text-text-2">{t('becomeHint')}</span>
          ) : (
            <RiderStatusBadge status={me.data.status} />
          )}
        </div>
        <Link
          href={`${riderBase}/onboarding`}
          className={buttonVariantClassName(
            fresh ? 'primary' : 'outline',
            'small',
          )}
        >
          {t(
            fresh ? 'start' : me.data.status === 'draft' ? 'continue' : 'view',
          )}
        </Link>
      </>
    );
  } else
    body = (
      <div
        role="alert"
        className="flex flex-1 flex-wrap items-center gap-2 text-small"
      >
        <span className="flex-1">{t('failed')}</span>
        <Button
          size="small"
          variant="outline"
          disabled={me.isFetching}
          onClick={() => void me.refetch()}
        >
          {t('retry')}
        </Button>
      </div>
    );
  return (
    <Card padded className="grid gap-3">
      <h2 className="m-0 text-h4">{t('title')}</h2>
      <div className="flex min-w-0 flex-wrap items-center gap-3 rounded-md border border-border p-3">
        <span aria-hidden="true" className="text-h3">
          🛵
        </span>
        {body}
      </div>
    </Card>
  );
}
