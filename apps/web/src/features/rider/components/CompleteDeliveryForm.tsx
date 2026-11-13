'use client';

import { useId, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import type { RiderJob } from '@apnatown/shared/delivery';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { Checkbox } from '@apnatown/ui/primitives/Selection';
import { failureCode } from '../../../shared/api/result';
import { useOnline } from '../../../shared/hooks/use-online';
import { jobVersions } from '../job-api';
import { useJobCommand } from '../job-queries';
import { Notice, useMoney, useRiderError } from '../parts';
import { useActiveJob } from '../queries';

const blockedState = {
  not_ready: 'codeNotReady',
  expired: 'codeExpired',
  locked: 'codeLocked',
  consumed: 'codeConsumed',
} as const;

/**
 * Handover at the drop: the rider types the 4-digit code the customer reads
 * out (never fetched or shown here) and, only for cash on delivery with an
 * amount still due, separately confirms collecting the CURRENT outstanding
 * amount. The typed code is cleared on every submit; a payable change
 * (financial/order version) clears the cash confirmation.
 */
export function CompleteDeliveryForm({
  job,
  onDone,
}: {
  job: RiderJob;
  onDone: () => void;
}) {
  const t = useTranslations('rider.active');
  const money = useMoney();
  const online = useOnline();
  const formId = useId();
  const errorText = useRiderError('job');
  const active = useActiveJob();
  const command = useJobCommand(job.jobId);
  const [code, setCode] = useState('');
  const [cash, setCash] = useState(false);
  const [invalid, setInvalid] = useState<'code' | 'cash'>();
  const revision = `${job.orderVersion}:${job.financialVersion}`;
  const [seen, setSeen] = useState(revision);
  if (seen !== revision) {
    setSeen(revision);
    setCash(false);
  }
  const pending = command.mutation.isPending;
  const failure = command.mutation.isError
    ? failureCode(command.mutation.error)
    : undefined;
  const outstanding = job.payment.outstandingPaise;
  const needsCash = job.payment.method === 'cod' && outstanding > 0;
  const { state, codeVersion, attemptsRemaining } = job.handover;
  const blocked =
    state !== 'active' || codeVersion === undefined
      ? blockedState[state === 'active' ? 'not_ready' : state]
      : null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (pending || blocked || codeVersion === undefined) return;
    if (!/^\d{4}$/u.test(code)) return setInvalid('code');
    if (needsCash && !cash) return setInvalid('cash');
    setInvalid(undefined);
    command.mutation.reset();
    const otp = code;
    // The code leaves component state as soon as it is submitted.
    setCode('');
    void command.run(
      {
        type: 'complete',
        input: {
          otp,
          codeVersion,
          cashCollected: needsCash && cash,
          ...jobVersions(job),
        },
      },
      onDone,
    );
  };

  return (
    <form id={formId} noValidate className="grid gap-3" onSubmit={submit}>
      <h3 className="m-0 text-h4">{t('handoverTitle')}</h3>
      {blocked ? (
        <Notice
          tone={state === 'locked' ? 'bad' : 'warn'}
          role="status"
          title={t(blocked)}
          action={
            state !== 'locked' && (
              <Button
                size="small"
                variant="outline"
                loading={active.isFetching}
                disabled={!online}
                onClick={() => void active.refetch()}
              >
                {t('refresh')}
              </Button>
            )
          }
        />
      ) : (
        <Input
          label={t('codeLabel')}
          hint={t('codeHint')}
          error={invalid === 'code' ? t('codeRequired') : undefined}
          value={code}
          inputMode="numeric"
          autoComplete="one-time-code"
          enterKeyHint="done"
          pattern="[0-9]{4}"
          maxLength={4}
          dir="ltr"
          disabled={pending}
          className="tracking-widest"
          onChange={(event) => {
            setCode(event.currentTarget.value.replace(/\D/gu, '').slice(0, 4));
            if (invalid === 'code') setInvalid(undefined);
          }}
        />
      )}
      {needsCash ? (
        <Checkbox
          label={t('cashCollected', { amount: money(outstanding) })}
          description={t('cashHint')}
          checked={cash}
          disabled={pending}
          {...(invalid === 'cash' && { error: t('cashRequired') })}
          onChange={(event) => {
            setCash(event.currentTarget.checked);
            if (invalid === 'cash') setInvalid(undefined);
          }}
        />
      ) : (
        <p className="m-0 text-small text-text-2">
          <span aria-hidden="true">✓ </span>
          {t(job.payment.method === 'prepaid' ? 'paidOnline' : 'noCashDue')}
        </p>
      )}
      {failure && (
        <Notice tone="bad" role="alert">
          <p className="m-0">
            {failure === 'DELIVERY_CODE_INVALID' &&
            attemptsRemaining !== undefined
              ? t('codeInvalidAttempts', { count: attemptsRemaining })
              : errorText(command.mutation.error)}
          </p>
        </Notice>
      )}
      <Button
        type="submit"
        loading={pending}
        disabled={!online || Boolean(blocked)}
      >
        {t('completeAction')}
      </Button>
    </form>
  );
}
