import { RiderShell } from '../../../features/rider/RiderShell';
import { RiderHistoryScreen } from '../../../features/rider/RiderReports';
import { requireRiderSession } from '../../../features/rider/server';

export default async function RiderHistoryPage() {
  await requireRiderSession('/rider/history');
  return (
    <RiderShell>
      <RiderHistoryScreen />
    </RiderShell>
  );
}
