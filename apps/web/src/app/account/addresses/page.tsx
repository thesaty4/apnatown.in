import { Addresses } from '../../../features/users/Addresses';
import { readAddresses, hydrateOwn } from '../../../features/users/server';
import { readSession } from '../../../shared/auth/server';

export default async function AddressesPage() {
  const session = await readSession();
  return (
    <Addresses
      initial={await hydrateOwn('addresses', await readAddresses())}
      owner={session.kind === 'ready' ? session.data.userId : undefined}
    />
  );
}
