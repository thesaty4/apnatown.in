'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { QuantityStepper } from '@apnatown/ui/commerce/QuantityStepper';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';
import { publicHref } from '../../shared/i18n/preferences';
import { NavIcon } from '../../shared/ui/NavIcon';
import type { CartCommand } from './api';
import {
  issueView,
  lineMax,
  money,
  productName,
  type AvailableLine,
  type Locale,
} from './format';

const textAction =
  'inline-flex min-h-touch items-center gap-1.5 rounded-sm px-2 text-small font-semibold text-primary hover:bg-primary-soft focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50';

export function LineThumb({
  line,
  locale,
}: {
  line: AvailableLine;
  locale: Locale;
}) {
  const image = line.product.image;
  return image ? (
    <img
      src={image.path}
      alt=""
      width={image.width}
      height={image.height}
      loading="lazy"
      decoding="async"
      className="size-16 shrink-0 rounded-md object-cover"
    />
  ) : (
    <span
      aria-hidden="true"
      title={productName(line, locale)}
      className="grid size-16 shrink-0 place-items-center rounded-md bg-surface-2 text-muted"
    >
      <NavIcon name="box" />
    </span>
  );
}

export function LineName({
  line,
  locale,
}: {
  line: AvailableLine;
  locale: Locale;
}) {
  const name = productName(line, locale);
  return line.product.slug ? (
    <Link
      href={publicHref(`/product/${line.product.slug}`, locale)}
      className="rounded-xs font-semibold text-text hover:underline focus-visible:ring-focus"
    >
      {name}
    </Link>
  ) : (
    <span className="font-semibold">{name}</span>
  );
}

/** Issue badges: localized text plus icon, never colour alone. */
export function LineIssues({ line }: { line: AvailableLine }) {
  const t = useTranslations('cart.issues');
  if (line.issues.length === 0) return null;
  return (
    <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
      {line.issues.map((issue) => (
        <li key={issue}>
          <StatusBadge
            tone={issueView[issue].tone}
            icon={<NavIcon name="alert" className="size-3.5" />}
            label={t(issueView[issue].key, {
              count: line.product.maxQuantity,
            })}
          />
        </li>
      ))}
    </ul>
  );
}

/** One active line (prototype cart row): thumb, name, unit · option, issues,
 * stepper bounded 1..min(10, stock), server line subtotal, save/remove. */
export function CartLineItem({
  line,
  cartVersion,
  locale,
  disabled,
  onCommand,
}: {
  line: AvailableLine;
  cartVersion: number;
  locale: Locale;
  disabled: boolean;
  onCommand: (command: CartCommand) => void;
}) {
  const t = useTranslations('cart.line');
  const name = productName(line, locale);
  const max = lineMax(line);
  const versions = {
    expectedVersion: line.version,
    expectedCartVersion: cartVersion,
  };
  const unavailable = line.issues.includes('PRODUCT_UNAVAILABLE');
  const details = [
    line.product.unit,
    line.variantLabel && t('variant', { label: line.variantLabel }),
  ].filter(Boolean);
  return (
    <li className="grid gap-3 border-t border-border py-3 first:border-t-0">
      <div className="flex gap-3">
        <LineThumb line={line} locale={locale} />
        <div className="grid min-w-0 flex-1 content-start gap-1">
          <LineName line={line} locale={locale} />
          {details.length > 0 && (
            <p className="m-0 text-small text-text-2">{details.join(' · ')}</p>
          )}
          {line.product.unitPricePaise !== null && (
            <p className="m-0 text-small text-text-2">
              {t('unitPrice', {
                price: money(line.product.unitPricePaise, locale),
              })}
            </p>
          )}
          <LineIssues line={line} />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <QuantityStepper
            value={line.quantity}
            min={1}
            max={max}
            label={t('quantity', { name })}
            decreaseLabel={t('decrease', { name })}
            increaseLabel={t('increase', { name })}
            disabled={disabled || unavailable}
            onChange={(quantity) =>
              onCommand({
                op: 'update',
                lineId: line.id,
                body: { quantity, ...versions },
              })
            }
          />
          {!unavailable && line.quantity >= max && (
            <span className="text-small text-text-2">{t('maxReached')}</span>
          )}
        </div>
        <p className="m-0 text-price font-bold">
          {line.lineSubtotalPaise === null ? (
            <span className="text-small font-semibold text-text-2">
              {t('priceUnavailable')}
            </span>
          ) : (
            money(line.lineSubtotalPaise, locale)
          )}
        </p>
      </div>
      <div className="flex flex-wrap gap-x-2">
        <button
          type="button"
          className={textAction}
          disabled={disabled}
          onClick={() =>
            onCommand({ op: 'save', lineId: line.id, body: versions })
          }
        >
          <NavIcon name="bookmark" className="size-4" />
          {t('saveForLater')}
          <span className="sr-only">, {name}</span>
        </button>
        <button
          type="button"
          className={textAction}
          disabled={disabled}
          onClick={() =>
            onCommand({ op: 'remove', lineId: line.id, body: versions })
          }
        >
          <NavIcon name="trash" className="size-4" />
          {t('remove')}
          <span className="sr-only">, {name}</span>
        </button>
      </div>
    </li>
  );
}
