import 'server-only';
import type { AdminBusinessApprovalType } from '@apnatown/shared/admin';
import { readSession } from '../../../shared/auth/server';
import { createPrivateServerApi } from '../../../shared/api/server';
import { hydrateResource } from '../../../shared/api/hydration';
import { resource } from '../../../shared/api/result';
import { accountScope, queryKeys } from '../../../shared/api/query-keys';
import { hasSectionRole, readAdminMe } from '../server';
import { getApprovalDetail, listApprovals } from './api';
import type { ApprovalFilters } from './filters';

const none = { mutations: [], queries: [] };

/** Current authority for the approvals screens (`/admin/me`, shared with the
 * layout read). Nothing is read unless it grants approvals:view; the API
 * re-checks permission and area scope on every request anyway. */
async function approvalsReader() {
  const session = await readSession();
  if (session.kind !== 'ready') return { owner: undefined };
  const owner = session.data.userId;
  if (!(await hasSectionRole('admin'))) return { owner };
  const me = await readAdminMe();
  if (me.kind !== 'ready') return { owner };
  if (!me.data.isSuper && !me.data.permissions.approvals.includes('view'))
    return { owner };
  return {
    owner,
    scope: accountScope(session.data, 0),
    scopeRevision: me.data.scopeRevision,
    api: await createPrivateServerApi(),
  };
}

/** Request-local, no-store first queue page under the client's exact key. */
export async function hydrateApprovalQueue(filters: ApprovalFilters) {
  const reader = await approvalsReader();
  if (!reader.api) return { initial: none, owner: reader.owner };
  const { api } = reader;
  const page = await resource(async () => ({
    pages: [await listApprovals(api, filters.type, filters.status)],
    pageParams: [null],
  }));
  return {
    owner: reader.owner,
    initial: await hydrateResource(
      queryKeys.adminApprovalQueue(
        reader.scope,
        reader.scopeRevision,
        filters.type,
        filters.status,
      ),
      page,
    ),
  };
}

/** Request-local, no-store detail (application + newest history page). */
export async function hydrateApprovalDetail(
  type: AdminBusinessApprovalType,
  id: string,
) {
  const reader = await approvalsReader();
  if (!reader.api) return { initial: none, owner: reader.owner };
  const { api } = reader;
  const page = await resource(async () => {
    const detail = await getApprovalDetail(api, type, id);
    return {
      pages: [{ detail, nextCursor: detail.history.nextCursor }],
      pageParams: [null],
    };
  });
  return {
    owner: reader.owner,
    initial: await hydrateResource(
      queryKeys.adminApprovalDetail(
        reader.scope,
        reader.scopeRevision,
        type,
        id,
      ),
      page,
    ),
  };
}
