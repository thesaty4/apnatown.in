'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Address } from '@apnatown/shared/users';
import { Card } from '@apnatown/ui/cards/Card';
import { Radio } from '@apnatown/ui/primitives/Selection';
import { Button, buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { Notice } from '../../shared/ui/Notice';

export type AddressListState = {
  items: Address[];
  pending: boolean;
  failed: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  retry: () => void;
};

/** Saved-address picker (Users owns add/edit at /account/addresses). */
export function CheckoutAddress({
  list,
  selectedId,
  onSelect,
  required,
  disabled,
}: {
  list: AddressListState;
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  /** At least one shop is set to home delivery. */
  required: boolean;
  disabled: boolean;
}) {
  const t = useTranslations('checkout.address');
  const manage = (
    <Link
      href="/account/addresses"
      className={buttonVariantClassName('text', 'small')}
    >
      {list.items.length ? t('manage') : t('add')}
    </Link>
  );
  return (
    <Card padded className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="checkout-address" className="m-0 text-h4">
          {t('title')}
        </h2>
        {manage}
      </div>
      {list.pending ? (
        <Skeleton label={t('loading')} />
      ) : list.failed ? (
        <Notice
          tone="bad"
          role="alert"
          action={
            <Button size="small" onClick={list.retry}>
              {t('retry')}
            </Button>
          }
        >
          {t('error')}
        </Notice>
      ) : list.items.length === 0 ? (
        <Notice tone={required ? 'warn' : 'info'}>
          {t(required ? 'emptyRequired' : 'empty')}
        </Notice>
      ) : (
        <fieldset
          aria-labelledby="checkout-address"
          className="m-0 grid gap-1 border-0 p-0"
          disabled={disabled}
        >
          {list.items.map((address) => (
            <Radio
              key={address.id}
              name="checkout-address"
              value={address.id}
              checked={address.id === selectedId}
              onChange={() => onSelect(address.id)}
              label={
                address.isDefault
                  ? t('defaultLabel', { label: address.label })
                  : address.label
              }
              description={t('line', {
                address: address.addressText,
                pin: address.pinCode,
              })}
            />
          ))}
          {list.hasMore && (
            <Button
              variant="text"
              size="small"
              className="justify-self-start"
              loading={list.loadingMore}
              onClick={list.loadMore}
            >
              {t('more')}
            </Button>
          )}
        </fieldset>
      )}
      {!required && list.items.length > 0 && (
        <p className="m-0 text-small text-text-2">{t('pickupOnly')}</p>
      )}
    </Card>
  );
}
