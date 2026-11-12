'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@apnatown/ui/cards/Card';
import { Button } from '@apnatown/ui/primitives/Button';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import { useSession, useLogout } from './SessionProvider';
import { Failure } from './AccessState';
import { failureCode } from '../api/result';
import { publicHref } from '../i18n/preferences';

/** Logout row shared by the account menu and dashboard profiles. */
export function Logout() {
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
