import { BusinessAccount } from '../../../features/businesses/BusinessAccount';
import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import { requireOwnerSession } from '../../../features/businesses/server';
import { hydrateOwn, readProfile } from '../../../features/users/server';
import { readSession } from '../../../shared/auth/server';

/** S-PROV-16 owner account: private, own Users profile only. */
export default async function ProviderAccountPage() {
  await requireOwnerSession('/provider/account');
  const [session, profile] = await Promise.all([readSession(), readProfile()]);
  return (
    <BusinessDashboard kind="provider">
      <BusinessAccount
        kind="provider"
        initial={await hydrateOwn('profile', profile)}
        owner={session.kind === 'ready' ? session.data.userId : undefined}
      />
    </BusinessDashboard>
  );
}
