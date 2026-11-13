'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
  OfflineState,
} from '@apnatown/ui/feedback/StateViews';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { Button, buttonClassName } from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../shared/api/result';
import { AccessState } from '../../shared/auth/AccessState';
import { useOnline } from '../../shared/hooks/use-online';
import { publicHref } from '../../shared/i18n/preferences';
import { Notice } from '../../shared/ui/Notice';
import { isTransient, useCart } from '../cart/queries';
import { CheckoutAddress } from './CheckoutAddress';
import { CheckoutGroup } from './CheckoutGroup';
import { CheckoutPayment, CheckoutTotals } from './CheckoutSummary';
import { STALE_CHECKOUT_CODES, useCheckoutError } from './errors';
import { usePlaceOrder, useCheckoutScope } from './queries';
import { useCheckoutAddresses, useCheckoutSelections } from './use-checkout';

/** S-CUST-11 client island. Signed-in customers only (guests log in and
 * return here); the server quote is the only source of fees and totals. */
export function CheckoutScreen() {
  const t = useTranslations('checkout');
  const { scope } = useCheckoutScope();
  return (
    <div className="grid gap-4">
      <h1 className="m-0 text-h1 desktop:text-h1-desktop">{t('page.title')}</h1>
      {scope ? (
        <CheckoutFlow />
      ) : (
        <AccessState guest guestMessage={t('page.loginMessage')} />
      )}
    </div>
  );
}

function CheckoutFlow() {
  const t = useTranslations('checkout');
  const errorText = useCheckoutError();
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const router = useRouter();
  const online = useOnline();
  const { query: cart } = useCart();
  const addresses = useCheckoutAddresses();
  const [placed, setPlaced] = useState(false);
  const selection = useCheckoutSelections(cart.data, addresses, placed);
  const { quote, current, error: quoteError, refresh } = selection.quote;
  const place = usePlaceOrder();
  const home = publicHref('/', locale);

  if (cart.isPending)
    return online ? (
      <Skeleton label={t('page.loading')} />
    ) : (
      <OfflineState
        headingLevel="h2"
        title={t('offline.title')}
        message={t('offline.message')}
        action={null}
      />
    );
  const cartData = cart.data;
  if (!cartData) {
    const code = failureCode(cart.error);
    if (code === 'COMMON_FORBIDDEN')
      return (
        <NoPermissionState
          headingLevel="h2"
          title={t('denied.title')}
          message={t('denied.message')}
          action={
            <Link className={buttonClassName} href={home}>
              {t('denied.action')}
            </Link>
          }
        />
      );
    return (
      <ErrorState
        headingLevel="h2"
        title={t('error.title')}
        message={t('error.message')}
        action={
          <Button loading={cart.isFetching} onClick={() => void cart.refetch()}>
            {t('error.retry')}
          </Button>
        }
      />
    );
  }
  if (cartData.groups.length === 0 && !placed)
    return (
      <EmptyState
        headingLevel="h2"
        icon="🛒"
        title={t('empty.title')}
        message={t('empty.message')}
        action={
          <Link className={buttonClassName} href={home}>
            {t('empty.action')}
          </Link>
        }
      />
    );
  if (!quote)
    return quoteError ? (
      <ErrorState
        headingLevel="h2"
        title={t('error.title')}
        message={errorText(quoteError)}
        action={<Button onClick={refresh}>{t('error.retry')}</Button>}
      />
    ) : (
      <Skeleton label={t('page.quoting')} />
    );

  const busy = place.isPending || placed;
  const placeable =
    online &&
    current &&
    quote.ready &&
    !busy &&
    quote.paymentMethods.some((m) => m.method === 'cash' && m.available);

  function submit() {
    if (!quote || !placeable) return;
    void place.run(
      {
        quoteId: quote.quoteId,
        expectedCartVersion: quote.cartVersion,
        ...(quote.addressVersion !== null && {
          expectedAddressVersion: quote.addressVersion,
        }),
        paymentMethod: 'cash',
      },
      (attempt) => {
        setPlaced(true);
        router.push(
          `/checkout/success?${new URLSearchParams({ attempt: attempt.id })}`,
        );
      },
    );
  }
  const placeError = place.isError ? place.error : undefined;
  const stalePlace =
    placeError !== undefined &&
    STALE_CHECKOUT_CODES.has(failureCode(placeError));

  return (
    <div className="grid gap-4">
      <p role="status" aria-live="polite" className="sr-only">
        {current ? t('page.quoted') : ''}
      </p>
      {!online && (
        <Notice tone="warn" role="status">
          {t('offline.notice')}
        </Notice>
      )}
      {quoteError && (
        <Notice
          tone="bad"
          role="alert"
          action={
            <Button size="small" onClick={refresh}>
              {t('error.retry')}
            </Button>
          }
        >
          {errorText(quoteError)}
        </Notice>
      )}
      {placeError !== undefined && (
        <Notice
          tone="bad"
          role="alert"
          action={
            stalePlace ? (
              <Button
                size="small"
                onClick={() => {
                  place.reset();
                  void cart.refetch();
                  refresh();
                }}
              >
                {t('errors.review')}
              </Button>
            ) : isTransient(placeError) ? (
              <Button size="small" disabled={!placeable} onClick={submit}>
                {t('errors.retry')}
              </Button>
            ) : null
          }
        >
          {errorText(placeError)}
        </Notice>
      )}
      {quote.groups.length > 1 && (
        <Notice tone="info">
          {t('page.split', { count: quote.groups.length })}
        </Notice>
      )}
      <div className="grid items-start gap-4 desktop:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="grid min-w-0 gap-4">
          <CheckoutAddress
            list={addresses}
            selectedId={selection.address?.id}
            onSelect={selection.setAddress}
            required={selection.needsAddress}
            disabled={busy}
          />
          {quote.groups.map((group) => (
            <CheckoutGroup
              key={group.businessId}
              group={group}
              locale={locale}
              selected={selection.modes[group.businessId]}
              disabled={busy}
              onMode={(mode) => selection.setMode(group.businessId, mode)}
            />
          ))}
          <CheckoutPayment
            quote={quote}
            cashLabel={selection.cashLabel}
            disabled={busy}
          />
          <Notice tone="info">{t('page.notAvailable')}</Notice>
        </div>
        <aside className="min-w-0 desktop:sticky desktop:top-explore-sidebar-top">
          <CheckoutTotals
            quote={quote}
            locale={locale}
            placeable={placeable}
            stale={!current}
            placing={busy}
            onPlace={submit}
          />
        </aside>
      </div>
    </div>
  );
}
