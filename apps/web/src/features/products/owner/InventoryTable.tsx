'use client';

import { useEffect, useState, type KeyboardEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { InventoryItem } from '@apnatown/shared/products';
import { Card } from '@apnatown/ui/cards/Card';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { ProductArt, QuantityStepper, StockBadge, productName } from './parts';

export type InventoryRowProps = {
  items: InventoryItem[];
  busyId: string | undefined;
  onDelta: (item: InventoryItem, delta: 1 | -1) => void;
  onThreshold: (item: InventoryItem, threshold: number) => void;
  onAvailable: (item: InventoryItem, next: boolean) => void;
};

/** S-VEND-08 table (prototype `tbl`) on desktop; labelled cards on mobile.
 * Low rows get a warm row tint plus the worded/iconed stock badge. */
export function InventoryTable(props: InventoryRowProps) {
  const t = useTranslations('products.inventory');
  const head = 'px-3 py-3 text-start text-small font-semibold text-text';
  return (
    <>
      <Card className="hidden overflow-hidden desktop:block">
        <table className="w-full border-collapse text-small">
          <caption className="sr-only">{t('tableCaption')}</caption>
          <thead className="bg-primary-soft">
            <tr>
              <th scope="col" className={head}>{t('columns.product')}</th>
              <th scope="col" className={head}>{t('columns.inStock')}</th>
              <th scope="col" className={head}>{t('columns.lowAlert')}</th>
              <th scope="col" className={head}>{t('columns.adjust')}</th>
              <th scope="col" className={head}>{t('columns.availability')}</th>
            </tr>
          </thead>
          <tbody>
            {props.items.map((item) => (
              <DesktopRow key={item.productId} item={item} {...props} />
            ))}
          </tbody>
        </table>
      </Card>
      <ul className="m-0 grid list-none gap-3 p-0 desktop:hidden">
        {props.items.map((item) => (
          <MobileCard key={item.productId} item={item} {...props} />
        ))}
      </ul>
    </>
  );
}

type ItemProps = InventoryRowProps & { item: InventoryItem };

function useControls({ item, busyId, onDelta, onThreshold, onAvailable }: ItemProps) {
  const t = useTranslations('products.inventory');
  const locale = useLocale();
  const name = productName(item, locale);
  const busy = busyId === item.productId;
  return {
    name,
    busy,
    stepper: (
      <QuantityStepper
        value={item.onHand}
        label={name}
        onChange={(delta) => onDelta(item, delta)}
      />
    ),
    threshold: (
      <ThresholdInput
        key={`${item.productId}:${item.version}`}
        value={item.lowStockThreshold}
        label={t('thresholdFor', { name })}
        disabled={false}
        onCommit={(next) => onThreshold(item, next)}
      />
    ),
    availability: (
      <Button
        size="small"
        variant={item.availableForSale ? 'ghost' : 'primary'}
        aria-busy={busy || undefined}
        aria-label={t(item.availableForSale ? 'markOutFor' : 'markInFor', { name })}
        onClick={() => onAvailable(item, !item.availableForSale)}
      >
        {t(item.availableForSale ? 'markOut' : 'markIn')}
      </Button>
    ),
  };
}

/** Saves on blur/Enter only when changed to a valid whole number; Escape
 * restores the saved value. */
function ThresholdInput({
  value,
  label,
  disabled,
  onCommit,
}: {
  value: number;
  label: string;
  disabled: boolean;
  onCommit: (next: number) => void;
}) {
  const t = useTranslations('products.validation');
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const valid = /^\d{1,9}$/u.test(text.trim());
  function commit() {
    if (!valid) return;
    const next = Number(text.trim());
    if (next !== value) onCommit(next);
  }
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Escape') setText(String(value));
  }
  return (
    <Input
      label={label}
      wrapperClassName="w-24 [&>label]:sr-only"
      inputMode="numeric"
      autoComplete="off"
      disabled={disabled}
      value={text}
      {...(valid ? {} : { error: t('wholeNumber') })}
      onChange={(event) => setText(event.target.value)}
      onBlur={commit}
      onKeyDown={onKeyDown}
    />
  );
}

function DesktopRow(props: ItemProps) {
  const { item } = props;
  const controls = useControls(props);
  const cell = 'px-3 py-3 align-middle';
  return (
    <tr
      aria-busy={controls.busy || undefined}
      className={`border-t border-border ${item.lowStock ? 'bg-warning-soft' : ''}`}
    >
      <th scope="row" className={`${cell} text-start font-normal`}>
        <span className="flex min-w-0 items-center gap-3">
          <ProductArt size="sm" />
          <span className="grid min-w-0 gap-0.5">
            <bdi className="font-semibold [overflow-wrap:anywhere]">{controls.name}</bdi>
            <span className="text-caption text-text-2 [overflow-wrap:anywhere]" dir="ltr">
              {[item.sku, item.unit].filter(Boolean).join(' · ')}
            </span>
          </span>
        </span>
      </th>
      <td className={cell}>
        <StockBadge onHand={item.onHand} threshold={item.lowStockThreshold} />
      </td>
      <td className={cell}>{controls.threshold}</td>
      <td className={cell}>{controls.stepper}</td>
      <td className={cell}>{controls.availability}</td>
    </tr>
  );
}

function MobileCard(props: ItemProps) {
  const t = useTranslations('products.inventory');
  const { item } = props;
  const controls = useControls(props);
  return (
    <li aria-busy={controls.busy || undefined}>
      <Card padded className={`grid gap-3 ${item.lowStock ? 'border-warning bg-warning-soft' : ''}`}>
        <div className="flex min-w-0 items-start gap-3">
          <ProductArt size="sm" />
          <div className="grid min-w-0 flex-1 gap-1">
            <bdi className="font-semibold [overflow-wrap:anywhere]">{controls.name}</bdi>
            <StockBadge onHand={item.onHand} threshold={item.lowStockThreshold} />
          </div>
        </div>
        <dl className="m-0 grid grid-cols-2 gap-3 text-small">
          <div className="grid content-start gap-1">
            <dt className="text-caption text-text-2">{t('columns.adjust')}</dt>
            <dd className="m-0">{controls.stepper}</dd>
          </div>
          <div className="grid content-start gap-1">
            <dt className="text-caption text-text-2">{t('columns.lowAlert')}</dt>
            <dd className="m-0">{controls.threshold}</dd>
          </div>
        </dl>
        <div className="border-t border-border pt-2">{controls.availability}</div>
      </Card>
    </li>
  );
}
