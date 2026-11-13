'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import { Checkbox } from '@apnatown/ui/primitives/Selection';

/**
 * Explicit WhatsApp consent before a grant (DPDP): the notice is shown and
 * the acknowledgement checkbox is never pre-ticked; confirming is blocked
 * until the user ticks it. Cancelling leaves the preference unchanged.
 */
export function ConsentAckDialog({
  open,
  label,
  noticeVersion,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  /** Localized preference label, e.g. "Order updates on WhatsApp". */
  label: string;
  noticeVersion: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations('notifications.consent');
  const [agreed, setAgreed] = useState(false);
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setAgreed(false);
          onCancel();
        }
      }}
      title={t('title')}
      impact={t('notice')}
      cancelLabel={t('cancel')}
      confirmLabel={t('confirm')}
      confirmDisabled={!agreed}
      busy={busy}
      onConfirm={() => {
        if (!agreed) return;
        setAgreed(false);
        onConfirm();
      }}
    >
      <div className="grid gap-2">
        <Checkbox
          label={t('acknowledge', { label })}
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
        />
        <p className="m-0 text-caption text-muted">
          {t('noticeVersion', { version: noticeVersion })}
        </p>
      </div>
    </ConfirmDialog>
  );
}
