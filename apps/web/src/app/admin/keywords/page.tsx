import { Suspense } from 'react';
import { AdminKeywords } from '../../../features/catalog/admin';

/** S-ADMN-15 Search keyword mappings; client reads via React Query. */
export default function Page() {
  return (
    <Suspense>
      <AdminKeywords />
    </Suspense>
  );
}
