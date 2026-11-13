import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { IdSchema } from '@apnatown/shared/wire';
import { BusinessDashboard } from '../../../../features/businesses/BusinessDashboard';
import {
  publicOrigin,
  requireOwnerSession,
} from '../../../../features/businesses/server';
import { ProductEditor } from '../../../../features/products/owner';

/** S-PROV-07 add/edit product: `new` or a UUID; ownership is decided by the API. */
export default async function ProviderProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const raw = (await params).id;
  const parsed = raw === 'new' ? null : IdSchema.safeParse(raw);
  if (parsed && !parsed.success) notFound();
  const id = parsed?.success ? parsed.data.toLowerCase() : 'new';
  await requireOwnerSession(`/provider/products/${id}`);
  return (
    <BusinessDashboard kind="provider">
      <Suspense>
        <ProductEditor kind="provider" id={id} baseUrl={publicOrigin()} />
      </Suspense>
    </BusinessDashboard>
  );
}
