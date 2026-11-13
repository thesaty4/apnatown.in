import {
  AdminMediaReportPageSchema,
  MediaReportDecisionResultSchema,
  MediaReportDecisionSchema,
  type AdminMediaReportsQuery,
  type MediaReportDecision,
} from '@apnatown/shared';
import type { BrowserApi } from '../../../shared/api/browser';
import { unwrap } from '../../../shared/api/result';

type Reader = Pick<BrowserApi, 'GET'>;
type Command = {
  key: string;
  assertCurrent: () => void;
};
export type MediaReportKind = AdminMediaReportsQuery['targetKind'];

const withSignal = (signal?: AbortSignal) => (signal ? { signal } : {});
const PAGE_SIZE = 50;

/** S-ADMN-11 combined video + photo report queue, newest first. */
export async function listMediaReports(
  api: Reader,
  targetKind: MediaReportKind,
  cursor?: string,
  signal?: AbortSignal,
  limit = PAGE_SIZE,
) {
  return unwrap(
    await api.GET('/admin/media-reports', {
      params: {
        query: {
          targetKind,
          limit,
          ...(cursor ? { cursor } : {}),
        },
      },
      ...withSignal(signal),
    }),
    AdminMediaReportPageSchema,
  );
}

/** Video or photo report decision; `targetVersion` is the item's own. */
export async function decideMediaReport(
  api: BrowserApi,
  id: string,
  decision: MediaReportDecision,
  { key, assertCurrent }: Command,
) {
  const parsed = MediaReportDecisionSchema.parse(decision);
  const body = {
    action: parsed.action,
    expectedVersion: parsed.expectedVersion,
    targetVersion: parsed.targetVersion,
    ...(parsed.reason === undefined ? {} : { reason: parsed.reason }),
  };
  const headers = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.POST('/admin/media-reports/{id}/decision', {
      params: {
        path: { id },
        header: { ...headers, 'Idempotency-Key': key },
      },
      body,
    }),
    MediaReportDecisionResultSchema,
  );
}
