import { RiderShell } from '../../../features/rider/RiderShell';
import { RiderFeedbackScreen } from '../../../features/rider/RiderProfile';
import { requireRiderSession } from '../../../features/rider/server';

export default async function RiderFeedbackPage() {
  await requireRiderSession('/rider/feedback');
  return (
    <RiderShell>
      <RiderFeedbackScreen />
    </RiderShell>
  );
}
