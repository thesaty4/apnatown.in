'use client';

import { queryOptions } from '@tanstack/react-query';
import {
  privateInfiniteQueryOptions,
  privateQueryOptions,
} from '../../../shared/api/private-query';
import { queryKeys } from '../../../shared/api/query-keys';
import { usePrivateMutation } from '../../../shared/api/use-private-mutation';
import type { AdminContext } from '../AdminShell';
import { exportActivity, getAuditEntry, listAudit, saveFile } from './api';
import type { AuditFilters, AuditSection } from './filters';

type Ctx = Pick<AdminContext, 'api' | 'scope' | 'lifecycle' | 'me'>;

/** The SSR-hydrated first page counts as the initial read for this short
 * hand-off only, so hydration and the first client render never refetch it.
 * After that any mount, focus, reconnect or filter change re-reads (no-store). */
export const AUDIT_SSR_HANDOFF_MS = 5_000;

/** Keyset pages for the current validated URL filters. A filter or scope
 * change is a new key, so old pages are never mixed with new results. */
export function auditListOptions(
  { api, scope, lifecycle, me }: Ctx,
  section: AuditSection,
  filters: AuditFilters,
) {
  return {
    ...privateInfiniteQueryOptions(
      queryKeys.auditList(scope, section, me.scopeRevision, filters),
      scope.epoch,
      lifecycle,
      (cursor, signal) => listAudit(api, section, filters, cursor, signal),
    ),
    staleTime: AUDIT_SSR_HANDOFF_MS,
  };
}

/** Diffs are read on expansion only, always fresh, and dropped when collapsed. */
export function auditEntryOptions(
  { api, scope, lifecycle, me }: Ctx,
  section: AuditSection,
  id: string,
) {
  return queryOptions({
    ...privateQueryOptions(
      queryKeys.auditEntry(scope, section, me.scopeRevision, id),
      scope.epoch,
      lifecycle,
      (signal) => getAuditEntry(api, section, id, signal),
    ),
    staleTime: 0,
    gcTime: 0,
  });
}

/** Export is a user-triggered read with pending/error UX; it returns nothing so
 * no CSV content reaches the mutation cache. Never retried automatically
 * (10/hour server limit). */
export function useActivityExport({ api, lifecycle }: Ctx) {
  return usePrivateMutation(
    lifecycle,
    async (filters: AuditFilters, assertCurrent) => {
      const file = await exportActivity(api, filters);
      assertCurrent();
      saveFile(file);
    },
  );
}
