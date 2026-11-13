'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import type { BusinessKind, BusinessOwner } from '@apnatown/shared/businesses';
import type { InventoryItem } from '@apnatown/shared/products';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
  OfflineState,
} from '@apnatown/ui/feedback/StateViews';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import { Button, buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../../shared/api/result';
import { useOnline } from '../../../shared/hooks/use-online';
import { OwnerGate } from '../../businesses/BusinessDashboard';
import { Alert, LockedNote, StatusBanner } from '../../businesses/parts';
import { productDeniedCodes, productErrorKey } from './errors';
import { productEditorHref } from './filters';
import { ProductIcon } from './icons';
import { InventoryTable } from './InventoryTable';
import { RowsSkeleton, ToastRegion, productName, useToast } from './parts';
import {
  useInventory,
  useInventoryUpdate,
  useRestockLow,
} from './inventory-queries';

const RESTOCK_TARGET = 20;

/** S-VEND-08 inventory (vendor only; no provider route — Q-45). */
export function InventoryScreen({ kind }: { kind: BusinessKind }) {
  return (
    <OwnerGate kind={kind}>
      {(business) => <Gate business={business} />}
    </OwnerGate>
  );
}

function Gate({ business }: { business: BusinessOwner }) {
  const t = useTranslations('products.inventory');
  if (!business.capabilities.sell)
    return (
      <div className="grid min-w-0 gap-4">
        <h1 className="m-0 text-h1">{t('title')}</h1>
        <StatusBanner business={business} />
        <LockedNote />
      </div>
    );
  return <Screen kind={business.kind} />;
}

function Screen({ kind }: { kind: BusinessKind }) {
  const t = useTranslations('products.inventory');
  const te = useTranslations('products.errors');
  const locale = useLocale();
  const format = useFormatter();
  const list = useInventory(kind);
  const update = useInventoryUpdate(kind);
  const restock = useRestockLow(kind);
  const toast = useToast();
  const [busyId, setBusyId] = useState<string>();
  const [confirm, setConfirm] = useState(false);
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const lowLoaded = items.filter((item) => item.lowStock).length;
  // Low rows beyond the loaded pages still count: the server reads the exact set.
  const noLow = !list.hasNextPage && lowLoaded === 0;

  function change(
    item: InventoryItem,
    body: { delta?: number; availableForSale?: boolean; lowStockThreshold?: number },
    message: string,
  ) {
    setBusyId(item.productId);
    restock.reset();
    void update
      .run(
        { id: item.productId, body: { ...body, expectedVersion: item.version } },
        () => toast.show(message),
      )
      .finally(() => setBusyId(undefined));
  }

  const actionError = update.isError
    ? failureCode(update.error)
    : restock.isError
      ? failureCode(restock.error)
      : undefined;
  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="m-0 text-h1">{t('title')}</h1>
      <Button
        size="small"
        variant="ghost"
        disabled={!list.data || noLow}
        loading={restock.isPending}
        aria-describedby={noLow ? 'inventory-no-low' : undefined}
        onClick={() => setConfirm(true)}
      >
        <ProductIcon name="layers" className="size-4" />
        {t('restock', { target: RESTOCK_TARGET })}
      </Button>
    </div>
  );

  return (
    <div className="grid min-w-0 gap-4">
      {header}
      {noLow && list.data && items.length > 0 && (
        <p id="inventory-no-low" className="m-0 text-small text-text-2">
          {t('noLow')}
        </p>
      )}
      {actionError && (
        <Alert
          tone={actionError === 'PRODUCT_VERSION_CONFLICT' ? 'warn' : 'bad'}
          role="alert"
          action={
            <Button
              size="small"
              variant="outline"
              disabled={list.isFetching}
              onClick={() => {
                update.reset();
                restock.reset();
                void list.refetch();
              }}
            >
              {t('reload')}
            </Button>
          }
        >
          {te(productErrorKey(actionError))}
        </Alert>
      )}
      <Body
        list={list}
        items={items}
        kind={kind}
        table={{
          items,
          busyId,
          onDelta: (item, delta) =>
            change(
              item,
              { delta },
              t('adjusted', { name: productName(item, locale), count: item.onHand + delta }),
            ),
          onThreshold: (item, lowStockThreshold) =>
            change(
              item,
              { lowStockThreshold },
              t('thresholdSaved', { name: productName(item, locale), count: lowStockThreshold }),
            ),
          onAvailable: (item, availableForSale) =>
            change(
              item,
              { availableForSale },
              t(availableForSale ? 'nowInStock' : 'nowOutOfStock', {
                name: productName(item, locale),
              }),
            ),
        }}
      />
      <ConfirmDialog
        open={confirm}
        onOpenChange={(open) => !restock.isPending && setConfirm(open)}
        title={t('restockTitle', { target: RESTOCK_TARGET })}
        impact={t('restockImpact', { target: RESTOCK_TARGET })}
        cancelLabel={t('cancel')}
        confirmLabel={t('restockConfirm')}
        busy={restock.isPending}
        onConfirm={() => {
          update.reset();
          void restock.run(undefined, (result) => {
            setConfirm(false);
            toast.show(
              t('restocked', {
                count: result.changedIds.length,
                formatted: format.number(result.changedIds.length),
                target: RESTOCK_TARGET,
              }),
            );
          }).finally(() => setConfirm(false));
        }}
      />
      <ToastRegion {...toast} />
    </div>
  );
}

function Body({
  list,
  items,
  kind,
  table,
}: {
  list: ReturnType<typeof useInventory>;
  items: InventoryItem[];
  kind: BusinessKind;
  table: Parameters<typeof InventoryTable>[0];
}) {
  const t = useTranslations('products.inventory');
  const te = useTranslations('products.errors');
  const online = useOnline();
  const retry = (
    <Button disabled={list.isFetching} onClick={() => void list.refetch()}>
      {t('retry')}
    </Button>
  );
  if (list.isPending)
    return list.fetchStatus === 'paused' || !online ? (
      <OfflineState
        headingLevel="h2"
        icon="📡"
        title={t('offlineTitle')}
        message={t('offlineMessage')}
        action={null}
      />
    ) : (
      <RowsSkeleton label={t('loading')} />
    );
  if (list.isError && !list.data) {
    const code = failureCode(list.error);
    if (productDeniedCodes.has(code))
      return (
        <NoPermissionState
          headingLevel="h2"
          icon="🔒"
          title={t('forbiddenTitle')}
          message={te('forbidden')}
          action={null}
        />
      );
    return online ? (
      <ErrorState
        headingLevel="h2"
        icon="⚠️"
        title={t('errorTitle')}
        message={te(productErrorKey(code))}
        action={retry}
      />
    ) : (
      <OfflineState
        headingLevel="h2"
        icon="📡"
        title={t('offlineTitle')}
        message={t('offlineMessage')}
        action={retry}
      />
    );
  }
  return (
    <div className="grid min-w-0 gap-3">
      {list.isRefetchError && (
        <Alert tone="warn" role="alert" action={retry}>
          {online ? t('refreshFailed') : t('offlineMessage')}
        </Alert>
      )}
      {items.length === 0 ? (
        <EmptyState
          headingLevel="h2"
          icon="📦"
          title={t('emptyTitle')}
          message={t('emptyMessage')}
          action={
            <Link
              href={productEditorHref(kind, 'new')}
              className={buttonVariantClassName('primary')}
            >
              {t('add')}
            </Link>
          }
        />
      ) : (
        <InventoryTable {...table} />
      )}
      {list.isFetchNextPageError && (
        <Alert tone="bad" role="alert">
          {t('loadMoreFailed')}
        </Alert>
      )}
      {list.hasNextPage && (
        <Button
          variant="outline"
          className="justify-self-center"
          loading={list.isFetchingNextPage}
          onClick={() => void list.fetchNextPage()}
        >
          {t('loadMore')}
        </Button>
      )}
    </div>
  );
}
