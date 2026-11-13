'use client';

import { useId, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import type { BusinessKind } from '@apnatown/shared/businesses';
import type { OrderDetail } from '@apnatown/shared/orders';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { Checkbox } from '@apnatown/ui/primitives/Selection';
import { failureCode } from '../../shared/api/result';
import { useOnline } from '../../shared/hooks/use-online';
import { orderErrorKey } from './errors';
import { useMoney } from './parts';
import { useOwnerOrderCommand } from './queries';

export type HandoverAction = 'self_complete' | 'verify_pickup';

/**
 * Own-delivery completion / pickup handover: the owner types the code the
 * customer shows (never fetched or displayed here) and, only when cash is
 * outstanding, separately confirms collecting the current payable. The typed
 * code is cleared after every submit and on close; a rejection re-reads the
 * order so attempts left, code version and amounts stay authoritative.
 */
export function HandoverSheet({
  kind,
  order,
  action,
  open,
  onClose,
  onDone,
}: {
  kind: BusinessKind;
  order: OrderDetail;
  action: HandoverAction;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useTranslations('ownerOrders.handover');
  const te = useTranslations('ownerOrders.errors');
  const money = useMoney();
  const online = useOnline();
  const formId = useId();
  const command = useOwnerOrderCommand(kind, order.id);
  const [code, setCode] = useState('');
  const [cash, setCash] = useState(false);
  const [invalid, setInvalid] = useState<'code' | 'cash'>();
  const busy = command.mutation.isPending;
  const failure = command.mutation.isError
    ? failureCode(command.mutation.error)
    : undefined;
  const outstanding = order.payment.outstandingPaise;
  const needsCash = order.payment.settlementKind === 'cash' && outstanding > 0;
  const codeVersion = order.handover?.codeVersion ?? null;
  const attempts = order.handover?.attemptsRemaining ?? null;
  const prefix = action === 'self_complete' ? 'delivery' : 'pickup';

  const close = () => {
    if (busy) return;
    setCode('');
    setCash(false);
    setInvalid(undefined);
    command.mutation.reset();
    onClose();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{4}$/u.test(code)) return setInvalid('code');
    if (needsCash && !cash) return setInvalid('cash');
    if (codeVersion === null) return;
    setInvalid(undefined);
    command.mutation.reset();
    const input = {
      code,
      codeVersion,
      cashCollected: needsCash && cash,
      expectedOrderVersion: order.version,
      expectedFinancialVersion: order.financialVersion,
    };
    // The code leaves component state as soon as it is submitted.
    setCode('');
    command.run({ type: action, input }, () => {
      setCash(false);
      onDone();
    });
  };

  let message: string | undefined;
  if (codeVersion === null) message = te('codeNotReady');
  else if (failure === 'DELIVERY_CODE_INVALID' && attempts !== null)
    message = te('codeInvalidAttempts', { count: attempts });
  else if (failure) message = te(orderErrorKey(failure));

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
      title={t(`${prefix}Title`)}
      description={t(`${prefix}Description`, { number: order.orderNumber })}
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
            loading={busy}
            disabled={!online || codeVersion === null}
          >
            {t(`${prefix}Confirm`)}
          </Button>
        </div>
      }
    >
      <form id={formId} noValidate className="grid gap-4" onSubmit={submit}>
        <Input
          label={t(`${prefix}CodeLabel`)}
          hint={t('codeHint')}
          error={invalid === 'code' ? t('codeRequired') : undefined}
          value={code}
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="done"
          pattern="[0-9]{4}"
          maxLength={4}
          dir="ltr"
          disabled={busy}
          className="tracking-widest"
          onChange={(event) => {
            setCode(event.currentTarget.value.replace(/\D/gu, '').slice(0, 4));
            if (invalid === 'code') setInvalid(undefined);
          }}
        />
        {needsCash ? (
          <div className="grid gap-1">
            <Checkbox
              label={t('cashCollected', { amount: money(outstanding) })}
              description={t('cashHint')}
              checked={cash}
              disabled={busy}
              {...(invalid === 'cash' && { error: t('cashRequired') })}
              onChange={(event) => {
                setCash(event.currentTarget.checked);
                if (invalid === 'cash') setInvalid(undefined);
              }}
            />
          </div>
        ) : (
          <p className="m-0 text-small text-text-2">{t('noCashDue')}</p>
        )}
        {!online && (
          <p role="alert" className="m-0 text-small text-error">
            {te('offline')}
          </p>
        )}
        {message && (
          <p
            role="alert"
            className="m-0 text-small text-error [overflow-wrap:anywhere]"
          >
            {message}
          </p>
        )}
      </form>
    </Sheet>
  );
}
