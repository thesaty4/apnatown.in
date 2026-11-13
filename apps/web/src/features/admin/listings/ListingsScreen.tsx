'use client';

import { useEffect, useId, useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { AdminBusinessListingType } from '@apnatown/shared/admin';
import { Card } from '@apnatown/ui/cards/Card';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
  OfflineState,
} from '@apnatown/ui/feedback/StateViews';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { Button } from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../../shared/api/result';
import { useOnline } from '../../../shared/hooks/use-online';
import { useAdmin } from '../AdminShell';
import { AdminFailure, Alert } from '../parts';
import { ApprovalTypeTabs } from '../approvals/QueueFilters';
import {
  listingsHref,
  readListingFilters,
  type ListingFilters,
} from './filters';
import { ListingEditSheet } from './ListingEditSheet';
import { ListingCards, ListingsTable, type ListingOpen } from './ListingsTable';
import { ListingsHeader, ListingsToolbar } from './ListingsToolbar';
import { isListingDenied, useListingError } from './parts';
import { ProductPublicationSheet } from './ProductPublicationSheet';
import { listingKeys, listingsOptions } from './queries';
import { ReportSheet } from './ReportSheet';

export type OpenListing = {
  type: AdminBusinessListingType;
  id: string;
  sheet: 'edit' | 'products';
};

/** S-ADMN-03: type tabs, search and status in the URL; keyset "load more". */
export function ListingsScreen() {
  const context = useAdmin();
  const { me, scope, recheck } = context;
  const t = useTranslations('admin.listings');
  const ta = useTranslations('admin.approvals');
  const ts = useTranslations('admin.state');
  const message = useListingError();
  const client = useQueryClient();
  const router = useRouter();
  const online = useOnline();
  const params = useSearchParams();
  const paramString = params.toString();
  const filters = useMemo(() => {
    const search = new URLSearchParams(paramString);
    return readListingFilters((name) => search.get(name));
  }, [paramString]);
  const { type } = filters;
  const permitted = me.isSuper || me.permissions.catalog.includes('view');
  const canEdit = me.isSuper || me.permissions.catalog.includes('edit');
  const [navigating, startTransition] = useTransition();
  const [open, setOpen] = useState<OpenListing | null>(null);
  const tabsId = useId();

  const list = useInfiniteQuery({
    ...listingsOptions(context, filters),
    enabled: permitted,
  });
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const unavailable =
    list.data?.pages[0]?.unavailable.includes('rider') ?? false;
  const code = list.isError ? failureCode(list.error) : undefined;
  const denied = Boolean(code && isListingDenied(code));

  // A denial re-reads authority; protected rows never outlive lost access.
  useEffect(() => {
    if (denied) recheck();
    if (!permitted || denied)
      client.removeQueries({ queryKey: listingKeys.root(scope) });
  }, [client, denied, permitted, recheck, scope]);

  function navigate(next: ListingFilters, replace = false) {
    const href = listingsHref(next);
    startTransition(() =>
      replace
        ? router.replace(href, { scroll: false })
        : router.push(href, { scroll: false }),
    );
  }
  const onOpen: ListingOpen = (item, sheet) =>
    setOpen({ type: item.type, id: item.id, sheet });
  const filtered = Boolean(filters.q || filters.status);
  const retry = (
    <Button loading={list.isFetching} onClick={() => void list.refetch()}>
      {ts('retry')}
    </Button>
  );

  let body;
  if (!permitted || denied) {
    body = (
      <NoPermissionState
        headingLevel="h2"
        title={ts('forbiddenTitle')}
        message={code ? message(code) : t('noPermission')}
        action={<Button onClick={recheck}>{ts('checkAgain')}</Button>}
      />
    );
  } else if (!online && !list.data) {
    body = (
      <OfflineState
        headingLevel="h2"
        title={t('offlineTitle')}
        message={t('offlineMessage')}
        action={retry}
      />
    );
  } else if (list.isPending) {
    body = (
      <Card padded>
        <Skeleton label={ts('loading')} />
      </Card>
    );
  } else if (code && !list.data) {
    body = (
      <ErrorState
        headingLevel="h2"
        title={t('loadErrorTitle')}
        message={message(code)}
        action={retry}
      />
    );
  } else if (unavailable) {
    body = (
      <EmptyState
        headingLevel="h2"
        icon="🛵"
        title={t('riderUnavailable.title')}
        message={t('riderUnavailable.message')}
        action={null}
      />
    );
  } else if (!items.length) {
    body = (
      <EmptyState
        headingLevel="h2"
        title={t(filtered ? 'empty.filteredTitle' : 'empty.title')}
        message={t(filtered ? 'empty.filteredMessage' : 'empty.message', {
          type: ta(`types.${type}`),
        })}
        action={
          filtered ? (
            <Button
              variant="outline"
              onClick={() =>
                navigate({ ...filters, q: undefined, status: undefined })
              }
            >
              {t('empty.clear')}
            </Button>
          ) : null
        }
      />
    );
  } else {
    const caption = t('tableCaption', { type: ta(`types.${type}`) });
    body = (
      <div className="grid gap-3">
        {!online && <Alert message={t('offlineStale')} />}
        {code && <AdminFailure code={code} />}
        <ListingsTable
          items={items}
          caption={caption}
          canEdit={canEdit}
          onOpen={onOpen}
        />
        <ListingCards items={items} canEdit={canEdit} onOpen={onOpen} />
        {list.isFetchNextPageError && (
          <AdminFailure
            code={failureCode(list.error)}
            busy={list.isFetchingNextPage}
            retry={() => void list.fetchNextPage()}
          />
        )}
        {list.hasNextPage && !list.isFetchNextPageError && (
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

  return (
    <section className="grid min-w-0 gap-stack-gap">
      <ListingsHeader />
      <ApprovalTypeTabs
        id={tabsId}
        label={t('tabsLabel')}
        value={type}
        onChange={(next) =>
          navigate({
            type: next,
            q: undefined,
            status: undefined,
            reportId: undefined,
          })
        }
      />
      <div
        role="tabpanel"
        id={`${tabsId}-panel`}
        aria-labelledby={`${tabsId}-tab-${type}`}
        aria-busy={navigating || (list.isFetching && !list.isFetchingNextPage)}
        className="grid min-w-0 gap-stack-gap"
      >
        {type !== 'rider' && permitted && (
          <ListingsToolbar
            filters={filters}
            onChange={(next) => navigate(next)}
          />
        )}
        {body}
      </div>
      {permitted && open?.sheet === 'edit' && (
        <ListingEditSheet
          type={open.type}
          id={open.id}
          onClose={() => setOpen(null)}
        />
      )}
      {permitted && open?.sheet === 'products' && (
        <ProductPublicationSheet
          businessId={open.id}
          canEdit={canEdit}
          onClose={() => setOpen(null)}
        />
      )}
      {permitted && filters.reportId && !open && (
        <ReportSheet
          reportId={filters.reportId}
          onClose={() => navigate({ ...filters, reportId: undefined }, true)}
          onOpenListing={(target) => {
            navigate({ ...filters, reportId: undefined }, true);
            setOpen({ ...target, sheet: 'edit' });
          }}
        />
      )}
    </section>
  );
}
