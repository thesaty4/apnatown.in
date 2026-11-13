import { ProfileSchema } from '@apnatown/shared/users';
import type { components } from '@apnatown/api-client';
import type { BrowserApi } from '../../shared/api/browser';
import { unwrap } from '../../shared/api/result';
import { privateQueryOptions } from '../../shared/api/private-query';
import { queryKeys, type AccountScope } from '../../shared/api/query-keys';
import type { PrivateLifecycle } from '../../shared/api/private-lifecycle';

export { getPreferences } from '../../shared/i18n/preferences-api';

type Reader = Pick<BrowserApi, 'GET'>;
export async function getProfile(api: Reader, signal?: AbortSignal) {
  return unwrap(
    await api.GET('/users/me', { ...(signal && { signal }) }),
    ProfileSchema,
  );
}
export function profileOptions(
  api: BrowserApi,
  scope: AccountScope,
  lifecycle: PrivateLifecycle,
) {
  return privateQueryOptions(
    queryKeys.profile(scope),
    scope.epoch,
    lifecycle,
    (signal) => getProfile(api, signal),
  );
}
export async function saveProfile(
  api: BrowserApi,
  body: components['schemas']['UpdateProfileDto'],
  assertCurrent: () => void,
) {
  const header = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.PATCH('/users/me', { params: { header }, body }),
    ProfileSchema,
  );
}
