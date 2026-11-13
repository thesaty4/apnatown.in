'use client';

import { useTranslations } from 'next-intl';
import type { Cart } from '@apnatown/shared/cart';
import { Card } from '@apnatown/ui/cards/Card';
import { buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { NavIcon } from '../../shared/ui/NavIcon';
import type { CartCommand } from './api';
import { LineIssues, LineName, LineThumb } from './CartLineItem';
import { isAvailable, money, productName, type Locale } from './format';

/** Prototype "Saved for later" card: name, price, Move to cart, remove. */
export function SavedLines({
  cart,
  locale,
  disabled,
  onCommand,
}: {
  cart: Cart;
  locale: Locale;
  disabled: boolean;
  onCommand: (command: CartCommand) => void;
}) {
  const t = useTranslations('cart');
  const saved = cart.lines
    .filter(isAvailable)
    .filter((line) => line.savedForLater);
  if (saved.length === 0) return null;
  return (
    <section aria-labelledby="cart-saved">
      <Card padded className="grid gap-2">
        <h2 id="cart-saved" className="m-0 text-h4">
          {t('saved.title')}
        </h2>
        <ul className="m-0 grid list-none p-0">
          {saved.map((line) => {
            const name = productName(line, locale);
            const versions = {
              expectedVersion: line.version,
              expectedCartVersion: cart.version,
            };
            return (
              <li
                key={line.id}
                className="flex flex-wrap items-center gap-3 border-t border-border py-3 first:border-t-0"
              >
                <LineThumb line={line} locale={locale} />
                <div className="grid min-w-0 flex-1 basis-40 gap-1">
                  <LineName line={line} locale={locale} />
                  <span className="text-small text-text-2">
                    {line.product.unitPricePaise === null
                      ? t('line.priceUnavailable')
                      : money(line.product.unitPricePaise, locale)}
                  </span>
                  <LineIssues line={line} />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className={buttonVariantClassName('outline', 'small')}
                    disabled={disabled}
                    onClick={() =>
                      onCommand({
                        op: 'restore',
                        lineId: line.id,
                        body: versions,
                      })
                    }
                  >
                    {t('line.moveToCart')}
                    <span className="sr-only">, {name}</span>
                  </button>
                  <button
                    type="button"
                    className="grid size-11 place-items-center rounded-pill text-text-2 hover:bg-surface-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={disabled}
                    aria-label={`${t('line.remove')}, ${name}`}
                    title={t('line.remove')}
                    onClick={() =>
                      onCommand({
                        op: 'remove',
                        lineId: line.id,
                        body: versions,
                      })
                    }
                  >
                    <NavIcon name="trash" className="size-4.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </section>
  );
}
