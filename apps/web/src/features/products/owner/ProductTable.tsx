'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import type { ProductOwnerListItem } from '@apnatown/shared/products';
import { Card } from '@apnatown/ui/cards/Card';
import { buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { Checkbox, Switch } from '@apnatown/ui/primitives/Selection';
import { ProductIcon } from './icons';
import { ProductArt, StockBadge, productName, useMoney } from './parts';

/** Visually hide a Selection label while it stays the accessible name. */
const hiddenLabel = '[&_label>span:last-child]:sr-only';

export type RowProps = {
  items: ProductOwnerListItem[];
  selected: ReadonlySet<string>;
  /** Selection is capped at the bulk limit; unselected rows lock then. */
  selectionFull: boolean;
  onSelect: (item: ProductOwnerListItem, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onAvailable: (item: ProductOwnerListItem, next: boolean) => void;
  busyId: string | undefined;
  editHref: (id: string) => string;
  subcategoryName: (id: string) => string | undefined;
};

/** S-VEND-05 table (prototype `tbl`) on desktop; labelled cards on mobile. */
export function ProductTable(props: RowProps) {
  const t = useTranslations('products.list');
  const { items, selected } = props;
  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));
  const head = 'px-3 py-3 text-start text-small font-semibold text-text';
  return (
    <>
      <Card className="hidden overflow-hidden desktop:block">
        <table className="w-full border-collapse text-small">
          <caption className="sr-only">{t('tableCaption')}</caption>
          <thead className="bg-primary-soft">
            <tr>
              <th scope="col" className={`${head} w-14`}>
                <Checkbox
                  label={t('selectAll')}
                  wrapperClassName={hiddenLabel}
                  checked={allSelected}
                  onChange={(event) => props.onSelectAll(event.target.checked)}
                />
              </th>
              <th scope="col" className={head}>{t('columns.product')}</th>
              <th scope="col" className={head}>{t('columns.sku')}</th>
              <th scope="col" className={head}>{t('columns.price')}</th>
              <th scope="col" className={head}>{t('columns.stock')}</th>
              <th scope="col" className={head}>{t('columns.available')}</th>
              <th scope="col" className={head}>
                <span className="sr-only">{t('columns.actions')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <DesktopRow key={item.id} item={item} {...props} />
            ))}
          </tbody>
        </table>
      </Card>
      <ul className="m-0 grid list-none gap-3 p-0 desktop:hidden">
        {items.map((item) => (
          <MobileCard key={item.id} item={item} {...props} />
        ))}
      </ul>
    </>
  );
}

type ItemProps = RowProps & { item: ProductOwnerListItem };

function useRow({ item, subcategoryName }: ItemProps) {
  const locale = useLocale();
  const money = useMoney();
  const name = productName(item, locale);
  const sub = subcategoryName(item.subcategoryId);
  return {
    name,
    meta: [sub, item.unit].filter(Boolean).join(' · '),
    price: money(item.pricePaise),
    mrp: item.mrpPaise > item.pricePaise ? money(item.mrpPaise) : undefined,
  };
}

function Price({ price, mrp }: { price: string; mrp: string | undefined }) {
  const t = useTranslations('products.list');
  return (
    <span className="inline-flex flex-wrap items-baseline gap-1.5">
      <span className="font-semibold">{price}</span>
      {mrp && (
        <s className="text-caption text-muted">
          <span className="sr-only">{t('mrpLabel')} </span>
          {mrp}
        </s>
      )}
    </span>
  );
}

function useRowControls({ item, ...props }: ItemProps & { name: string }) {
  const t = useTranslations('products.list');
  const checked = props.selected.has(item.id);
  return {
    select: (
      <Checkbox
        label={t('selectProduct', { name: props.name })}
        wrapperClassName={hiddenLabel}
        checked={checked}
        disabled={!checked && props.selectionFull}
        onChange={(event) => props.onSelect(item, event.target.checked)}
      />
    ),
    available: (
      <Switch
        label={t('availableFor', { name: props.name })}
        wrapperClassName={hiddenLabel}
        checked={item.inventory.availableForSale}
        disabled={props.busyId === item.id}
        onChange={(event) => props.onAvailable(item, event.target.checked)}
      />
    ),
    edit: (
      <Link
        href={props.editHref(item.id)}
        className={buttonVariantClassName('ghost', 'small')}
        aria-label={t('editProduct', { name: props.name })}
      >
        <ProductIcon name="edit" className="size-4" />
        {t('edit')}
      </Link>
    ),
  };
}

function DesktopRow(props: ItemProps) {
  const { item } = props;
  const row = useRow(props);
  const controls = useRowControls({ ...props, name: row.name });
  const cell = 'px-3 py-3 align-middle';
  return (
    <tr className="border-t border-border">
      <td className={cell}>{controls.select}</td>
      <th scope="row" className={`${cell} text-start font-normal`}>
        <span className="flex min-w-0 items-center gap-3">
          <ProductArt />
          <span className="grid min-w-0 gap-0.5">
            <bdi className="font-semibold [overflow-wrap:anywhere]">{row.name}</bdi>
            <span className="text-caption text-text-2 [overflow-wrap:anywhere]">
              {row.meta}
            </span>
          </span>
        </span>
      </th>
      <td className={`${cell} [overflow-wrap:anywhere]`} dir="ltr">
        {item.sku ?? '—'}
      </td>
      <td className={cell}>
        <Price price={row.price} mrp={row.mrp} />
      </td>
      <td className={cell}>
        <StockBadge
          onHand={item.inventory.onHand}
          threshold={item.inventory.lowStockThreshold}
        />
      </td>
      <td className={cell}>{controls.available}</td>
      <td className={`${cell} text-end`}>{controls.edit}</td>
    </tr>
  );
}

function MobileCard(props: ItemProps) {
  const t = useTranslations('products.list');
  const { item } = props;
  const row = useRow(props);
  const controls = useRowControls({ ...props, name: row.name });
  return (
    <li>
      <Card padded className="grid gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {controls.select}
          <ProductArt />
          <div className="grid min-w-0 flex-1 gap-0.5">
            <bdi className="font-semibold [overflow-wrap:anywhere]">{row.name}</bdi>
            <span className="text-caption text-text-2 [overflow-wrap:anywhere]">
              {row.meta}
            </span>
            <Price price={row.price} mrp={row.mrp} />
          </div>
        </div>
        <dl className="m-0 grid grid-cols-2 gap-x-3 gap-y-2 text-small">
          <div className="grid gap-1">
            <dt className="text-caption text-text-2">{t('columns.sku')}</dt>
            <dd className="m-0 [overflow-wrap:anywhere]" dir="ltr">
              {item.sku ?? '—'}
            </dd>
          </div>
          <div className="grid gap-1">
            <dt className="text-caption text-text-2">{t('columns.stock')}</dt>
            <dd className="m-0">
              <StockBadge
                onHand={item.inventory.onHand}
                threshold={item.inventory.lowStockThreshold}
              />
            </dd>
          </div>
        </dl>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
          <span className="flex items-center gap-2 text-small">
            <span aria-hidden="true">{t('columns.available')}</span>
            {controls.available}
          </span>
          {controls.edit}
        </div>
      </Card>
    </li>
  );
}
