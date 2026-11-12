'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, type DehydratedState } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { Address } from '@apnatown/shared/users';
import { AddressCard } from '@apnatown/ui/geo/Address';
import { Button, buttonClassName } from '@apnatown/ui/primitives/Button';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import {
  EmptyState,
  NoPermissionState,
} from '@apnatown/ui/feedback/StateViews';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import { Failure } from '../../shared/auth/AccessState';
import { failureCode } from '../../shared/api/result';
import { useIdempotencyKey } from '../../shared/api/idempotency';
import { OwnBoundary, type OwnContext } from './OwnResource';
import { addressesOptions } from './address-api';
import { useDeleteAddress, useSaveAddress } from './address-queries';
import {
  AddressFailure,
  InlineAlert,
  isForbidden,
  useAddressDetails,
} from './address-parts';
import { AddressSheet, type Latest } from './AddressForm';

export function Addresses({
  initial,
  owner,
}: {
  initial: DehydratedState;
  owner?: string | undefined;
}) {
  const t = useTranslations('account.addresses');
  return (
    <div className="grid gap-4">
      <h1 className="text-h1">{t('title')}</h1>
      <OwnBoundary
        initial={initial}
        owner={owner}
        guestMessage={t('guestMessage')}
      >
        {(context) => <AddressBook {...context} />}
      </OwnBoundary>
    </div>
  );
}

function AddressBook({ api, scope, lifecycle }: OwnContext) {
  const t = useTranslations('account.addresses');
  const details = useAddressDetails();
  const query = useInfiniteQuery(addressesOptions(api, scope, lifecycle));
  const setDefault = useSaveAddress();
  const remove = useDeleteAddress();
  const keys = useIdempotencyKey();
  const [target, setTarget] = useState<Address | 'new'>();
  const [removing, setRemoving] = useState<Address>();
  const [notice, setNotice] = useState<string>();
  const [defaulting, setDefaulting] = useState<Address>();
  const status = useRef<HTMLParagraphElement>(null);
  const busy = setDefault.isPending || remove.isPending;
  // Runs after the dialog restores focus: the acted-on control may be gone.
  useEffect(() => {
    if (notice) status.current?.focus();
  }, [notice]);

  if (query.isPending) return <Skeleton label={t('loading')} />;
  const retry = () => void query.refetch();
  if (!query.data) {
    const code = failureCode(query.error);
    return isForbidden(code) ? (
      <NoPermissionState
        title={t('errors.forbiddenTitle')}
        message={t('errors.forbidden')}
        action={
          <Link className={buttonClassName} href="/account">
            {t('back')}
          </Link>
        }
      />
    ) : (
      <Failure code={code} retry={retry} retryDisabled={query.isFetching} />
    );
  }

  const items = query.data.pages.flatMap((page) => page.items);
  const open = (next: Address | 'new') => {
    setNotice(undefined);
    setDefault.reset();
    setTarget(next);
  };
  const refresh = () => {
    setDefault.reset();
    remove.reset();
    setRemoving(undefined);
    retry();
  };
  async function makeDefault(address: Address) {
    setNotice(undefined);
    setDefaulting(address);
    const body = { isDefault: true, expectedVersion: address.version };
    await setDefault.run(
      {
        kind: 'update',
        id: address.id,
        body,
        key: keys.for(JSON.stringify(['default', address.id, body])),
      },
      () => {
        keys.clear();
        setDefault.reset();
        setNotice(t('defaultSaved'));
      },
    );
  }
  async function confirmDelete() {
    if (!removing) return;
    const input = { id: removing.id, expectedVersion: removing.version };
    await remove.run(
      { ...input, key: keys.for(JSON.stringify(['delete', input])) },
      () => {
        keys.clear();
        remove.reset();
        setRemoving(undefined);
        setNotice(t('deleted'));
      },
    );
  }
  async function findLatest(id: string): Promise<Latest> {
    const result = await query.refetch();
    if (result.isError) return 'failed';
    return (
      result.data?.pages
        .flatMap((page) => page.items)
        .find((address) => address.id === id) ?? 'missing'
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {items.length > 0 && (
          <Button disabled={busy} onClick={() => open('new')}>
            {t('addNew')}
          </Button>
        )}
        <p
          ref={status}
          role="status"
          tabIndex={-1}
          className="min-w-0 flex-1 font-semibold outline-none"
        >
          {notice && `✓ ${notice}`}
        </p>
      </div>
      {query.isRefetchError && (
        <InlineAlert
          message={t('refreshFailed')}
          action={
            <Button
              variant="outline"
              disabled={query.isFetching}
              onClick={retry}
            >
              {t('retry')}
            </Button>
          }
        />
      )}
      {setDefault.isError && (
        <AddressFailure
          code={failureCode(setDefault.error)}
          busy={busy}
          retry={() => {
            if (defaulting) void makeDefault(defaulting);
          }}
          refresh={refresh}
        />
      )}
      {items.length === 0 ? (
        <EmptyState
          title={t('emptyTitle')}
          message={t('emptyMessage')}
          action={<Button onClick={() => open('new')}>{t('add')}</Button>}
        />
      ) : (
        <ul className="grid gap-4" aria-label={t('title')}>
          {items.map((address) => (
            <li key={address.id}>
              <AddressCard
                label={address.label}
                addressText={address.addressText}
                details={details(address)}
                defaultLabel={address.isDefault ? t('default') : undefined}
                actions={
                  <>
                    <Button
                      variant="outline"
                      disabled={busy}
                      aria-label={t('editNamed', { label: address.label })}
                      onClick={() => open(address)}
                    >
                      {t('edit')}
                    </Button>
                    {!address.isDefault && (
                      <Button
                        variant="ghost"
                        disabled={busy}
                        loading={
                          setDefault.isPending && defaulting?.id === address.id
                        }
                        aria-label={t('setDefaultNamed', {
                          label: address.label,
                        })}
                        onClick={() => void makeDefault(address)}
                      >
                        {t('setDefault')}
                      </Button>
                    )}
                    <Button
                      variant="text"
                      disabled={busy}
                      aria-label={t('deleteNamed', { label: address.label })}
                      onClick={() => {
                        setNotice(undefined);
                        remove.reset();
                        setRemoving(address);
                      }}
                    >
                      {t('delete')}
                    </Button>
                  </>
                }
              />
            </li>
          ))}
        </ul>
      )}
      {query.hasNextPage && (
        <Button
          variant="outline"
          loading={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {t('loadMore')}
        </Button>
      )}
      {query.isFetchNextPageError && (
        <InlineAlert
          message={t('loadMoreFailed')}
          action={
            <Button
              variant="outline"
              disabled={query.isFetching}
              onClick={() => void query.fetchNextPage()}
            >
              {t('retry')}
            </Button>
          }
        />
      )}
      <AddressSheet
        target={target}
        onClose={() => setTarget(undefined)}
        findLatest={findLatest}
        onSaved={(_saved, created) => {
          setTarget(undefined);
          setNotice(t(created ? 'saved' : 'updated'));
        }}
      />
      <ConfirmDialog
        open={removing !== undefined}
        onOpenChange={(next) => {
          if (next) return;
          remove.reset();
          setRemoving(undefined);
        }}
        title={t('deleteTitle')}
        impact={t(
          removing?.isDefault ? 'deleteDefaultImpact' : 'deleteImpact',
          {
            label: removing?.label ?? '',
          },
        )}
        cancelLabel={t('cancel')}
        confirmLabel={t('delete')}
        onConfirm={() => void confirmDelete()}
        busy={remove.isPending}
        tone="danger"
      >
        {remove.isError && (
          <AddressFailure
            code={failureCode(remove.error)}
            busy={remove.isPending}
            retry={() => void confirmDelete()}
            refresh={refresh}
          />
        )}
      </ConfirmDialog>
    </div>
  );
}
