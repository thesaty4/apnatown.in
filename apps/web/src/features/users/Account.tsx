'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import type { DehydratedState } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Card } from '@apnatown/ui/cards/Card';
import { Avatar } from '@apnatown/ui/data/Avatar';
import { useSession } from '../../shared/auth/SessionProvider';
import { AccessState } from '../../shared/auth/AccessState';
import { Logout } from '../../shared/auth/Logout';
import { DemoRoleCard } from '../auth/demo/DemoControls';
import { NavIcon } from '../../shared/ui/NavIcon';
import { AccountBusinessEntry } from '../businesses/AccountBusinessEntry';
import { AccountRiderEntry } from '../rider/AccountRiderEntry';
import { accountScope } from '../../shared/api/query-keys';
import { profileOptions } from './api';
import { OwnResource } from './OwnResource';
import { DeletionProgress, PrivacyActions, type Deletion } from './Privacy';

export function Account({
  initial,
  owner,
  demo = false,
}: {
  initial: DehydratedState;
  owner?: string | undefined;
  /** Local/test demo controls (docs/adr/0002); read server-side. */
  demo?: boolean;
}) {
  const { state, epoch } = useSession();
  const t = useTranslations('account.menu');
  const orders = useTranslations('orders.nav');
  // An active deletion outlives session revocation: it is tracked here, above
  // the session gate, with its capability only in this component's memory.
  const [deletion, setDeletion] = useState<Deletion>();
  const completed = useCallback(
    () =>
      setDeletion(
        (current) =>
          current && {
            requestId: current.requestId,
            userId: current.userId,
            completed: true,
          },
      ),
    [],
  );
  const dismiss = useCallback(() => setDeletion(undefined), []);
  return (
    <div className="grid gap-4">
      <h1 className="text-h1">{t('title')}</h1>
      {deletion ? (
        <DeletionProgress
          deletion={deletion}
          onCompleted={completed}
          onDismiss={dismiss}
        />
      ) : state.kind !== 'ready' ? (
        <AccessState guest />
      ) : (
        <>
          <OwnResource initial={initial} owner={owner} options={profileOptions}>
            {(profile) => (
              <Card padded className="flex flex-wrap items-center gap-4">
                <Avatar
                  label=""
                  emoji={profile.displayName?.slice(0, 1) || '👤'}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {profile.displayName || t('complete')}
                  </p>
                  <p className="text-small text-text-2">
                    <bdi>{profile.phone}</bdi>
                  </p>
                </div>
                <Link
                  href="/account/profile"
                  className="inline-flex min-h-touch items-center underline"
                >
                  {t('edit')}
                </Link>
              </Card>
            )}
          </OwnResource>
          <Card padded>
            <nav aria-label={t('title')} className="grid gap-2 tablet:grid-cols-2">
              {([
                ['/account/profile', '👤', t('profile')],
                ['/orders', '📦', orders('label')],
                ['/saved?tab=shops', '🏪', t('following')],
                ['/saved?tab=media', '🖼️', t('savedMedia')],
                ['/my-reviews', '⭐', t('myReviews')],
                ['/offers', '🏷️', t('offers')],
                ['/account/addresses', '📍', t('addresses')],
                ['/account/notifications', '🔔', t('notifications')],
                ['/account/consent', '✅', t('consent')],
                ['/account/payments', '💳', t('payments')],
                ['/account/language', '🌐', t('language')],
                ['/account/theme', '🎨', t('theme')],
                ['/help', '🆘', t('help')],
              ] as const).map(([href, icon, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="flex min-h-touch items-center gap-3 rounded-md border border-border bg-surface px-3 py-2 font-semibold text-text hover:bg-surface-2 focus-visible:ring-focus"
                >
                  <span aria-hidden="true" className="text-h3">
                    {icon}
                  </span>
                  <span className="min-w-0 flex-1">{label}</span>
                  <NavIcon name="cr" className="size-4 shrink-0 text-muted" />
                </Link>
              ))}
            </nav>
          </Card>
          <AccountBusinessEntry />
          <AccountRiderEntry />
          <PrivacyActions
            key={`${state.data.userId}:${epoch}`}
            scope={accountScope(state.data, epoch)}
            onDeletionStarted={setDeletion}
          />
          {state.data.roles.some((role) => role !== 'customer') && (
            <p role="status" className="text-text-2">
              {t('operationsUnavailable')}
            </p>
          )}
          {demo && <DemoRoleCard />}
          <Logout />
        </>
      )}
    </div>
  );
}
