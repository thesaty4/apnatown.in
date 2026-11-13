import { RiderShell } from '../../../features/rider/RiderShell';
import { RiderHome } from '../../../features/rider/RiderHome';
import { requireRiderSession } from '../../../features/rider/server';

export default async function RiderHomePage() {
  await requireRiderSession('/rider/home');
  return (
    <RiderShell>
      <RiderHome />
    </RiderShell>
  );
}
