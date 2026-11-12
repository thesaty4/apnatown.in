import { Preferences } from '../../../features/users/Preferences';
import { readPreferences, hydrateOwn } from '../../../features/users/server';
import { readSession } from '../../../shared/auth/server';

export default async function PreferencesPage() {
  const session = await readSession();
  return (
    <Preferences
      initial={await hydrateOwn('preferences', await readPreferences())}
      owner={session.kind === 'ready' ? session.data.userId : undefined}
    />
  );
}
