import 'server-only';
import { cache } from 'react';
import { createPrivateServerApi } from '../../shared/api/server';
import { readSession } from '../../shared/auth/server';
import { resource, type Resource } from '../../shared/api/result';
import { hydrateResource } from '../../shared/api/hydration';
import { accountScope, queryKeys } from '../../shared/api/query-keys';
import type { AdminMe } from '@apnatown/shared/admin';
import { getAdminMe } from './api';

export type AdminSection = 'admin' | 'super';
const roleFor = { admin: ['admin', 'super_admin'], super: ['super_admin'] };

/** Server role gate: a session without the section's role never calls the
 * admin API; the API stays authoritative for everything else. */
export async function hasSectionRole(section: AdminSection) {
  const session = await readSession();
  return (
    session.kind !== 'ready' ||
    session.data.roles.some((role) => roleFor[section].includes(role))
  );
}

/** Request-local, no-store current admin authority. */
export const readAdminMe = cache(async (): Promise<Resource<AdminMe>> => {
  const session = await readSession();
  if (session.kind !== 'ready') return session;
  if (!(await hasSectionRole('admin')))
    return { kind: 'error', code: 'COMMON_FORBIDDEN' };
  const api = await createPrivateServerApi();
  return resource(() => getAdminMe(api));
});

export async function hydrateAdminMe() {
  const session = await readSession();
  if (session.kind !== 'ready') return { mutations: [], queries: [] };
  return hydrateResource(
    queryKeys.adminMe(accountScope(session.data, 0)),
    await readAdminMe(),
  );
}
