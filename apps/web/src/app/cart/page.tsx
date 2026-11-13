import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CartScreen } from '../../features/cart';

// Guest-or-customer private page: never cached or indexed (S-CUST-10).
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('cart.page');
  return {
    title: t('title'),
    robots: { index: false, follow: false },
  };
}

/** SSR shell; the cart is read client-side because a guest's first GET /cart
 * issues the HttpOnly guest-cart cookie in the browser. */
export default function CartPage() {
  return <CartScreen />;
}
