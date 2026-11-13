import {
  AdminListingDetailSchema,
  AdminListingEditSchema,
  AdminListingMutationResultSchema,
  AdminListingPageSchema,
  AdminListingProductPageSchema,
  AdminListingRemoveSchema,
  AdminListingReportPageSchema,
  AdminListingReportResolutionSchema,
  AdminListingReportSchema,
  AdminProductPublicationResultSchema,
  AdminProductPublicationSchema,
  type AdminBusinessListingType,
  type AdminListingEdit,
  type AdminListingRemove,
  type AdminListingReportResolution,
  type AdminProductPublication,
  type ListingReportStatus,
} from '@apnatown/shared/admin';
import type { BrowserApi } from '../../../shared/api/browser';
import { unwrap } from '../../../shared/api/result';
import { defined } from '../../products/owner/api';
import type { ListingFilters } from './filters';

type Reader = Pick<BrowserApi, 'GET'>;
export type Command = { key: string; assertCurrent: () => void };
const PAGE_SIZE = 20;
const withSignal = (signal?: AbortSignal) => (signal ? { signal } : {});

async function commandHeaders(
  api: BrowserApi,
  { key, assertCurrent }: Command,
) {
  const headers = await api.mutationHeaders();
  assertCurrent();
  return { ...headers, 'Idempotency-Key': key };
}

/** Scoped keyset page of one listing type. */
export async function listListings(
  api: Reader,
  { type, q, status }: Pick<ListingFilters, 'type' | 'q' | 'status'>,
  cursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/admin/listings', {
      params: {
        query: defined({ type, q, status, cursor, limit: PAGE_SIZE }),
      },
      ...withSignal(signal),
    }),
    AdminListingPageSchema,
  );
}

/** Actual edit values, version, allowedActions and the newest open reports. */
export async function getListingDetail(
  api: Reader,
  type: AdminBusinessListingType,
  id: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/admin/listings/{type}/{id}', {
      params: { path: { type, id } },
      ...withSignal(signal),
    }),
    AdminListingDetailSchema,
  );
}

export async function editListing(
  api: BrowserApi,
  target: { type: AdminBusinessListingType; id: string },
  edit: AdminListingEdit,
  command: Command,
) {
  const body = defined(AdminListingEditSchema.parse(edit));
  const header = await commandHeaders(api, command);
  return unwrap(
    await api.PATCH('/admin/listings/{type}/{id}', {
      params: { path: target, header },
      body,
    }),
    AdminListingMutationResultSchema,
  );
}

export async function removeListing(
  api: BrowserApi,
  target: { type: AdminBusinessListingType; id: string },
  remove: AdminListingRemove,
  command: Command,
) {
  const body = defined(AdminListingRemoveSchema.parse(remove));
  const header = await commandHeaders(api, command);
  return unwrap(
    await api.DELETE('/admin/listings/{type}/{id}', {
      params: { path: target, header },
      body,
    }),
    AdminListingMutationResultSchema,
  );
}

/** Includes unpublished products with their versions. */
export async function listListingProducts(
  api: Reader,
  businessId: string,
  cursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/admin/listings/{businessId}/products', {
      params: {
        path: { businessId },
        query: defined({ cursor, limit: PAGE_SIZE }),
      },
      ...withSignal(signal),
    }),
    AdminListingProductPageSchema,
  );
}

export async function setProductPublication(
  api: BrowserApi,
  productId: string,
  publication: AdminProductPublication,
  command: Command,
) {
  const body = AdminProductPublicationSchema.parse(publication);
  const header = await commandHeaders(api, command);
  return unwrap(
    await api.POST('/admin/products/{productId}/publication', {
      params: { path: { productId }, header },
      body,
    }),
    AdminProductPublicationResultSchema,
  );
}

/** Reports of one listing (newest first), filtered by status. */
export async function listListingReports(
  api: Reader,
  targetId: string,
  status: ListingReportStatus,
  cursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/admin/listing-reports', {
      params: {
        query: defined({ targetId, status, cursor, limit: PAGE_SIZE }),
      },
      ...withSignal(signal),
    }),
    AdminListingReportPageSchema,
  );
}

export async function getListingReport(
  api: Reader,
  id: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/admin/listing-reports/{id}', {
      params: { path: { id } },
      ...withSignal(signal),
    }),
    AdminListingReportSchema,
  );
}

export async function resolveListingReport(
  api: BrowserApi,
  id: string,
  resolution: AdminListingReportResolution,
  command: Command,
) {
  const body = defined(AdminListingReportResolutionSchema.parse(resolution));
  const header = await commandHeaders(api, command);
  return unwrap(
    await api.POST('/admin/listing-reports/{id}/resolution', {
      params: { path: { id }, header },
      body,
    }),
    AdminListingReportSchema,
  );
}
