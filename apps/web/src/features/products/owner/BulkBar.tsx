'use client';

import { useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import type { ProductBulkAction } from '@apnatown/shared/products';
import { Button } from '@apnatown/ui/primitives/Button';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import { ProductIcon } from './icons';

/** Prototype bulk bar (primary-soft card) with a confirmed, irreversible delete. */
export function BulkBar({
  count,
  busy,
  onAction,
  onClear,
}: {
  count: number;
  busy: boolean;
  onAction: (action: ProductBulkAction) => void;
  onClear: () => void;
}) {
  const t = useTranslations('products.bulk');
  const format = useFormatter();
  const [confirm, setConfirm] = useState(false);
  return (
    <div
      role="region"
      aria-label={t('label')}
      className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-primary bg-primary-soft px-3.5 py-2.5"
    >
      <p className="m-0 me-auto font-semibold" aria-live="polite">
        {t('selected', { count, formatted: format.number(count) })}
      </p>
      <Button
        size="small"
        variant="ghost"
        disabled={busy}
        onClick={() => onAction('mark_in_stock')}
      >
        {t('markInStock')}
      </Button>
      <Button
        size="small"
        variant="ghost"
        disabled={busy}
        onClick={() => onAction('mark_out_of_stock')}
      >
        {t('markOutOfStock')}
      </Button>
      <Button
        size="small"
        variant="danger"
        disabled={busy}
        onClick={() => setConfirm(true)}
      >
        <ProductIcon name="trash" className="size-4" />
        {t('delete')}
      </Button>
      <Button size="small" variant="text" disabled={busy} onClick={onClear}>
        {t('clear')}
      </Button>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={t('confirmTitle', { count })}
        impact={t('confirmImpact')}
        cancelLabel={t('cancel')}
        confirmLabel={t('confirmDelete')}
        tone="danger"
        busy={busy}
        onConfirm={() => {
          setConfirm(false);
          onAction('delete');
        }}
      />
    </div>
  );
}
