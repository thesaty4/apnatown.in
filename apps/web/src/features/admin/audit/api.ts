import { z } from 'zod';
import {
  AuditEntryDetailSchema,
  AuditPageSchema,
} from '@apnatown/shared/admin';
import type { BrowserApi } from '../../../shared/api/browser';
import { ApiFailure, unwrap } from '../../../shared/api/result';
import type { AuditFilters, AuditSection } from './filters';

type Reader = Pick<BrowserApi, 'GET'>;
const withSignal = (signal?: AbortSignal) => (signal ? { signal } : {});
const PAGE_SIZE = 50;

/** One keyset page. `actorRole` is only ever present for the activity section. */
export async function listAudit(
  api: Reader,
  section: AuditSection,
  filters: AuditFilters,
  cursor?: string,
  signal?: AbortSignal,
) {
  const page = { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) };
  if (section === 'activity')
    return unwrap(
      await api.GET('/super-admin/activity', {
        params: { query: { ...filters, ...page } },
        ...withSignal(signal),
      }),
      AuditPageSchema,
    );
  const { actorRole: _ignored, ...query } = filters;
  return unwrap(
    await api.GET('/admin/audit', {
      params: { query: { ...query, ...page } },
      ...withSignal(signal),
    }),
    AuditPageSchema,
  );
}

/** Redacted before/after for one entry, scope-checked by the server again. */
export async function getAuditEntry(
  api: Reader,
  section: AuditSection,
  id: string,
  signal?: AbortSignal,
) {
  const params = { params: { path: { id } }, ...withSignal(signal) };
  return unwrap(
    section === 'activity'
      ? await api.GET('/super-admin/activity/{id}', params)
      : await api.GET('/admin/audit/{id}', params),
    AuditEntryDetailSchema,
  );
}

const fileName = /filename="(apnatown-activity-\d{4}-\d{2}-\d{2}\.csv)"/;

/** The CSV body stays a transient Blob handed straight to the browser download;
 * it never enters React Query or any other cache. Errors keep the normalized
 * JSON envelope (e.g. REPORT_TOO_LARGE, COMMON_RATE_LIMITED). */
export async function exportActivity(api: Reader, filters: AuditFilters) {
  const result = await api.GET('/super-admin/activity/export.csv', {
    params: { query: filters },
    parseAs: 'blob',
  });
  if (!result.response.ok) unwrap(result, z.never());
  if (!(result.data instanceof Blob)) throw new ApiFailure('INVALID_RESPONSE');
  const name =
    fileName.exec(
      result.response.headers.get('Content-Disposition') ?? '',
    )?.[1] ?? 'apnatown-activity.csv';
  return { blob: result.data, name };
}

/** Same object-URL download the account data export uses; revoked at once. */
export function saveFile({ blob, name }: { blob: Blob; name: string }) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.rel = 'noopener';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
