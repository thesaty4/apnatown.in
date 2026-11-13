import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { IdSchema } from '@apnatown/shared/wire';
import { BusinessDashboard } from '../../../../features/businesses/BusinessDashboard';
import { requireOwnerSession } from '../../../../features/businesses/server';
import { OwnerOrderDetailScreen } from '../../../../features/owner-orders';

/** S-VEND-04 detail: UUID ids only; ownership is decided by the API. */
export default async function VendorOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const parsed = IdSchema.safeParse((await params).id);
  if (!parsed.success) notFound();
  const id = parsed.data.toLowerCase();
  await requireOwnerSession(`/vendor/orders/${id}`);
  return (
    <BusinessDashboard kind="shop">
      <Suspense>
        <OwnerOrderDetailScreen kind="shop" id={id} />
      </Suspense>
    </BusinessDashboard>
  );
}
