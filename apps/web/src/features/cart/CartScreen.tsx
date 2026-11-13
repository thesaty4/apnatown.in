'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import { AccessState, useLoginHref } from '../../shared/auth/AccessState';
import { useOnline } from '../../shared/hooks/use-online';
import { publicHref } from '../../shared/i18n/preferences';
import { NavIcon } from '../../shared/ui/NavIcon';
import type { CartCommand } from './api';
import { CartGroup } from './CartGroup';
import { CartCheckoutBar, CartSummary } from './CartSummary';
import { cartErrorKey } from './errors';
import { isAvailable } from './format';
import { MergeReview } from './MergeReview';
import { isTransient, useCart, useCartCommands } from './queries';
import { SavedLines } from './SavedLines';
import { UnavailableLines } from './UnavailableLines';

/** S-CUST-10 client island: grouped lines | price details (desktop), stacked
 * with a sticky estimate bar on mobile. All amounts are server estimates. */
export function CartScreen() {
  const t = useTranslations('cart');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const online = useOnline();
  const login = useLoginHref();
  const { query, ready, session } = useCart();
  const commands = useCartCommands();
  const [last, setLast] = useState<CartCommand>();
  const [announcement, setAnnouncement] = useState('');
  const userId =
    session.state.kind === 'ready' ? session.state.data.userId : undefined;

  function run(command: CartCommand) {
    setLast(command);
    setAnnouncement('');
    void commands.run(command, () => {
      setLast(undefined);
      setAnnouncement(t('page.updated'));
    });
  }

  if (!ready) return <AccessState guest guestMessage={t('guest.message')} />;
  const home = publicHref('/', locale);
  if (query.isPending)
    return online ? (
      <Skeleton label={t('page.loading')} />
    ) : (
      <OfflineState
        title={t('offline.title')}
        message={t('offline.message')}
        action={null}
      />
    );
  if (query.isError) {
    const code = failureCode(query.error);
    if (code === 'COMMON_UNAVAILABLE')
      return (
        <EmptyState
          icon={<NavIcon name="cart" className="size-8" />}
          title={t('guest.title')}
          message={t('guest.message')}
          action={
            <Link className={buttonClassName} href={login}>
              {t('guest.action')}
            </Link>
          }
        />
      );
    if (code === 'COMMON_FORBIDDEN')
      return (
        <NoPermissionState
          title={t('denied.title')}
          message={t('denied.message')}
          action={
            <Link className={buttonClassName} href={home}>
              {t('denied.action')}
            </Link>
          }
        />
      );
    const State = online ? ErrorState : OfflineState;
    return (
      <State
        title={t(online ? 'error.title' : 'offline.title')}
        message={t(online ? 'error.message' : 'offline.message')}
        action={
          <Button
            loading={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {t('error.retry')}
          </Button>
        }
      />
    );
  }

  const cart = query.data;
  // Product-less lines are listed separately and never count as active.
  const active = cart.lines
    .filter(isAvailable)
    .filter((line) => !line.savedForLater);
  const disabled = commands.isPending || query.isFetching || !online;
  const error = commands.isError ? commands.error : undefined;
  const errorKey = error && cartErrorKey(error);
  return (
    <div className="grid gap-4">
      <h1 className="m-0 text-h1 desktop:text-h1-desktop">{t('page.title')}</h1>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {!online && (
        <p className="m-0 flex items-start gap-2 rounded-md border border-warning bg-warning-soft px-3 py-2 text-small">
          <NavIcon name="alert" className="mt-0.5 size-4" />
          {t('offline.notice')}
        </p>
      )}
      {errorKey && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-md border border-error bg-error-soft px-3 py-2 text-small"
        >
          <NavIcon name="alert" className="size-4" />
          <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
            {t(`errors.${errorKey}`)}
          </span>
          {errorKey === 'guestUnavailable' ? (
            <Link className={buttonClassName} href={login}>
              {t('guest.action')}
            </Link>
          ) : (
            last &&
            isTransient(error) && (
              <Button
                size="small"
                disabled={disabled}
                onClick={() => run(last)}
              >
                {t('errors.retry')}
              </Button>
            )
          )}
        </div>
      )}
      <MergeReview userId={userId} cart={cart} locale={locale} />
      {active.length === 0 ? (
        <>
          <EmptyState
            headingLevel="h2"
            icon={<NavIcon name="cart" className="size-8" />}
            title={t('empty.title')}
            message={t('empty.message')}
            action={
              <Link className={buttonClassName} href={home}>
                {t('empty.action')}
              </Link>
            }
          />
          <UnavailableLines cart={cart} disabled={disabled} onCommand={run} />
          <SavedLines
            cart={cart}
            locale={locale}
            disabled={disabled}
            onCommand={run}
          />
        </>
      ) : (
        <>
          {cart.groups.length > 1 && (
            <p className="m-0 flex items-start gap-2 rounded-md border border-info bg-info-soft px-3 py-2 text-small">
              <NavIcon name="info" className="mt-0.5 size-4" />
              <span className="min-w-0 [overflow-wrap:anywhere]">
                {t('page.split', { count: cart.groups.length })}
              </span>
            </p>
          )}
          <div className="grid items-start gap-4 desktop:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div className="grid min-w-0 gap-4">
              {cart.groups.map((group) => (
                <CartGroup
                  key={group.businessId}
                  group={group}
                  cart={cart}
                  locale={locale}
                  disabled={disabled}
                  onCommand={run}
                />
              ))}
              <UnavailableLines
                cart={cart}
                disabled={disabled}
                onCommand={run}
              />
              <SavedLines
                cart={cart}
                locale={locale}
                disabled={disabled}
                onCommand={run}
              />
            </div>
            <aside className="min-w-0 desktop:sticky desktop:top-explore-sidebar-top">
              <CartSummary cart={cart} locale={locale} />
            </aside>
          </div>
          <CartCheckoutBar cart={cart} locale={locale} />
        </>
      )}
    </div>
  );
}
