import { Suspense } from 'react';
import { ListingsScreen } from '../../../features/admin/listings/ListingsScreen';

/** S-ADMN-03: private client reads under the admin layout (noindex,
 * dynamic); filters and `?reportId=` live in the URL. */
export default function AdminListingsPage() {
  return (
    <Suspense>
      <ListingsScreen />
    </Suspense>
  );
}
