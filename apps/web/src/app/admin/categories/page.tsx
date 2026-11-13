import { Suspense } from 'react';
import { AdminCategories } from '../../../features/catalog/admin';

/** S-ADMN-05 Categories taxonomy and Home sections; client reads via React Query. */
export default function Page() {
  return (
    <Suspense>
      <AdminCategories />
    </Suspense>
  );
}
