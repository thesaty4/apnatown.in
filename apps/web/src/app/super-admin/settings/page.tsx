import { Suspense } from 'react';
import { Settings } from '../../../features/super-admin/settings/Settings';

export default function SuperAdminSettingsPage() {
  return (
    <Suspense>
      <Settings />
    </Suspense>
  );
}
