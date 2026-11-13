import { RiderShell } from '../../../features/rider/RiderShell';
import { RiderEarningsScreen } from '../../../features/rider/RiderReports';
import { requireRiderSession } from '../../../features/rider/server';

export default async function RiderEarningsPage() {
  await requireRiderSession('/rider/earnings');
  return (
    <RiderShell>
      <RiderEarningsScreen />
    </RiderShell>
  );
}
