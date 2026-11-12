import { Preferences } from '../../../features/users/Preferences';
import {
  readConsents,
  readPreferences,
  hydrateOwn,
} from '../../../features/users/server';
import { readSession } from '../../../shared/auth/server';

export default async function PreferencesPage() {
  const session = await readSession();
  const [preferences, consents] = await Promise.all([
    readPreferences().then((result) => hydrateOwn('preferences', result)),
    readConsents().then((result) => hydrateOwn('consents', result)),
  ]);
  return (
    <Preferences
      initial={{
        mutations: [],
        queries: [...preferences.queries, ...consents.queries],
      }}
      owner={session.kind === 'ready' ? session.data.userId : undefined}
    />
  );
}
