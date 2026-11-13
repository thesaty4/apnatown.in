import { Suspense } from 'react';
import { Cities } from '../../../features/super-admin/cities/Cities';

export default function SuperAdminCitiesPage() {
  return (
    <Suspense>
      <Cities />
    </Suspense>
  );
}
