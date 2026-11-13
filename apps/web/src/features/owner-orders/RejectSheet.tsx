'use client';

import { useId, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import type { BusinessKind } from '@apnatown/shared/businesses';
import {
  BUSINESS_REJECT_REASONS,
  type OrderDetail,
} from '@apnatown/shared/orders';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { Button } from '@apnatown/ui/primitives/Button';
import { Radio } from '@apnatown/ui/primitives/Selection';
import { failureCode } from '../../shared/api/result';
import { useOnline } from '../../shared/hooks/use-online';
import type { RejectReason } from './api';
import { orderErrorKey } from './errors';
import { useOwnerOrderCommand } from './queries';
import { useReasonLabel } from './OrderSummary';

/** Prototype "Reject this order?" sheet: a stable reason key is required. */
export function RejectSheet({
  kind,
  order,
  open,
  onClose,
  onDone,
}: {
  kind: BusinessKind;
  order: OrderDetail;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useTranslations('ownerOrders.reject');
  const te = useTranslations('ownerOrders.errors');
  const reasonLabel = useReasonLabel();
  const online = useOnline();
  const formId = useId();
  const command = useOwnerOrderCommand(kind, order.id);
  const [reason, setReason] = useState<RejectReason>();
  const [invalid, setInvalid] = useState(false);
  const busy = command.mutation.isPending;
  const code = command.mutation.isError
    ? failureCode(command.mutation.error)
    : undefined;

  const close = () => {
    if (busy) return;
    setReason(undefined);
    setInvalid(false);
    command.mutation.reset();
    onClose();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!reason) {
      setInvalid(true);
      return;
    }
    command.mutation.reset();
    command.run(
      { type: 'reject', reasonKey: reason, expectedVersion: order.version },
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
      description={t('description', { number: order.orderNumber })}
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
          {BUSINESS_REJECT_REASONS.map((value) => (
            <Radio
              key={value}
              name={`${formId}-reason`}
              value={value}
              label={reasonLabel(value) ?? value}
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
        {!online && (
          <p role="alert" className="m-0 text-small text-error">
            {te('offline')}
          </p>
        )}
        {code && (
          <p
            role="alert"
            className="m-0 text-small text-error [overflow-wrap:anywhere]"
          >
            {te(orderErrorKey(code))}
          </p>
        )}
      </form>
    </Sheet>
  );
}
