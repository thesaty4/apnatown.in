import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { IdSchema } from '@apnatown/shared/wire';
import { BusinessDashboard } from '../../../../features/businesses/BusinessDashboard';
import { requireOwnerSession } from '../../../../features/businesses/server';
import { EnquiryDetailScreen } from '../../../../features/services';

/** S-PROV-03 detail: UUID ids only; ownership is decided by the API. */
export default async function ProviderEnquiryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const parsed = IdSchema.safeParse((await params).id);
  if (!parsed.success) notFound();
  const id = parsed.data.toLowerCase();
  await requireOwnerSession(`/provider/enquiries/${id}`);
  return (
    <BusinessDashboard kind="provider">
      <Suspense>
        <EnquiryDetailScreen kind="provider" id={id} />
      </Suspense>
    </BusinessDashboard>
  );
}
