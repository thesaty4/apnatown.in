import { Suspense } from 'react';
import { Admins } from '../../../features/super-admin/admins/Admins';

export default function SuperAdminAdminsPage() {
  // Filters live in the URL; the list itself is a client island.
  return (
    <Suspense>
      <Admins />
    </Suspense>
  );
}
