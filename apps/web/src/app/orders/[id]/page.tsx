import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { IdSchema } from '@apnatown/shared/wire';
import { OrderDetailScreen } from '../../../features/orders';

// Owner-scoped order detail: never cached or indexed (S-CUST-14). The live
// handover code is read only by the client island, never rendered here.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('orders.detail');
  return { title: t('pageTitle'), robots: { index: false, follow: false } };
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = IdSchema.safeParse((await params).id);
  return <OrderDetailScreen orderId={id.success ? id.data : null} />;
}
