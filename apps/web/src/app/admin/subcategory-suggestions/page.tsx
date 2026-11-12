import { Suspense } from 'react';
import { AdminSuggestions } from '../../../features/catalog/admin';

/** S-ADMN-06 Subcategory suggestion queue (status in the URL); client reads via React Query. */
export default function Page() {
  return (
    <Suspense>
      <AdminSuggestions />
    </Suspense>
  );
}
