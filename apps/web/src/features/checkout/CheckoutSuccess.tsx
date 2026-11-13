'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@apnatown/ui/cards/Card';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
  OfflineState,
} from '@apnatown/ui/feedback/StateViews';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import {
  Button,
  buttonClassName,
  buttonVariantClassName,
} from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../shared/api/result';
import { AccessState } from '../../shared/auth/AccessState';
import { useOnline } from '../../shared/hooks/use-online';
import { publicHref } from '../../shared/i18n/preferences';
import { OrderModeBadge, OrderStatusBadge } from '../orders/OrderStatusBadge';
import { localName, money } from './format';
import { isNotFound, useCheckoutAttempt, useCheckoutScope } from './queries';

/** S-CUST-12. `attemptId` is null when the URL carries no valid ID. */
export function CheckoutSuccess({ attemptId }: { attemptId: string | null }) {
  const t = useTranslations('checkout.success');
  const { scope } = useCheckoutScope();
  if (!scope) return <AccessState guest guestMessage={t('loginMessage')} />;
  return attemptId ? <Attempt attemptId={attemptId} /> : <NoAttempt />;
}

function NoAttempt() {
  const t = useTranslations('checkout.success');
  return (
    <EmptyState
      icon="🛍️"
      title={t('none.title')}
      message={t('none.message')}
      action={
        <Link className={buttonClassName} href="/orders">
          {t('none.action')}
        </Link>
      }
    />
  );
}

function Attempt({ attemptId }: { attemptId: string }) {
  const t = useTranslations('checkout.success');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const online = useOnline();
  const query = useCheckoutAttempt(attemptId);
  if (query.isPending)
    return online ? (
      <Skeleton label={t('loading')} />
    ) : (
      <OfflineState
        title={t('offline.title')}
        message={t('offline.message')}
        action={null}
      />
    );
  if (!query.data) {
    if (isNotFound(query.error)) return <NoAttempt />;
    if (failureCode(query.error) === 'COMMON_FORBIDDEN')
      return (
        <NoPermissionState
          title={t('denied.title')}
          message={t('denied.message')}
          action={
            <Link className={buttonClassName} href="/orders">
              {t('none.action')}
            </Link>
          }
        />
      );
    return (
      <ErrorState
        title={t('error.title')}
        message={t('error.message')}
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
  const attempt = query.data;
  const count = attempt.orders.length;
  return (
    <div className="mx-auto grid w-full max-w-state-copy gap-4">
      <section className="grid justify-items-center gap-2 text-center">
        <div
          aria-hidden="true"
          className="grid size-state-icon place-items-center rounded-pill bg-success-soft text-state-icon"
        >
          ✅
        </div>
        <h1 className="m-0 font-display text-h1">{t('title')}</h1>
        <p className="m-0 text-text-2 [overflow-wrap:anywhere]">
          {count > 1 ? t('split', { count }) : t('notified')}
        </p>
      </section>
      <ul className="m-0 grid list-none gap-3 p-0">
        {attempt.orders.map((order) => (
          <li key={order.id}>
            <Card padded className="grid gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="m-0 min-w-0 text-h4 [overflow-wrap:anywhere]">
                  {localName(
                    {
                      nameEn: order.businessNameEn,
                      nameHi: order.businessNameHi,
                    },
                    locale,
                  )}
                </h2>
                <OrderStatusBadge status={order.status} mode={order.mode} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-small">
                <span>
                  {t('orderId')} <b>{order.orderNumber}</b>
                </span>
                <b>{money(order.totalPaise, locale)}</b>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <OrderModeBadge mode={order.mode} />
                <span className="text-small text-text-2">
                  {t(order.mode === 'pickup' ? 'payPickup' : 'payDelivery')}
                </span>
              </div>
              <Link
                className={`${buttonClassName} w-full`}
                href={`/orders/${order.id}`}
              >
                {t('track')}
              </Link>
            </Card>
          </li>
        ))}
      </ul>
      {count > 1 && (
        <p className="m-0 text-center font-semibold">
          {t('total', { amount: money(attempt.totalPaise, locale) })}
        </p>
      )}
      <p className="m-0 text-center text-small text-text-2">{t('codeHint')}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link className={buttonVariantClassName('outline')} href="/orders">
          {t('myOrders')}
        </Link>
        <Link
          className={buttonVariantClassName('text')}
          href={publicHref('/', locale)}
        >
          {t('continue')}
        </Link>
      </div>
    </div>
  );
}
