import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CustomerOrderGroupSchema } from '@apnatown/shared/orders';
import { OrdersScreen } from '../../features/orders';

// Customer-private page: never cached or indexed (S-CUST-13).
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('orders.list');
  return { title: t('title'), robots: { index: false, follow: false } };
}

/** The validated `?group=` is the tab; an unknown value falls back to Active. */
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const group = CustomerOrderGroupSchema.catch('active').parse(
    (await searchParams).group,
  );
  return <OrdersScreen group={group} />;
}
