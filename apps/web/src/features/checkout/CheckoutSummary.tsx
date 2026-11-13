'use client';

import { useTranslations } from 'next-intl';
import type { CheckoutQuote } from '@apnatown/shared/checkout';
import { Card } from '@apnatown/ui/cards/Card';
import { Button } from '@apnatown/ui/primitives/Button';
import { Radio } from '@apnatown/ui/primitives/Selection';
import { paymentMethodKey } from '../orders/status';
import { money, quoteIssueKey, type Locale } from './format';

export type CashLabel = 'cashDelivery' | 'cashPickup' | 'cashMixed';
const BLOCKED_ID = 'checkout-blocked';
/** Cash is the single selectable method, so a change keeps it selected. */
const keep = () => undefined;

/** Payment choice: cash (COD / pay at pickup) only; online is not live yet. */
export function CheckoutPayment({
  quote,
  cashLabel,
  disabled,
}: {
  quote: CheckoutQuote;
  cashLabel: CashLabel;
  disabled: boolean;
}) {
  const t = useTranslations('checkout.payment');
  return (
    <Card padded className="grid gap-2">
      <h2 id="checkout-payment" className="m-0 text-h4">
        {t('title')}
      </h2>
      <fieldset
        aria-labelledby="checkout-payment"
        className="m-0 grid gap-1 border-0 p-0"
        disabled={disabled}
      >
        {quote.paymentMethods.map(({ method, available }) => {
          const cash = method === 'cash';
          return (
            <Radio
              key={method}
              name="checkout-payment"
              value={method}
              // Cash is the only placeable method; online stays unselectable.
              checked={cash && available}
              onChange={keep}
              disabled={!cash || !available}
              label={t(cash ? cashLabel : `method.${paymentMethodKey[method]}`)}
              description={
                cash && available
                  ? t('cashHint')
                  : t(cash ? 'cashUnavailable' : 'notAvailable')
              }
            />
          );
        })}
      </fieldset>
    </Card>
  );
}

/** Totals + Place order (desktop column and the stacked mobile card). */
export function CheckoutTotals({
  quote,
  locale,
  placeable,
  stale,
  placing,
  onPlace,
}: {
  quote: CheckoutQuote;
  locale: Locale;
  placeable: boolean;
  /** The shown quote no longer matches the current choices. */
  stale: boolean;
  placing: boolean;
  onPlace: () => void;
}) {
  const t = useTranslations('checkout');
  const { totals } = quote;
  const amount = (paise: number | null) =>
    paise === null ? t('amount.unknown') : money(paise, locale);
  const count = quote.groups.length;
  const issue = quote.issues[0];
  return (
    <Card padded className="grid gap-3">
      <h2 className="m-0 text-h4">{t('summary.title')}</h2>
      <dl className="m-0 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2">
        <dt className="text-text-2">{t('amount.subtotal')}</dt>
        <dd className="m-0 text-end">
          {money(totals.itemsSubtotalPaise, locale)}
        </dd>
        {totals.discountPaise > 0 && (
          <>
            <dt className="text-text-2">{t('amount.discount')}</dt>
            <dd className="m-0 text-end text-success">
              {t('amount.minus', {
                amount: money(totals.discountPaise, locale),
              })}
            </dd>
          </>
        )}
        <dt className="text-text-2">{t('amount.delivery')}</dt>
        <dd className="m-0 text-end">{amount(totals.deliveryFeePaise)}</dd>
        <dt className="text-text-2">{t('amount.platformFee')}</dt>
        <dd className="m-0 text-end">{amount(totals.platformFeePaise)}</dd>
        <dt className="border-t border-border pt-2 font-bold">
          {t('summary.total', { count })}
        </dt>
        <dd className="m-0 border-t border-border pt-2 text-end text-price font-bold">
          {amount(totals.totalPaise)}
        </dd>
      </dl>
      {count > 1 && (
        <p className="m-0 text-small text-text-2">{t('summary.separate')}</p>
      )}
      <p className="m-0 text-small text-text-2">{t('summary.taxes')}</p>
      <Button
        className="w-full"
        disabled={!placeable}
        loading={placing}
        aria-describedby={placeable ? undefined : BLOCKED_ID}
        onClick={onPlace}
      >
        {t('summary.place')}
      </Button>
      {!placeable && !placing && (
        <p id={BLOCKED_ID} className="m-0 text-small text-text-2">
          {stale
            ? t('summary.updating')
            : issue
              ? t(`issues.${quoteIssueKey[issue]}`)
              : t('summary.blocked')}
        </p>
      )}
    </Card>
  );
}
