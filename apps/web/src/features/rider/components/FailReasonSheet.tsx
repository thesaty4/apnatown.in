'use client';

import { useId, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import {
  DELIVERY_FAIL_REASONS,
  type RiderJob,
} from '@apnatown/shared/delivery';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { Button } from '@apnatown/ui/primitives/Button';
import { Radio } from '@apnatown/ui/primitives/Selection';
import { useOnline } from '../../../shared/hooks/use-online';
import { jobVersions } from '../job-api';
import { useJobCommand } from '../job-queries';
import { failReasonKey } from '../fail-reasons';
import { useRiderError } from '../parts';

type FailReason = (typeof DELIVERY_FAIL_REASONS)[number];

/**
 * "Mark delivery failed": exactly the four source reasons, sent with the
 * rendered versions. Nothing is shown as failed (or refunded) until the
 * server commits; the job then leaves the active read.
 */
export function FailReasonSheet({
  job,
  open,
  onClose,
  onDone,
}: {
  job: RiderJob;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useTranslations('rider.fail');
  const reasons = useTranslations('rider.failReasons');
  const online = useOnline();
  const formId = useId();
  const errorText = useRiderError('job');
  const command = useJobCommand(job.jobId);
  const [reason, setReason] = useState<FailReason>();
  const [invalid, setInvalid] = useState(false);
  const busy = command.mutation.isPending;

  const close = () => {
    if (busy) return;
    setReason(undefined);
    setInvalid(false);
    command.mutation.reset();
    onClose();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!reason) return setInvalid(true);
    command.mutation.reset();
    void command.run(
      {
        type: 'event',
        input: { event: 'fail', failReason: reason, ...jobVersions(job) },
      },
      () => {
        setReason(undefined);
        onDone();
      },
    );
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
      title={t('title')}
      description={t('description', { number: job.orderNumber })}
      closeLabel={t('close')}
      busy={busy}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" disabled={busy} onClick={close}>
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="danger"
            loading={busy}
            disabled={!online}
          >
            {t('confirm')}
          </Button>
        </div>
      }
    >
      <form id={formId} noValidate className="grid gap-4" onSubmit={submit}>
        <fieldset
          className="m-0 grid min-w-0 gap-2 border-0 p-0"
          aria-invalid={(invalid && !reason) || undefined}
        >
          <legend className="mb-2 font-semibold">{t('reasonLabel')}</legend>
          {DELIVERY_FAIL_REASONS.map((value) => (
            <Radio
              key={value}
              name={`${formId}-reason`}
              value={value}
              label={reasons(failReasonKey[value])}
              checked={reason === value}
              disabled={busy}
              onChange={() => {
                setReason(value);
                setInvalid(false);
              }}
            />
          ))}
          {invalid && !reason && (
            <p role="alert" className="m-0 text-small text-error">
              {t('reasonRequired')}
            </p>
          )}
        </fieldset>
        <p className="m-0 text-small text-text-2">{t('impact')}</p>
        {command.mutation.isError && (
          <p
            role="alert"
            className="m-0 text-small text-error [overflow-wrap:anywhere]"
          >
            {errorText(command.mutation.error)}
          </p>
        )}
      </form>
    </Sheet>
  );
}
