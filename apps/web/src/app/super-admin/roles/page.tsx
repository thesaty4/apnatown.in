import { Suspense } from 'react';
import { Roles } from '../../../features/super-admin/roles/Roles';

export default function SuperAdminRolesPage() {
  return (
    <Suspense>
      <Roles />
    </Suspense>
  );
}
