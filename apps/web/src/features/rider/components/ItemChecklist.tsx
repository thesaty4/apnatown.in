'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { RiderJob } from '@apnatown/shared/delivery';
import { Button } from '@apnatown/ui/primitives/Button';
import { Checkbox } from '@apnatown/ui/primitives/Selection';
import { useOnline } from '../../../shared/hooks/use-online';
import { jobVersions } from '../job-api';
import { useJobCommand } from '../job-queries';
import { Notice, useRiderError } from '../parts';

/**
 * Pickup check (S-RIDE-04 "Items"): the rider ticks every current item the
 * shop hands over; "Picked up" sends exactly those orderItemIds. Unavailable
 * items are listed but not part of the handover. Any order/financial version
 * change (an item adjustment) clears the ticks before another attempt.
 */
export function ItemChecklist({ job }: { job: RiderJob }) {
  const t = useTranslations('rider.active');
  const online = useOnline();
  const errorText = useRiderError('job');
  const command = useJobCommand(job.jobId);
  const revision = `${job.orderVersion}:${job.financialVersion}`;
  const [seen, setSeen] = useState(revision);
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set());
  if (seen !== revision) {
    setSeen(revision);
    setChecked(new Set());
  }
  const required = job.items.filter(
    (item) => item.availability === 'available',
  );
  const allChecked = required.every((item) => checked.has(item.orderItemId));
  const pending = command.mutation.isPending;

  const toggle = (id: string, on: boolean) =>
    setChecked((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const submit = () => {
    if (!allChecked || pending) return;
    command.mutation.reset();
    void command.run({
      type: 'event',
      input: {
        event: 'picked_up',
        checkedItemIds: required.map((item) => item.orderItemId),
        ...jobVersions(job),
      },
    });
  };

  return (
    <fieldset className="m-0 grid min-w-0 gap-2 border-0 p-0">
      <legend className="mb-1 font-semibold">{t('checkItems')}</legend>
      <p className="m-0 text-small text-text-2">
        {t('checkItemsHint', { count: required.length })}
      </p>
      <ul className="m-0 grid list-none gap-1 p-0">
        {job.items.map((item) => {
          const label = t('itemLine', {
            name: item.variantLabel
              ? `${item.name} (${item.variantLabel})`
              : item.name,
            quantity: item.quantity,
          });
          return (
            <li key={item.orderItemId} className="min-w-0">
              {item.availability === 'available' ? (
                <Checkbox
                  label={label}
                  checked={checked.has(item.orderItemId)}
                  disabled={pending}
                  onChange={(event) =>
                    toggle(item.orderItemId, event.currentTarget.checked)
                  }
                />
              ) : (
                <p className="m-0 flex min-h-touch flex-wrap items-center gap-2 text-small text-muted [overflow-wrap:anywhere]">
                  <span aria-hidden="true">✕</span>
                  <s>{label}</s>
                  <span>· {t('itemUnavailable')}</span>
                </p>
              )}
            </li>
          );
        })}
      </ul>
      {command.mutation.isError && (
        <Notice tone="bad" role="alert">
          <p className="m-0">{errorText(command.mutation.error)}</p>
        </Notice>
      )}
      <Button
        disabled={!online || pending || !allChecked}
        loading={pending}
        onClick={submit}
      >
        {t('pickedUpAction')}
      </Button>
      {!allChecked && (
        <p className="m-0 text-caption text-muted">{t('checkAllFirst')}</p>
      )}
    </fieldset>
  );
}
