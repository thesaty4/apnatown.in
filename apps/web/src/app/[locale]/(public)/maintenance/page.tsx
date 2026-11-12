import { Suspense } from 'react';
import { MaintenanceScreen } from '../../../../features/support/MaintenanceScreen';
import { noindex } from '../../../../features/support/metadata';

export const metadata = noindex;

export default function MaintenancePage() {
  return (
    <Suspense>
      <MaintenanceScreen />
    </Suspense>
  );
}
