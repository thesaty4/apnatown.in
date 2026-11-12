import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { IdSchema } from '@apnatown/shared/wire';
import { CityDetail } from '../../../../features/super-admin/cities/CityDetail';

export default async function SuperAdminCityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!IdSchema.safeParse(id).success) notFound();
  return (
    <Suspense>
      <CityDetail key={id} cityId={id} />
    </Suspense>
  );
}
