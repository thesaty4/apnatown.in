'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Cart, CartGroup as Group } from '@apnatown/shared/cart';
import { Card } from '@apnatown/ui/cards/Card';
import { publicHref } from '../../shared/i18n/preferences';
import { NavIcon } from '../../shared/ui/NavIcon';
import type { CartCommand } from './api';
import { CartLineItem } from './CartLineItem';
import { isAvailable, money, shopArea, shopName, type Locale } from './format';

function Notice({
  tone,
  children,
}: {
  tone: 'warn' | 'bad' | 'info';
  children: string;
}) {
  const tones = {
    warn: 'border-warning bg-warning-soft',
    bad: 'border-error bg-error-soft',
    info: 'border-info bg-info-soft',
  } as const;
  return (
    <p
      className={`m-0 flex items-start gap-2 rounded-md border px-3 py-2 text-small text-text ${tones[tone]}`}
    >
      <NavIcon
        name={tone === 'info' ? 'info' : 'alert'}
        className="mt-0.5 size-4"
      />
      <span className="min-w-0 [overflow-wrap:anywhere]">{children}</span>
    </p>
  );
}

/** One shop's active lines (prototype cart card): shop header → lines →
 * shop subtotal and delivery-minimum estimate. */
export function CartGroup({
  group,
  cart,
  locale,
  disabled,
  onCommand,
}: {
  group: Group;
  cart: Cart;
  locale: Locale;
  disabled: boolean;
  onCommand: (command: CartCommand) => void;
}) {
  const t = useTranslations('cart.shop');
  const shop = group.shop;
  // Product-less lines are never in a group; the guard also narrows the type.
  const lines = group.lineIds.flatMap((id) =>
    cart.lines.filter((line) => line.id === id).filter(isAvailable),
  );
  const area = shop && shopArea(shop, locale);
  const headingId = `cart-shop-${group.businessId}`;
  return (
    <section aria-labelledby={headingId}>
      <Card padded className="grid gap-3">
        <h2 id={headingId} className="m-0 text-h4">
          {shop ? (
            <Link
              href={publicHref(
                `/${shop.kind === 'provider' ? 'provider' : 'shop'}/${shop.slug}`,
                locale,
              )}
              className="flex items-center gap-2 rounded-sm focus-visible:ring-focus"
            >
              <NavIcon name="store" className="size-5 text-primary" />
              <span className="grid min-w-0 flex-1">
                <span className="[overflow-wrap:anywhere]">
                  {shopName(shop, locale)}
                </span>
                {area && (
                  <span className="text-small font-normal text-text-2">
                    {area}
                  </span>
                )}
              </span>
              <NavIcon name="cr" className="size-4 text-muted" />
            </Link>
          ) : (
            <span className="flex items-center gap-2">
              <NavIcon name="store" className="size-5 text-muted" />
              {t('unknown')}
            </span>
          )}
        </h2>
        {!shop && <Notice tone="bad">{t('unavailable')}</Notice>}
        {shop?.temporarilyClosed && <Notice tone="warn">{t('closed')}</Notice>}
        {shop && !shop.deliveryAvailable && (
          <Notice tone="info">
            {shop.pickupEnabled ? t('pickupOnly') : t('noFulfilment')}
          </Notice>
        )}
        <ul className="m-0 grid list-none p-0">
          {lines.map((line) => (
            <CartLineItem
              key={line.id}
              line={line}
              cartVersion={cart.version}
              locale={locale}
              disabled={disabled}
              onCommand={onCommand}
            />
          ))}
        </ul>
        <div className="flex items-baseline justify-between gap-3 border-t border-border pt-3">
          <span className="text-text-2">{t('subtotal')}</span>
          <b>{money(group.itemsSubtotalPaise, locale)}</b>
        </div>
        {shop?.deliveryAvailable &&
          group.minimumOrderPaise !== null &&
          group.minimumOrderShortfallPaise > 0 && (
            <Notice tone="warn">
              {t(shop.pickupEnabled ? 'minimum' : 'minimumNoPickup', {
                minimum: money(group.minimumOrderPaise, locale),
                shortfall: money(group.minimumOrderShortfallPaise, locale),
              })}
            </Notice>
          )}
      </Card>
    </section>
  );
}
