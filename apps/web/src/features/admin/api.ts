import { AdminMeSchema } from '@apnatown/shared/admin';
import type { BrowserApi } from '../../shared/api/browser';
import { unwrap } from '../../shared/api/result';

export async function getAdminMe(
  api: Pick<BrowserApi, 'GET'>,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/admin/me', signal ? { signal } : {}),
    AdminMeSchema,
  );
}
