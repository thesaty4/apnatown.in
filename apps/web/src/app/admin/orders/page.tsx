import { Suspense } from 'react';
import { AdminOrdersScreen } from '../../../features/admin/orders/AdminOrdersScreen';

/** S-ADMN-07: private client reads under the admin layout (noindex,
 * dynamic, role-gated); `?filter=` lives in the URL. */
export default function AdminOrdersPage() {
  return (
    <Suspense>
      <AdminOrdersScreen />
    </Suspense>
  );
}
