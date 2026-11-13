'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  CUSTOMER_CANCEL_REASONS,
  type OrderDetail,
} from '@apnatown/shared/orders';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { Button } from '@apnatown/ui/primitives/Button';
import { Radio } from '@apnatown/ui/primitives/Selection';
import { useOrderError } from './errors';
import { reasonKey } from './format';
import { useCancelOrder, type CancelReason } from './queries';

/** Cancel confirmation sheet (prototype `cancelOrder`): one reason, then an
 * idempotent cancel with the order version the customer saw. */
export function CancelOrderSheet({
  order,
  open,
  onOpenChange,
  onCancelled,
}: {
  order: OrderDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancelled: () => void;
}) {
  const t = useTranslations('orders.cancel');
  const reasons = useTranslations('orders.reasons');
  const errorText = useOrderError();
  const cancel = useCancelOrder(order.id);
  const [reason, setReason] = useState<CancelReason>(
    CUSTOMER_CANCEL_REASONS[0],
  );
  function close(next: boolean) {
    if (cancel.isPending) return;
    if (!next) cancel.reset();
    onOpenChange(next);
  }
  function confirm() {
    void cancel.run(
      { reasonKey: reason, expectedVersion: order.version },
      () => {
        cancel.reset();
        onCancelled();
      },
    );
  }
  return (
    <Sheet
      open={open}
      onOpenChange={close}
      title={t('title')}
      description={t('description')}
      closeLabel={t('close')}
      busy={cancel.isPending}
      footer={
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            className="flex-1"
            disabled={cancel.isPending}
            onClick={() => close(false)}
          >
            {t('keep')}
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            loading={cancel.isPending}
            onClick={confirm}
          >
            {t('confirm')}
          </Button>
        </div>
      }
    >
      <fieldset className="m-0 grid gap-1 border-0 p-0">
        <legend className="mb-1 font-semibold">{t('reasonLegend')}</legend>
        {CUSTOMER_CANCEL_REASONS.map((value) => (
          <Radio
            key={value}
            name="cancel-reason"
            value={value}
            checked={reason === value}
            disabled={cancel.isPending}
            onChange={() => setReason(value)}
            label={reasons(reasonKey(value) ?? 'other')}
          />
        ))}
      </fieldset>
      {cancel.isError && (
        <p role="alert" className="m-0 mt-2 text-small text-error">
          {errorText(cancel.error)}
        </p>
      )}
    </Sheet>
  );
}
