'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import type { Cart } from '@apnatown/shared/cart';
import { Card } from '@apnatown/ui/cards/Card';
import { buttonClassName } from '@apnatown/ui/primitives/Button';
import { loginHref } from '../../shared/auth/return-to';
import { useSession } from '../../shared/auth/SessionProvider';
import { money, type Locale } from './format';

/** Proceed to /checkout (S-CUST-11). Guests log in first and return there;
 * the guest cart merges on login (J12). */
function CheckoutButton({ className = '' }: { className?: string }) {
  const t = useTranslations('cart.summary');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const { state } = useSession();
  const href =
    state.kind === 'ready' ? '/checkout' : loginHref(locale, '/checkout');
  return (
    <Link href={href} className={`${buttonClassName} ${className}`}>
      {t('checkout')}
    </Link>
  );
}

/**
 * Prototype "Price details" (right column). Only the server estimate is shown:
 * delivery/fees are quote-only (checkout) and coupon entry is omitted until
 * coupons are configured. Nothing here is a final payable total.
 */
export function CartSummary({ cart, locale }: { cart: Cart; locale: Locale }) {
  const t = useTranslations('cart.summary');
  const amounts = cart.estimatedAmounts;
  const issues = cart.lines.some(
    (line) => !line.savedForLater && line.issues.length > 0,
  );
  return (
    <section aria-labelledby="cart-summary">
      <Card padded className="grid gap-3">
        <h2 id="cart-summary" className="m-0 text-h4">
          {t('title')}
        </h2>
        <dl className="m-0 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2">
          <dt className="text-text-2">
            {t('items', { count: amounts.activeItemCount })}
          </dt>
          <dd className="m-0 text-end">
            {money(amounts.itemsSubtotalPaise, locale)}
          </dd>
          <dt className="text-text-2">{t('delivery')}</dt>
          <dd className="m-0 text-end">{t('atCheckout')}</dd>
          <dt className="text-text-2">{t('taxes')}</dt>
          <dd className="m-0 text-end">{t('included')}</dd>
          <dt className="border-t border-border pt-2 font-bold">
            {t('estimated')}
          </dt>
          <dd className="m-0 border-t border-border pt-2 text-end font-bold">
            {money(amounts.itemsSubtotalPaise, locale)}
          </dd>
        </dl>
        <p className="m-0 text-small text-text-2">{t('note')}</p>
        {issues && (
          <p className="m-0 text-small text-text-2">{t('issuesExcluded')}</p>
        )}
        <CheckoutButton className="hidden w-full desktop:inline-flex" />
      </Card>
    </section>
  );
}

/** Mobile sticky bar above the tab bar: estimate + the same checkout CTA. */
export function CartCheckoutBar({
  cart,
  locale,
}: {
  cart: Cart;
  locale: Locale;
}) {
  const t = useTranslations('cart.summary');
  return (
    <div className="sticky bottom-[calc(var(--spacing-tab-h)+var(--spacing-sab))] z-50 -mx-page-gutter flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border bg-surface px-page-gutter py-2 shadow-2 desktop:hidden">
      <div className="grid min-w-0 flex-1">
        <span className="text-small text-text-2">{t('estimated')}</span>
        <b className="text-price">
          {money(cart.estimatedAmounts.itemsSubtotalPaise, locale)}
        </b>
      </div>
      <CheckoutButton />
    </div>
  );
}
