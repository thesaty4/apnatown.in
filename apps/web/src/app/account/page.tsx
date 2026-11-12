import { Account } from '../../features/users/Account';
import { readProfile, hydrateOwn } from '../../features/users/server';
import { readSession } from '../../shared/auth/server';
import { getWebEnvironment } from '../../shared/config/server';

export default async function AccountPage() {
  const session = await readSession();
  return (
    <Account
      initial={await hydrateOwn('profile', await readProfile())}
      owner={session.kind === 'ready' ? session.data.userId : undefined}
      demo={getWebEnvironment().DEMO_LOGIN_ENABLED}
    />
  );
}
