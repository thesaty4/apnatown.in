import type { BusinessKind } from '@apnatown/shared/businesses';
import { EnquiryStatusSchema } from '@apnatown/shared/services';
import { dashboardBase } from '../businesses/parts';
import type { InboxFilters } from './api';

/** API bound for `query` (name/message search). */
export const ENQUIRY_QUERY_MAX = 100;

const one = (value: string | string[] | null | undefined) =>
  Array.isArray(value) ? value[0] : (value ?? undefined);

/** Same normalization as the API (`trim`, empty → none); control characters
 * and over-long text are dropped rather than sent. */
export function normalizeQuery(value: string | undefined) {
  const text = (value ?? '').trim().slice(0, ENQUIRY_QUERY_MAX);
  // eslint-disable-next-line no-control-regex
  return /[\u0000-\u001F\u007F-\u009F]/u.test(text) ? '' : text;
}

/** URL `?status=&q=`, validated; anything else falls back to All / no search. */
export function readInboxFilters(
  read: (name: string) => string | string[] | null | undefined,
): InboxFilters {
  const status = EnquiryStatusSchema.safeParse(one(read('status')));
  return {
    status: status.success ? status.data : undefined,
    query: normalizeQuery(one(read('q'))),
  };
}

function search({ status, query }: InboxFilters) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (query) params.set('q', query);
  const value = params.toString();
  return value ? `?${value}` : '';
}

/** Canonical inbox URL; defaults are omitted so shared links stay short. */
export const inboxHref = (kind: BusinessKind, filters: InboxFilters) =>
  `${dashboardBase(kind)}/enquiries${search(filters)}`;

/** Detail URL. Only the status filter rides along (to rebuild the Back link);
 * name/message search text stays off detail URLs and login return paths. */
export const enquiryHref = (
  kind: BusinessKind,
  id: string,
  filters: InboxFilters,
) => `${dashboardBase(kind)}/enquiries/${id}${search({ status: filters.status, query: '' })}`;
