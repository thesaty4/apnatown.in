import {
  AdminApprovalDetailSchema,
  AdminApprovalPageSchema,
  type AdminApprovalType,
  type AdminBusinessApprovalType,
} from '@apnatown/shared/admin';
import {
  BusinessDecisionResultSchema,
  BusinessDecisionSchema,
  BusinessDocumentListSchema,
  type BusinessDecision,
} from '@apnatown/shared/businesses';
import type { BrowserApi } from '../../../shared/api/browser';
import { unwrap } from '../../../shared/api/result';
import type { ApprovalStatus } from './filters';

type Reader = Pick<BrowserApi, 'GET'>;
const PAGE_SIZE = 20;
const HISTORY_PAGE_SIZE = 20;
const withSignal = (signal?: AbortSignal) => (signal ? { signal } : {});

/** Drops `undefined` members so optional query params satisfy
 * `exactOptionalPropertyTypes` in the generated client. */
function defined<T extends object>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as {
    [K in keyof T]: Exclude<T[K], undefined>;
  };
}

/** Scoped queue, oldest first; `cursor` is the opaque keyset from the API. */
export async function listApprovals(
  api: Reader,
  type: AdminApprovalType,
  status: ApprovalStatus,
  cursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/admin/approvals', {
      params: {
        query: defined({ type, status, limit: PAGE_SIZE, cursor }),
      },
      ...withSignal(signal),
    }),
    AdminApprovalPageSchema,
  );
}

/** Application review fields, version, allowedActions and one history page. */
export async function getApprovalDetail(
  api: Reader,
  type: AdminBusinessApprovalType,
  id: string,
  historyCursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/admin/approvals/{type}/{id}', {
      params: {
        path: { type, id },
        query: defined({ limit: HISTORY_PAGE_SIZE, cursor: historyCursor }),
      },
      ...withSignal(signal),
    }),
    AdminApprovalDetailSchema,
  );
}

/** Private document metadata; the view capability is reauthorized per request
 * and currently always `unavailable` (no private storage yet). */
export async function getApprovalDocuments(
  api: Reader,
  id: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/businesses/admin/applications/{id}/documents', {
      params: { path: { id } },
      ...withSignal(signal),
    }),
    BusinessDocumentListSchema,
  );
}

/** ST-approval command to the owning Businesses module. */
export async function decideApproval(
  api: BrowserApi,
  id: string,
  decision: BusinessDecision,
  { key, assertCurrent }: { key: string; assertCurrent: () => void },
) {
  const parsed = BusinessDecisionSchema.parse(decision);
  const body = {
    action: parsed.action,
    expectedVersion: parsed.expectedVersion,
    ...(parsed.reason === undefined ? {} : { reason: parsed.reason }),
  };
  const headers = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.POST('/businesses/admin/applications/{id}/decision', {
      params: {
        path: { id },
        header: { ...headers, 'Idempotency-Key': key },
      },
      body,
    }),
    BusinessDecisionResultSchema,
  );
}
