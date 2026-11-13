'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import { Button } from '@apnatown/ui/primitives/Button';
import type { OwnContext } from '../users/OwnResource';
import { failureCode } from '../../shared/api/result';
import { useUnsubscribeMarketing } from './preference-queries';
import { useChannelError } from './channel-errors';

/** Prototype ghost "Unsubscribe from all marketing" with a confirm step.
 * Transactional order/enquiry updates are unaffected. */
export function UnsubscribeMarketing({
  context,
  version,
  disabled,
}: {
  context: OwnContext;
  version: number;
  disabled: boolean;
}) {
  const t = useTranslations('notifications.unsubscribe');
  const message = useChannelError();
  const mutation = useUnsubscribeMarketing(context);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const code = mutation.isError ? failureCode(mutation.error) : undefined;
  return (
    <div className="grid gap-2">
      <Button
        variant="ghost"
        className="justify-self-start"
        disabled={disabled || mutation.isPending}
        onClick={() => {
          setDone(false);
          mutation.reset();
          setOpen(true);
        }}
      >
        {t('action')}
      </Button>
      <p role="status" className="m-0 text-small text-text-2 empty:hidden">
        {done ? `✓ ${t('done')}` : ''}
      </p>
      {code && (
        <p role="alert" className="m-0 text-small text-error">
          {message(code)}
        </p>
      )}
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t('confirmTitle')}
        impact={t('confirmImpact')}
        cancelLabel={t('cancel')}
        confirmLabel={t('confirm')}
        tone="danger"
        busy={mutation.isPending}
        onConfirm={() => {
          void mutation
            .run(version, () => setDone(true))
            .then(() => setOpen(false));
        }}
      />
    </div>
  );
}
