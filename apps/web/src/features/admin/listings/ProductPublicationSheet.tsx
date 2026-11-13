'use client';

import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import type { AdminListingProduct } from '@apnatown/shared/admin';
import { EmptyState, ErrorState } from '@apnatown/ui/feedback/StateViews';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../../shared/api/result';
import { useAdmin } from '../AdminShell';
import { AdminFailure, Alert, Notice } from '../parts';
import { setProductPublication } from './api';
import { isListingConflict, useListingError } from './parts';
import { listingProductsOptions, useListingCommand } from './queries';

/**
 * Stable audit reason keys (the API only audits `reasonKey`; there is no
 * published taxonomy yet). TODO(verify): confirm with developer-backend.
 */
const REASON_KEY = {
  publish: 'admin.listing.product_published',
  unpublish: 'admin.listing.product_unpublished',
} as const;

/** Prototype prodMod: product rows with status and Publish/Unpublish. */
export function ProductPublicationSheet({
  businessId,
  canEdit,
  onClose,
}: {
  businessId: string;
  canEdit: boolean;
  onClose: () => void;
}) {
  const context = useAdmin();
  const t = useTranslations('admin.listings.products');
  const tl = useTranslations('admin.listings');
  const ts = useTranslations('admin.state');
  const message = useListingError();
  const locale = useLocale();
  const products = useInfiniteQuery(
    listingProductsOptions(context, businessId),
  );
  const items = products.data?.pages.flatMap((page) => page.items) ?? [];
  const code = products.isError ? failureCode(products.error) : undefined;
  const [pendingId, setPendingId] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const publication = useListingCommand(
    context,
    (
      api,
      input: { product: AdminListingProduct; published: boolean },
      command,
    ) =>
      setProductPublication(
        api,
        input.product.id,
        {
          published: input.published,
          reasonKey: REASON_KEY[input.published ? 'publish' : 'unpublish'],
          expectedVersion: input.product.version,
        },
        command,
      ),
  );
  const busy = publication.mutation.isPending;
  const failure = publication.mutation.error
    ? failureCode(publication.mutation.error)
    : undefined;
  const productName = (product: AdminListingProduct) =>
    (locale === 'hi' ? product.nameHi : null) ?? product.nameEn;

  let body;
  if (products.isPending) {
    body = <Skeleton label={ts('loading')} />;
  } else if (code && !products.data) {
    body = (
      <ErrorState
        headingLevel="h2"
        title={t('loadErrorTitle')}
        message={message(code)}
        action={
          <Button
            loading={products.isFetching}
            onClick={() => void products.refetch()}
          >
            {ts('retry')}
          </Button>
        }
      />
    );
  } else if (!items.length) {
    body = (
      <EmptyState
        headingLevel="h2"
        icon="📦"
        title={t('empty')}
        message={t('emptyMessage')}
        action={null}
      />
    );
  } else {
    body = (
      <ul className="m-0 grid list-none gap-0 p-0">
        {items.map((product) => {
          const name = productName(product);
          return (
            <li
              key={product.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-3 last:border-b-0"
            >
              <span className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="font-semibold [overflow-wrap:anywhere]">
                  {name}
                </span>
                <StatusBadge
                  tone={product.published ? 'ok' : 'neutral'}
                  icon={product.published ? '✓' : '○'}
                  label={t(product.published ? 'published' : 'unpublished')}
                />
              </span>
              {canEdit && (
                <Button
                  variant="outline"
                  size="small"
                  disabled={busy}
                  loading={busy && pendingId === product.id}
                  aria-label={t(
                    product.published ? 'unpublishNamed' : 'publishNamed',
                    { name },
                  )}
                  onClick={() => {
                    setPendingId(product.id);
                    setNotice(undefined);
                    publication.submit(
                      { product, published: !product.published },
                      () =>
                        setNotice(
                          t(
                            product.published
                              ? 'unpublishedNotice'
                              : 'publishedNotice',
                            { name },
                          ),
                        ),
                    );
                  }}
                >
                  {t(product.published ? 'unpublish' : 'publish')}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <Sheet
      open
      busy={busy}
      onOpenChange={(next) => !next && onClose()}
      title={t('title')}
      closeLabel={tl('close')}
    >
      <div className="grid gap-3" aria-busy={products.isFetching}>
        {failure && (
          <Alert
            message={
              isListingConflict(failure)
                ? tl('detail.reloaded', { reason: message(failure) })
                : message(failure)
            }
          />
        )}
        <Notice message={notice} />
        {body}
        {products.isFetchNextPageError && (
          <AdminFailure
            code={failureCode(products.error)}
            busy={products.isFetchingNextPage}
            retry={() => void products.fetchNextPage()}
          />
        )}
        {products.hasNextPage && !products.isFetchNextPageError && (
          <Button
            variant="outline"
            size="small"
            className="justify-self-center"
            loading={products.isFetchingNextPage}
            onClick={() => void products.fetchNextPage()}
          >
            {tl('loadMore')}
          </Button>
        )}
      </div>
    </Sheet>
  );
}
