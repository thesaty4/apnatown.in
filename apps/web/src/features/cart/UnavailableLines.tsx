'use client';

import { useTranslations } from 'next-intl';
import type { Cart } from '@apnatown/shared/cart';
import { Card } from '@apnatown/ui/cards/Card';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';
import { buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { NavIcon } from '../../shared/ui/NavIcon';
import type { CartCommand } from './api';
import { isAvailable } from './format';

/**
 * Lines whose product no longer exists (`product: null`). They belong to no
 * shop group and carry no price, so the only action is Remove.
 */
export function UnavailableLines({
  cart,
  disabled,
  onCommand,
}: {
  cart: Cart;
  disabled: boolean;
  onCommand: (command: CartCommand) => void;
}) {
  const t = useTranslations('cart');
  const lines = cart.lines.filter((line) => !isAvailable(line));
  if (lines.length === 0) return null;
  return (
    <section aria-labelledby="cart-unavailable">
      <Card padded className="grid gap-2">
        <h2 id="cart-unavailable" className="m-0 text-h4">
          {t('unavailable.title')}
        </h2>
        <ul className="m-0 grid list-none p-0">
          {lines.map((line, index) => (
            <li
              key={line.id}
              className="flex flex-wrap items-center gap-3 border-t border-border py-3 first:border-t-0"
            >
              <span
                aria-hidden="true"
                className="grid size-16 shrink-0 place-items-center rounded-md bg-surface-2 text-muted"
              >
                <NavIcon name="box" />
              </span>
              <div className="grid min-w-0 flex-1 basis-40 justify-items-start gap-1">
                <StatusBadge
                  tone="bad"
                  icon={<NavIcon name="alert" className="size-3.5" />}
                  label={t('unavailable.label')}
                />
                <span className="text-small text-text-2">
                  {t('unavailable.quantity', { count: line.quantity })}
                </span>
              </div>
              <button
                type="button"
                className={buttonVariantClassName('outline', 'small')}
                disabled={disabled}
                onClick={() =>
                  onCommand({
                    op: 'remove',
                    lineId: line.id,
                    body: {
                      expectedVersion: line.version,
                      expectedCartVersion: cart.version,
                    },
                  })
                }
              >
                <NavIcon name="trash" className="size-4" />
                {t('line.remove')}{' '}
                <span className="sr-only">
                  {t('unavailable.itemNumber', { number: index + 1 })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
