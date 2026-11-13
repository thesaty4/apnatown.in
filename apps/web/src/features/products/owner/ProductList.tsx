'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useCallback,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import type { BusinessKind, BusinessOwner } from '@apnatown/shared/businesses';
import {
  PRODUCT_BULK_LIMIT,
  type ProductBulkAction,
  type ProductOwnerListItem,
} from '@apnatown/shared/products';
import { Button, buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../../shared/api/result';
import { NavIcon } from '../../../shared/ui/NavIcon';
import { SubcategorySuggestionSheet } from '../../catalog';
import { OwnerGate } from '../../businesses/BusinessDashboard';
import { LockedNote, StatusBanner } from '../../businesses/parts';
import type { ProductListFilters } from './api';
import { BulkBar } from './BulkBar';
import { CategoriesCard, pillLabel } from './CategoriesCard';
import { productErrorKey } from './errors';
import {
  productEditorHref,
  productsHref,
  readProductFilters,
} from './filters';
import { ProductIcon } from './icons';
import { ImportPanel } from './ImportPanel';
import { ToastRegion, useToast } from './parts';
import { PillManager } from './PillManager';
import { ProductFilters } from './ProductFilters';
import { useInventoryUpdate } from './inventory-queries';
import { ListBody } from './ProductListBody';
import {
  useBulkProducts,
  useProductList,
  useProductPills,
} from './queries';

const doneKey = {
  mark_in_stock: 'done.markInStock',
  mark_out_of_stock: 'done.markOutOfStock',
  delete: 'done.delete',
} as const satisfies Record<ProductBulkAction, string>;

/** S-VEND-05 / S-PROV-06 owner products list, shared by both dashboards. */
export function ProductList({ kind }: { kind: BusinessKind }) {
  return (
    <OwnerGate kind={kind}>
      {(business) => <Gate business={business} />}
    </OwnerGate>
  );
}

function Gate({ business }: { business: BusinessOwner }) {
  const t = useTranslations('products.list');
  if (!business.capabilities.sell)
    return (
      <div className="grid min-w-0 gap-4">
        <h1 className="m-0 text-h1">{t('title')}</h1>
        <StatusBanner business={business} />
        <LockedNote />
      </div>
    );
  return <Screen business={business} />;
}

function useListUrl(kind: BusinessKind) {
  const params = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const filters = useMemo(
    () => readProductFilters((name) => params.get(name)),
    [params],
  );
  const navigate = useCallback(
    (next: ProductListFilters, mode: 'push' | 'replace') =>
      startTransition(() =>
        router[mode](productsHref(kind, next), { scroll: false }),
      ),
    [kind, router],
  );
  return { filters, navigate };
}

function Screen({ business }: { business: BusinessOwner }) {
  const kind = business.kind;
  const t = useTranslations('products.list');
  const tb = useTranslations('products.bulk');
  const te = useTranslations('products.errors');
  const locale = useLocale();
  const format = useFormatter();
  const { filters, navigate } = useListUrl(kind);
  const list = useProductList(kind, filters);
  const pills = useProductPills(kind);
  const bulk = useBulkProducts(kind);
  const inventory = useInventoryUpdate(kind);
  const toast = useToast();
  const [sheet, setSheet] = useState<'import' | 'pills' | 'suggest'>();
  const [busyId, setBusyId] = useState<string>();
  const [selected, setSelected] = useState<Map<string, ProductOwnerListItem>>(
    () => new Map(),
  );

  // New filters (typing, Back/Forward) start a fresh selection.
  const [seen, setSeen] = useState(filters);
  if (seen !== filters) {
    setSeen(filters);
    setSelected(new Map());
  }

  const pages = list.data?.pages;
  const items = useMemo(() => pages?.flatMap((page) => page.items) ?? [], [pages]);
  const names = useMemo(
    () =>
      new Map(
        (pills.data?.items ?? []).map((pill) => [
          pill.subcategoryId,
          pillLabel(pill, locale),
        ]),
      ),
    [pills.data, locale],
  );

  function select(item: ProductOwnerListItem, checked: boolean) {
    setSelected((current) => {
      const next = new Map(current);
      if (checked && next.size < PRODUCT_BULK_LIMIT) next.set(item.id, item);
      else next.delete(item.id);
      return next;
    });
  }
  function selectAll(checked: boolean) {
    setSelected(
      checked
        ? new Map(items.slice(0, PRODUCT_BULK_LIMIT).map((item) => [item.id, item]))
        : new Map(),
    );
  }
  function runBulk(action: ProductBulkAction) {
    // Freshest loaded copy of each row; delete guards the PRODUCT version,
    // stock actions the INVENTORY version.
    const current = new Map(items.map((item) => [item.id, item]));
    const rows = [...selected.values()].map((row) => current.get(row.id) ?? row);
    void bulk.run(
      {
        action,
        items: rows.map((row) => ({
          id: row.id,
          version: action === 'delete' ? row.version : row.inventory.version,
        })),
      },
      (result) => {
        setSelected(new Map());
        toast.show(tb(doneKey[action], { count: result.changedIds.length }));
      },
    );
  }
  function toggleAvailable(item: ProductOwnerListItem, next: boolean) {
    setBusyId(item.id);
    void inventory
      .run(
        {
          id: item.id,
          body: { availableForSale: next, expectedVersion: item.inventory.version },
        },
        () => toast.show(t(next ? 'nowAvailable' : 'nowUnavailable')),
      )
      .finally(() => setBusyId(undefined));
  }

  const actionCode = bulk.isError
    ? failureCode(bulk.error)
    : inventory.isError
      ? failureCode(inventory.error)
      : undefined;
  const refreshAfterConflict = () => {
    bulk.reset();
    inventory.reset();
    void list.refetch();
  };

  return (
    <div className="grid min-w-0 gap-4">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <h1 className="m-0 me-auto text-h1">{t('title')}</h1>
        <Button variant="ghost" onClick={() => setSheet('import')}>
          <ProductIcon name="upload" className="size-4.5" />
          {t('bulkImport')}
        </Button>
        <Link
          href={productEditorHref(kind, 'new', filters)}
          className={buttonVariantClassName('primary')}
        >
          <NavIcon name="plus" className="size-4.5" />
          {t('add')}
        </Link>
      </div>
      <CategoriesCard
        pills={pills.data?.items}
        pillsLoading={pills.isPending}
        onSuggest={() => setSheet('suggest')}
        onManagePills={
          pills.data && pills.data.items.length > 0
            ? () => setSheet('pills')
            : undefined
        }
      />
      <ProductFilters filters={filters} navigate={navigate} />
      <p role="status" className="sr-only">
        {pages ? t('resultCount', { count: items.length, formatted: format.number(items.length) }) : ''}
      </p>
      {selected.size > 0 && (
        <BulkBar
          count={selected.size}
          busy={bulk.isPending}
          onAction={runBulk}
          onClear={() => setSelected(new Map())}
        />
      )}
      {selected.size >= PRODUCT_BULK_LIMIT && (
        <p className="m-0 text-small text-text-2">
          {tb('limit', { max: PRODUCT_BULK_LIMIT })}
        </p>
      )}
      {actionCode && (
        <div role="alert" className="flex flex-wrap items-center gap-2 rounded-md border border-error bg-error-soft px-3.5 py-3 text-small">
          <span aria-hidden="true">⛔</span>
          <span className="min-w-0 flex-1">{te(productErrorKey(actionCode))}</span>
          <Button size="small" variant="outline" onClick={refreshAfterConflict}>
            {t('reload')}
          </Button>
        </div>
      )}
      <ListBody
        list={list}
        items={items}
        filtered={Boolean(filters.query || filters.stock)}
        onClear={() => navigate({ stock: undefined, query: '' }, 'push')}
        onImport={() => setSheet('import')}
        addHref={productEditorHref(kind, 'new', filters)}
        table={{
          items,
          selected: new Set(selected.keys()),
          selectionFull: selected.size >= PRODUCT_BULK_LIMIT,
          onSelect: select,
          onSelectAll: selectAll,
          onAvailable: toggleAvailable,
          busyId,
          editHref: (id) => productEditorHref(kind, id, filters),
          subcategoryName: (id) => names.get(id),
        }}
      />
      <ImportPanel
        kind={kind}
        open={sheet === 'import'}
        onClose={() => setSheet(undefined)}
        onImported={(count) => toast.show(t('imported', { count }))}
      />
      {sheet === 'pills' && pills.data && (
        <PillManager
          kind={kind}
          pills={pills.data.items}
          open
          onClose={() => setSheet(undefined)}
          onSaved={() => {
            setSheet(undefined);
            toast.show(t('pillsSaved'));
          }}
        />
      )}
      <SubcategorySuggestionSheet
        open={sheet === 'suggest'}
        onClose={() => setSheet(undefined)}
        kind="product"
        defaultCategoryId={business.primaryCategoryId ?? undefined}
        onSubmitted={() => toast.show(t('suggestionSent'))}
      />
      <ToastRegion {...toast} />
    </div>
  );
}
