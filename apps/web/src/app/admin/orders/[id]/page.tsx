import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { IdSchema } from '@apnatown/shared/wire';
import { AdminOrderDetailScreen } from '../../../../features/admin/orders/AdminOrderDetail';

/** S-ADMN-08: UUID ids only; scope and `orders:view` are decided by the API. */
export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const parsed = IdSchema.safeParse((await params).id);
  if (!parsed.success) notFound();
  return (
    <Suspense>
      <AdminOrderDetailScreen id={parsed.data.toLowerCase()} />
    </Suspense>
  );
}
