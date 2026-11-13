import {
  ServiceOwnerCreateSchema,
  ServiceOwnerDeletedSchema,
  ServiceOwnerPageSchema,
  ServiceOwnerPatchSchema,
  ServiceOwnerSchema,
  type ServiceMediaInput,
  type ServiceOwnerCreate,
  type ServiceOwnerPatch,
  type ServiceStatus,
} from '@apnatown/shared/services';
import type { BusinessKind } from '@apnatown/shared/businesses';
import type { BrowserApi } from '../../../shared/api/browser';
import { unwrap } from '../../../shared/api/result';

type Reader = Pick<BrowserApi, 'GET'>;

/** Owner list page size (API max 50). */
export const SERVICE_PAGE_SIZE = 50;

const withSignal = (signal?: AbortSignal) => (signal ? { signal } : {});

/** Drops `undefined` members so optional wire fields are omitted, not sent
 * (exactOptionalPropertyTypes); `null` stays an explicit clear. */
function defined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, member]) => member !== undefined),
  ) as { [K in keyof T]: Exclude<T[K], undefined> };
}

/** Gallery placement is always explicit per image (Q-50: never inferred). */
function withMedia<T extends { media?: ServiceMediaInput[] | undefined }>(
  body: T,
) {
  const { media, ...rest } = body;
  return {
    ...defined(rest),
    ...(media && {
      media: media.map(({ assetId, showInGallery }) => ({
        assetId,
        showInGallery: showInGallery ?? false,
      })),
    }),
  };
}

/** Every owner call names its application kind, so an owner of both a shop
 * and a provider business never mixes contexts. */
const kindHeader = (kind: BusinessKind) => ({ 'X-Business-Kind': kind });

/** Writes carry CSRF/Origin, the kind header and one key per user intent. */
async function writeHeaders(
  api: BrowserApi,
  kind: BusinessKind,
  key: string,
  assertCurrent: () => void,
) {
  const header = {
    ...(await api.mutationHeaders()),
    ...kindHeader(kind),
    'Idempotency-Key': key,
  };
  assertCurrent();
  return header;
}

export async function listOwnerServices(
  api: Reader,
  kind: BusinessKind,
  status: ServiceStatus | undefined,
  cursor: string | undefined,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/businesses/me/services', {
      params: {
        header: kindHeader(kind),
        query: {
          ...(status && { status }),
          ...(cursor && { cursor }),
          limit: SERVICE_PAGE_SIZE,
        },
      },
      ...withSignal(signal),
    }),
    ServiceOwnerPageSchema,
  );
}

export async function getOwnerService(
  api: Reader,
  kind: BusinessKind,
  serviceId: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/businesses/me/services/{serviceId}', {
      params: { header: kindHeader(kind), path: { serviceId } },
      ...withSignal(signal),
    }),
    ServiceOwnerSchema,
  );
}

export async function createOwnerService(
  api: BrowserApi,
  kind: BusinessKind,
  input: ServiceOwnerCreate,
  key: string,
  assertCurrent: () => void,
) {
  const body = withMedia(ServiceOwnerCreateSchema.parse(input));
  const header = await writeHeaders(api, kind, key, assertCurrent);
  return unwrap(
    await api.POST('/businesses/me/services', { params: { header }, body }),
    ServiceOwnerSchema,
  );
}

export async function updateOwnerService(
  api: BrowserApi,
  kind: BusinessKind,
  serviceId: string,
  input: ServiceOwnerPatch,
  key: string,
  assertCurrent: () => void,
) {
  const body = withMedia(ServiceOwnerPatchSchema.parse(input));
  const header = await writeHeaders(api, kind, key, assertCurrent);
  return unwrap(
    await api.PATCH('/businesses/me/services/{serviceId}', {
      params: { header, path: { serviceId } },
      body,
    }),
    ServiceOwnerSchema,
  );
}

export async function deleteOwnerService(
  api: BrowserApi,
  kind: BusinessKind,
  serviceId: string,
  expectedVersion: number,
  key: string,
  assertCurrent: () => void,
) {
  const header = await writeHeaders(api, kind, key, assertCurrent);
  return unwrap(
    await api.DELETE('/businesses/me/services/{serviceId}', {
      params: { header, path: { serviceId } },
      body: { expectedVersion },
    }),
    ServiceOwnerDeletedSchema,
  );
}
