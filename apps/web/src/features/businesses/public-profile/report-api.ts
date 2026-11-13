import {
  ListingReportAcceptedSchema,
  ListingReportCreateSchema,
  type ListingReportCreate,
} from '@apnatown/shared/admin';
import type { BrowserApi } from '../../../shared/api/browser';
import { normalizeFailure, unwrap } from '../../../shared/api/result';
import { defined } from '../../products/owner/api';

/**
 * F-PF-007 public listing report (guest or signed-in). CSRF + Origin come
 * from `mutationHeaders`; the same Idempotency-Key replays an identical
 * report instead of filing a duplicate. Returns 202 `{reportId}`.
 */
export async function reportListing(
  api: BrowserApi,
  { report, key }: { report: ListingReportCreate; key: string },
) {
  const body = defined(ListingReportCreateSchema.parse(report));
  const header = { ...(await api.mutationHeaders()), 'Idempotency-Key': key };
  try {
    return unwrap(
      await api.POST('/listing-reports', { params: { header }, body }),
      ListingReportAcceptedSchema,
    );
  } catch (error) {
    throw normalizeFailure(error);
  }
}
