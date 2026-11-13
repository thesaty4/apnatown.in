'use client';

import { useTranslations } from 'next-intl';
import type { OrderMode } from '@apnatown/shared/orders';
import type { CheckoutQuoteGroup } from '@apnatown/shared/checkout';
import { Card } from '@apnatown/ui/cards/Card';
import { Badge } from '@apnatown/ui/primitives/Badge';
import { Radio } from '@apnatown/ui/primitives/Selection';
import { Notice } from '../../shared/ui/Notice';
import {
  feeSourceKey,
  groupIssueKey,
  localName,
  money,
  type Locale,
} from './format';

const lineIssueKey = {
  PRODUCT_UNAVAILABLE: 'productUnavailable',
  OUT_OF_STOCK: 'outOfStock',
  QUANTITY_EXCEEDS_STOCK: 'quantityExceedsStock',
  VARIANT_SELECTION_REQUIRED: 'variantSelectionRequired',
  VARIANT_UNAVAILABLE: 'variantUnavailable',
} as const;

/** One shop section (S-CUST-11): mode choice, issues, lines and breakdown.
 * Every amount is the server quote's; null renders "to be confirmed". */
export function CheckoutGroup({
  group,
  locale,
  selected,
  disabled,
  onMode,
}: {
  group: CheckoutQuoteGroup;
  locale: Locale;
  /** The customer's choice (the quote may still be catching up). */
  selected: OrderMode | undefined;
  disabled: boolean;
  onMode: (mode: OrderMode) => void;
}) {
  const t = useTranslations('checkout');
  const lineIssue = useTranslations('cart.issues');
  const amount = (paise: number | null) =>
    paise === null ? t('amount.unknown') : money(paise, locale);
  const issue = (code: CheckoutQuoteGroup['issues'][number]) =>
    code === 'MINIMUM_ORDER_NOT_MET' && group.minimumOrderPaise !== null
      ? t('issues.minimumAmount', {
          amount: money(group.minimumOrderPaise, locale),
        })
      : t(`issues.${groupIssueKey[code]}`);
  const name = group.business
    ? localName(group.business, locale)
    : t('group.unknownShop');
  const headingId = `checkout-group-${group.businessId}`;
  const options = [
    ['delivery', group.fulfilment.delivery],
    ['pickup', group.fulfilment.pickup],
  ] as const;
  const items = group.lines.reduce((sum, line) => sum + line.quantity, 0);
  return (
    <Card padded className="grid gap-3" aria-labelledby={headingId}>
      <div className="flex flex-wrap items-center gap-2">
        <h2
          id={headingId}
          className="m-0 min-w-0 flex-1 text-h4 [overflow-wrap:anywhere]"
        >
          {name}
        </h2>
        <Badge label={t('group.items', { count: items })} />
      </div>
      <fieldset
        className="m-0 grid gap-1 border-0 p-0 tablet:grid-cols-2"
        disabled={disabled}
      >
        <legend className="mb-1 text-small font-semibold">
          {t('group.modeLegend')}
        </legend>
        {options.map(([mode, availability]) => (
          <Radio
            key={mode}
            name={`checkout-mode-${group.businessId}`}
            value={mode}
            checked={selected === mode}
            disabled={!availability.available}
            onChange={() => onMode(mode)}
            label={t(`group.${mode}`)}
            {...(!availability.available &&
              availability.reasonCode && {
                description: t(
                  `issues.${groupIssueKey[availability.reasonCode]}`,
                ),
              })}
          />
        ))}
      </fieldset>
      {group.mode && group.deliveryFeeSource && (
        <p className="m-0 text-small text-text-2">
          {t(`group.feeSource.${feeSourceKey[group.deliveryFeeSource]}`)}
        </p>
      )}
      {group.issues.length > 0 && (
        <ul className="m-0 grid list-none gap-2 p-0">
          {group.issues.map((code) => (
            <li key={code}>
              <Notice tone="warn">{issue(code)}</Notice>
            </li>
          ))}
        </ul>
      )}
      <ul className="m-0 grid list-none gap-2 p-0 text-small">
        {group.lines.map((line) => (
          <li key={line.cartLineId} className="grid gap-1">
            <div className="flex flex-wrap justify-between gap-x-3">
              <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                {line.variantLabel
                  ? t('group.lineVariant', {
                      name: localName(line, locale),
                      variant: line.variantLabel,
                      quantity: line.quantity,
                    })
                  : t('group.line', {
                      name: localName(line, locale),
                      quantity: line.quantity,
                    })}
              </span>
              <span>{amount(line.lineTotalPaise)}</span>
            </div>
            {line.issues.map((code) => (
              <span key={code} className="flex gap-1 text-error">
                <span aria-hidden="true">⚠️</span>
                {lineIssue(lineIssueKey[code], { count: line.quantity })}
              </span>
            ))}
          </li>
        ))}
      </ul>
      <dl className="m-0 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 border-t border-border pt-3 text-small">
        <dt className="text-text-2">{t('amount.subtotal')}</dt>
        <dd className="m-0 text-end">
          {money(group.itemsSubtotalPaise, locale)}
        </dd>
        {group.couponDiscountPaise > 0 && (
          <>
            <dt className="text-text-2">{t('amount.discount')}</dt>
            <dd className="m-0 text-end text-success">
              {t('amount.minus', {
                amount: money(group.couponDiscountPaise, locale),
              })}
            </dd>
          </>
        )}
        <dt className="text-text-2">{t('amount.delivery')}</dt>
        <dd className="m-0 text-end">{amount(group.deliveryFeePaise)}</dd>
        <dt className="text-text-2">{t('amount.platformFee')}</dt>
        <dd className="m-0 text-end">{amount(group.platformFeePaise)}</dd>
        <dt className="font-bold">{t('amount.orderTotal')}</dt>
        <dd className="m-0 text-end font-bold">{amount(group.totalPaise)}</dd>
      </dl>
    </Card>
  );
}
