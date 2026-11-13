import type { BrowserApi } from '../../shared/api/browser';
import { privateQueryOptions } from '../../shared/api/private-query';
import { queryKeys, type AccountScope } from '../../shared/api/query-keys';
import type { PrivateLifecycle } from '../../shared/api/private-lifecycle';
import { getAdminMe } from './api';

/** Current authority: re-read on focus and after any denial, never trusted
 * from a session-long flag. */
export function adminMeOptions(
  api: BrowserApi,
  scope: AccountScope,
  lifecycle: PrivateLifecycle,
) {
  return privateQueryOptions(
    queryKeys.adminMe(scope),
    scope.epoch,
    lifecycle,
    (signal) => getAdminMe(api, signal),
  );
}
