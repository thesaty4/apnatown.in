import 'server-only';
import { readSession } from '../../../shared/auth/server';
import { createPrivateServerApi } from '../../../shared/api/server';
import { hydrateResource } from '../../../shared/api/hydration';
import { resource } from '../../../shared/api/result';
import { accountScope, queryKeys } from '../../../shared/api/query-keys';
import { hasSectionRole, readAdminMe } from '../server';
import { listAudit } from './api';
import type { AuditFilters, AuditSection } from './filters';

const none = { mutations: [], queries: [] };

/** Request-local, no-store first page under the client's exact key. Nothing is
 * read unless the current authority (`/admin/me`, shared with the layout read)
 * may see this section; the API re-checks scope on every request anyway. */
export async function hydrateAuditFirstPage(
  section: AuditSection,
  filters: AuditFilters,
) {
  const session = await readSession();
  if (session.kind !== 'ready') return { initial: none, owner: undefined };
  const owner = session.data.userId;
  if (!(await hasSectionRole(section === 'activity' ? 'super' : 'admin')))
    return { initial: none, owner };
  const me = await readAdminMe();
  if (me.kind !== 'ready') return { initial: none, owner };
  const allowed =
    me.data.isSuper ||
    (section === 'audit' && me.data.permissions.reports.includes('view'));
  if (!allowed) return { initial: none, owner };
  const api = await createPrivateServerApi();
  const page = await resource(async () => ({
    pages: [await listAudit(api, section, filters)],
    pageParams: [null],
  }));
  return {
    owner,
    initial: await hydrateResource(
      queryKeys.auditList(
        accountScope(session.data, 0),
        section,
        me.data.scopeRevision,
        filters,
      ),
      page,
    ),
  };
}
