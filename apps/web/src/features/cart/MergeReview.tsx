'use client';

import { useTranslations } from 'next-intl';
import type { Cart } from '@apnatown/shared/cart';
import { Button } from '@apnatown/ui/primitives/Button';
import { NavIcon } from '../../shared/ui/NavIcon';
import { isAvailable, productName, type Locale } from './format';
import {
  clearMergeRecord,
  useGuestCartMerge,
  useMergeRecord,
  type MergeReviewItem,
} from './merge';

const reasonKeys = {
  QUANTITY_CLIPPED: 'quantityClipped',
  LINE_LIMIT_REACHED: 'lineLimitReached',
  PRODUCT_UNAVAILABLE: 'productUnavailable',
  OUT_OF_STOCK: 'outOfStock',
  QUANTITY_EXCEEDS_STOCK: 'quantityExceedsStock',
  VARIANT_SELECTION_REQUIRED: 'variantSelectionRequired',
  VARIANT_UNAVAILABLE: 'variantUnavailable',
} as const;

function itemName(item: MergeReviewItem, cart: Cart, locale: Locale) {
  const line =
    cart.lines.find((candidate) => candidate.id === item.lineId) ??
    cart.lines.find(
      (candidate) =>
        candidate.productId === item.productId &&
        candidate.variantId === item.variantId,
    );
  return line && isAvailable(line) ? productName(line, locale) : undefined;
}

/**
 * Post-login guest-cart merge outcome (J12): clipped/unmerged/attention lines
 * for review, or — after a failed/lost merge — a retry that reuses the stored
 * idempotency key. Never merges on mount; only on the explicit retry.
 */
export function MergeReview({
  userId,
  cart,
  locale,
}: {
  userId: string | undefined;
  cart: Cart;
  locale: Locale;
}) {
  const t = useTranslations('cart.merge');
  const record = useMergeRecord(userId);
  const merge = useGuestCartMerge();
  if (!record) return null;
  const pending = record.review === null;
  return (
    <section
      aria-labelledby="cart-merge"
      className="grid gap-2 rounded-lg border border-warning bg-warning-soft p-4 text-text"
    >
      <h2
        id="cart-merge"
        className="m-0 flex items-start gap-2 text-h4 [overflow-wrap:anywhere]"
      >
        <NavIcon name="alert" className="mt-0.5 size-5" />
        {pending ? t('pendingTitle') : t('title')}
      </h2>
      <p className="m-0 text-small">
        {pending ? t('pendingMessage') : t('intro')}
      </p>
      {record.review && (
        <ul className="m-0 grid gap-1 ps-5 text-small">
          {record.review.map((item, index) => (
            <li key={`${item.productId}:${item.variantId ?? ''}:${index}`}>
              {t('item', {
                name: itemName(item, cart, locale) ?? t('unknownItem'),
                reasons: new Intl.ListFormat(
                  locale === 'hi' ? 'hi-IN' : 'en-IN',
                ).format(
                  item.reasons.map((reason) =>
                    t(`reasons.${reasonKeys[reason]}`),
                  ),
                ),
              })}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        {pending && (
          <Button
            size="small"
            loading={merge.running}
            onClick={() => void merge.merge(true)}
          >
            {t('retry')}
          </Button>
        )}
        <Button
          size="small"
          variant="ghost"
          disabled={merge.running}
          onClick={clearMergeRecord}
        >
          {t('dismiss')}
        </Button>
      </div>
    </section>
  );
}
