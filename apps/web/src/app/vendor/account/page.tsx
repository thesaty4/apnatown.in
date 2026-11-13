import { BusinessAccount } from '../../../features/businesses/BusinessAccount';
import { BusinessDashboard } from '../../../features/businesses/BusinessDashboard';
import { requireOwnerSession } from '../../../features/businesses/server';
import { hydrateOwn, readProfile } from '../../../features/users/server';
import { readSession } from '../../../shared/auth/server';

/** S-VEND-18 owner account: private, own Users profile only. */
export default async function VendorAccountPage() {
  await requireOwnerSession('/vendor/account');
  const [session, profile] = await Promise.all([readSession(), readProfile()]);
  return (
    <BusinessDashboard kind="shop">
      <BusinessAccount
        kind="shop"
        initial={await hydrateOwn('profile', profile)}
        owner={session.kind === 'ready' ? session.data.userId : undefined}
      />
    </BusinessDashboard>
  );
}
