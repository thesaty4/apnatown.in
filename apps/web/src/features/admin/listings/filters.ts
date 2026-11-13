import {
  AdminListingQuerySchema,
  AdminListingReportParamsSchema,
  AdminListingStatusSchema,
  AdminListingTypeSchema,
  type AdminListingStatus,
  type AdminListingType,
} from '@apnatown/shared/admin';

export type ListingFilters = {
  type: AdminListingType;
  /** Validated search text; absent means no search. */
  q: string | undefined;
  /** Absent means every listing status. */
  status: AdminListingStatus | undefined;
  /** `?reportId=` deep link (overview alert / report intake). */
  reportId: string | undefined;
};

export const LISTING_STATUSES: readonly AdminListingStatus[] =
  AdminListingStatusSchema.options;

const one = (value: string | string[] | null | undefined) =>
  Array.isArray(value) ? value[0] : (value ?? undefined);

/** URL `type,q,status,reportId`, validated against the shared API schemas;
 * anything invalid is dropped rather than sent to the API. */
export function readListingFilters(
  read: (name: string) => string | string[] | null | undefined,
): ListingFilters {
  const type = AdminListingTypeSchema.safeParse(one(read('type')));
  const q = AdminListingQuerySchema.shape.q.safeParse(one(read('q')));
  const status = AdminListingStatusSchema.safeParse(one(read('status')));
  const reportId = AdminListingReportParamsSchema.shape.id.safeParse(
    one(read('reportId')),
  );
  return {
    type: type.success ? type.data : 'business',
    q: q.success ? q.data : undefined,
    status: status.success ? status.data : undefined,
    reportId: reportId.success ? reportId.data : undefined,
  };
}

/** Canonical list URL; defaults are omitted so shared links stay short. */
export function listingsHref({ type, q, status, reportId }: ListingFilters) {
  const query = new URLSearchParams();
  if (type !== 'business') query.set('type', type);
  if (q) query.set('q', q);
  if (status) query.set('status', status);
  if (reportId) query.set('reportId', reportId);
  const search = query.toString();
  return search ? `/admin/listings?${search}` : '/admin/listings';
}
