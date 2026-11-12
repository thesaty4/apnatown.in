import type { components } from '@apnatown/api-client';
import { PreferencesSchema } from '@apnatown/shared/users';
import type { BrowserApi } from '../api/browser';
import { unwrap } from '../api/result';
import { privateQueryOptions } from '../api/private-query';
import { queryKeys, type AccountScope } from '../api/query-keys';
import type { PrivateLifecycle } from '../api/private-lifecycle';

export async function getPreferences(
  api: Pick<BrowserApi, 'GET'>,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/users/me/preferences', { ...(signal && { signal }) }),
    PreferencesSchema,
  );
}

export function preferencesOptions(
  api: BrowserApi,
  scope: AccountScope,
  lifecycle: PrivateLifecycle,
) {
  return privateQueryOptions(
    queryKeys.preferences(scope),
    scope.epoch,
    lifecycle,
    (signal) => getPreferences(api, signal),
  );
}

export async function savePreferences(
  api: BrowserApi,
  body: components['schemas']['UpdatePreferencesDto'],
  assertCurrent: () => void,
) {
  const header = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.PATCH('/users/me/preferences', {
      params: { header },
      body,
    }),
    PreferencesSchema,
  );
}
