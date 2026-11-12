'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { DehydratedState } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@apnatown/ui/cards/Card';
import { Avatar } from '@apnatown/ui/data/Avatar';
import { Button } from '@apnatown/ui/primitives/Button';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import { useSession, useLogout } from '../../shared/auth/SessionProvider';
import { AccessState, Failure } from '../../shared/auth/AccessState';
import { failureCode } from '../../shared/api/result';
import { publicHref } from '../../shared/i18n/preferences';
import { profileOptions } from './api';
import { OwnResource } from './OwnResource';

export function Account({
  initial,
  owner,
}: {
  initial: DehydratedState;
  owner?: string | undefined;
}) {
  const { state } = useSession();
  const t = useTranslations('account.menu');
  return (
    <div className="grid gap-4">
      <h1 className="text-h1">{t('title')}</h1>
      {state.kind !== 'ready' ? (
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

function Logout() {
  const { lifecycle, broadcast } = useSession();
  const mutation = useLogout();
  const t = useTranslations('account.menu');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const [confirm, setConfirm] = useState(false);
  const busy = mutation.isPending;
  const error = mutation.isError ? failureCode(mutation.error) : undefined;
  async function submit() {
    await mutation.run(undefined, () => {
      mutation.reset();
      lifecycle.expire('SESSION_EXPIRED');
      broadcast();
      window.location.replace(publicHref('/', locale));
    });
  }
  return (
    <Card padded className="grid gap-4">
      <Button
        onClick={() => {
          mutation.reset();
          setConfirm(true);
        }}
      >
        {t('logout')}
      </Button>
      <ConfirmDialog
        open={confirm}
        onOpenChange={(open) => setConfirm(open)}
        title={t('logoutTitle')}
        impact={t('logoutMessage')}
        cancelLabel={t('cancel')}
        confirmLabel={t('logout')}
        onConfirm={() => {
          void submit();
        }}
        busy={busy}
        tone="danger"
      >
        {error && (
          <Failure
            code={error}
            retryDisabled={busy}
            retry={() => {
              void submit();
            }}
          />
        )}
      </ConfirmDialog>
    </Card>
  );
}
