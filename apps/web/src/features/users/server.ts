import 'server-only';
import { createPrivateServerApi } from '../../shared/api/server';
import { readSession } from '../../shared/auth/server';
import { resource, type Resource } from '../../shared/api/result';
import { getProfile, getPreferences } from './api';
import { hydrateResource } from '../../shared/api/hydration';
import { accountScope, queryKeys } from '../../shared/api/query-keys';

async function readOwn<T>(
  read: (api: Awaited<ReturnType<typeof createPrivateServerApi>>) => Promise<T>,
): Promise<Resource<T>> {
  const session = await readSession();
  if (session.kind !== 'ready') return session;
  const api = await createPrivateServerApi();
  return resource(() => read(api));
}
export const readProfile = () => readOwn(getProfile);
export const readPreferences = () => readOwn(getPreferences);

export async function hydrateOwn<T>(
  kind: 'profile' | 'preferences',
  result: Resource<T>,
) {
  const session = await readSession();
  if (session.kind !== 'ready') return { mutations: [], queries: [] };
  return hydrateResource(
    queryKeys[kind](accountScope(session.data, 0)),
    result,
  );
}
