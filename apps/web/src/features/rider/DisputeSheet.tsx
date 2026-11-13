'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  RIDER_DISPUTE_REASONS,
  RiderDisputeInputSchema,
  type RiderDisputeInput,
} from '@apnatown/shared/delivery';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { Button } from '@apnatown/ui/primitives/Button';
import { Select } from '@apnatown/ui/primitives/Select';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { Notice, useRiderError } from './parts';
import { useRiderDispute } from './queries';

type Reason = RiderDisputeInput['reasonKey'];

/**
 * "Report a dispute" (S-RIDE-08). A jobless report creates a Settings support
 * message; only the returned, persisted support ID is shown as the receipt.
 * Retrying the same text reuses the same Idempotency-Key (one receipt).
 */
export function DisputeSheet() {
  const t = useTranslations('rider.dispute');
  const message = useRiderError();
  const detailsId = useId();
  const [open, setOpen] = useState(false);
  const [reasonKey, setReason] = useState<Reason>('account');
  const [details, setDetails] = useState('');
  const [invalid, setInvalid] = useState(false);
  const { mutation, submit } = useRiderDispute();
  const receipt = mutation.data;
  const busy = mutation.isPending;
  function close(next: boolean) {
    setOpen(next);
    if (!next) {
      mutation.reset();
      setInvalid(false);
      if (receipt) setDetails('');
    }
  }
  function send() {
    const body = { reasonKey, details };
    if (!RiderDisputeInputSchema.safeParse(body).success) {
      setInvalid(true);
      document.getElementById(detailsId)?.focus();
      return;
    }
    setInvalid(false);
    void submit({ reasonKey, details: details.trim() });
  }
  return (
    <>
      <Button
        variant="outline"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">⚖️</span> {t('open')}
      </Button>
      <Sheet
        open={open}
        onOpenChange={close}
        title={t('title')}
        description={t('description')}
        closeLabel={t('close')}
        busy={busy}
      >
        {receipt ? (
          <div className="grid gap-3">
            <Notice tone="ok" role="status" title={t('sentTitle')}>
              <p className="m-0">
                {t('sentBody')}{' '}
                <bdi className="font-semibold">{receipt.supportMessageId}</bdi>
              </p>
            </Notice>
            <Button onClick={() => close(false)}>{t('done')}</Button>
          </div>
        ) : (
          <form
            className="grid gap-3"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            <Select
              label={t('reason')}
              required
              value={reasonKey}
              disabled={busy}
              onChange={(event) => setReason(event.target.value as Reason)}
              options={RIDER_DISPUTE_REASONS.map((reason) => ({
                value: reason,
                label: t(`reasons.${reason}`),
              }))}
            />
            <TextArea
              id={detailsId}
              label={t('details')}
              hint={t('detailsHint')}
              required
              maxLength={960}
              value={details}
              disabled={busy}
              error={invalid ? t('detailsInvalid') : undefined}
              onChange={(event) => setDetails(event.target.value)}
            />
            {mutation.isError && (
              <Notice tone="bad" role="alert" title={t('failed')}>
                <p className="m-0">{message(mutation.error)}</p>
              </Notice>
            )}
            <Button type="submit" loading={busy} disabled={busy}>
              {t('submit')}
            </Button>
          </form>
        )}
      </Sheet>
    </>
  );
}
