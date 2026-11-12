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
import { accountScope } from '../../shared/api/query-keys';
import { profileOptions } from './api';
import { OwnResource } from './OwnResource';
import { DeletionProgress, PrivacyActions, type Deletion } from './Privacy';

export function Account({
  initial,
  owner,
}: {
  initial: DehydratedState;
  owner?: string | undefined;
}) {
  const { state, epoch } = useSession();
  const t = useTranslations('account.menu');
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
            <nav aria-label={t('title')} className="grid gap-2">
              <Link
                href="/account/profile"
                className="inline-flex min-h-touch items-center underline"
              >
                {t('profile')}
              </Link>
              <Link
                href="/account/addresses"
                className="inline-flex min-h-touch items-center underline"
              >
                {t('addresses')}
              </Link>
              <Link
                href="/account/preferences"
                className="inline-flex min-h-touch items-center underline"
              >
                {t('preferences')}
              </Link>
            </nav>
          </Card>
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
          <Logout />
        </>
      )}
      <p className="text-small text-muted">{t('unavailable')}</p>
    </div>
  );
}
