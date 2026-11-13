import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CheckoutScreen } from '../../features/checkout';

// Customer-private page: never cached or indexed (S-CUST-11).
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('checkout.page');
  return { title: t('title'), robots: { index: false, follow: false } };
}

/** SSR shell; cart, addresses and quotes are private client-island reads
 * (the quote is a POST that must follow the customer's latest choices). */
export default function CheckoutPage() {
  return <CheckoutScreen />;
}
