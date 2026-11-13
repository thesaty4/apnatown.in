'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cartUsed } from './merge';
import { useCart } from './queries';

/** Active item count from the shared cart query (`activeItemCount`). Guests
 * read only once this browser has used a cart, so browsing alone never
 * creates an anonymous session or guest-cart cookie; a disabled query still
 * shows the cart the add-to-cart flow wrote into the cache. */
export function useCartCount() {
  const [used] = useState(cartUsed);
  const { query } = useCart(used);
  return query.data?.estimatedAmounts.activeItemCount ?? 0;
}

/** Prototype `.dot` count over the cart icon, plus the link's accessible
 * count. Rendered into the shell's cart slots (header icon, mobile tab). */
export function CartCount({ tab = false }: { tab?: boolean }) {
  const t = useTranslations('cart.nav');
  const count = useCartCount();
  return (
    <>
      <span className="sr-only">
        {tab ? ` ${t('items', { count })}` : t('count', { count })}
      </span>
      {count > 0 && (
        <span
          aria-hidden="true"
          className={`absolute grid h-4.5 min-w-4.5 place-items-center rounded-pill bg-primary px-1 text-caption font-bold leading-none text-on-primary ${tab ? 'start-[calc(50%+4px)] top-1' : 'end-1 top-1.25'}`}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </>
  );
}
