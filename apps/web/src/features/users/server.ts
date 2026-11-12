import 'server-only';
import { createPrivateServerApi } from '../../shared/api/server';
import { readSession } from '../../shared/auth/server';
import { resource, type Resource } from '../../shared/api/result';
import { getProfile, getPreferences } from './api';
import { listAddresses } from './address-api';
import { getConsents } from './consent-api';
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
export const readConsents = () => readOwn(getConsents);
/** First page in the client's infinite-query shape; later pages load on demand. */
export const readAddresses = () =>
  readOwn(async (api) => ({
    pages: [await listAddresses(api)],
    pageParams: [null],
  }));

export async function hydrateOwn<T>(
  kind: 'profile' | 'preferences' | 'addresses' | 'consents',
  result: Resource<T>,
) {
  const session = await readSession();
  if (session.kind !== 'ready') return { mutations: [], queries: [] };
  return hydrateResource(
    queryKeys[kind](accountScope(session.data, 0)),
    result,
  );
}
