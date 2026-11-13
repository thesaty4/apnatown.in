import {
  BusinessAnalyticsSchema,
  BusinessOverviewSchema,
  BusinessOwnerSchema,
  BusinessProfilePatchSchema,
  BusinessVersionCommandSchema,
  CreateBusinessApplicationSchema,
  type BusinessKind,
  type BusinessProfilePatch,
} from '@apnatown/shared/businesses';
import {
  ProviderExpertiseReplaceSchema,
  ProviderExpertiseSchema,
} from '@apnatown/shared/services';
import { ProfileSchema } from '@apnatown/shared/users';
import type { components } from '@apnatown/api-client';
import type { BrowserApi } from '../../shared/api/browser';
import { unwrap } from '../../shared/api/result';

type Reader = Pick<BrowserApi, 'GET'>;
/** One user intent: a stable Idempotency-Key reused by retries of the same payload. */
export type Command = { key: string; assertCurrent: () => void };
type PatchBody = components['schemas']['BusinessProfilePatchDto'];

const withSignal = (signal?: AbortSignal) => (signal ? { signal } : {});

/** Drops `undefined` members so optional wire fields are omitted, not sent
 * (exactOptionalPropertyTypes); `null` stays an explicit clear. */
function defined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, member]) => member !== undefined),
  ) as { [K in keyof T]: Exclude<T[K], undefined> };
}

/** Every owner route names the intended application kind explicitly
 * (`BUSINESS_KIND_HEADER`), so an owner of both kinds never gets
 * BUSINESS_CONTEXT_REQUIRED and caches never cross contexts. */
const kindHeader = (kind: BusinessKind) => ({ 'X-Business-Kind': kind });

export async function getBusinessMe(
  api: Reader,
  kind: BusinessKind,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/businesses/me', {
      params: { header: kindHeader(kind) },
      ...withSignal(signal),
    }),
    BusinessOwnerSchema,
  );
}

export async function getBusinessOverview(
  api: Reader,
  kind: BusinessKind,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/businesses/me/overview', {
      params: { header: kindHeader(kind) },
      ...withSignal(signal),
    }),
    BusinessOverviewSchema,
  );
}

/** S-PROV-14 reporting-v1 provider analytics (30 IST days). */
export async function getBusinessAnalytics(
  api: Reader,
  kind: BusinessKind,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/businesses/me/analytics', {
      params: { header: kindHeader(kind), query: { period: '30d' } },
      ...withSignal(signal),
    }),
    BusinessAnalyticsSchema,
  );
}

/** Verified login mobile shown as onboarding step 1 (never a second OTP flow). */
export async function getOwnerProfile(api: Reader, signal?: AbortSignal) {
  return unwrap(await api.GET('/users/me', withSignal(signal)), ProfileSchema);
}

export async function createBusinessApplication(
  api: BrowserApi,
  kind: BusinessKind,
  { key, assertCurrent }: Command,
) {
  const body = CreateBusinessApplicationSchema.parse({ kind });
  const header = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.POST('/businesses/applications', {
      params: { header: { ...header, 'Idempotency-Key': key } },
      body,
    }),
    BusinessOwnerSchema,
  );
}

export async function patchBusinessMe(
  api: BrowserApi,
  kind: BusinessKind,
  input: BusinessProfilePatch,
  assertCurrent: () => void,
) {
  const parsed = BusinessProfilePatchSchema.parse(input);
  const body = defined({
    ...parsed,
    settings: parsed.settings ? defined(parsed.settings) : undefined,
  }) as PatchBody;
  const header = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.PATCH('/businesses/me', {
      params: { header: { ...header, ...kindHeader(kind) } },
      body,
    }),
    BusinessOwnerSchema,
  );
}

async function versionCommand(
  api: BrowserApi,
  kind: BusinessKind,
  path: '/businesses/me/submit' | '/businesses/me/reactivate',
  expectedVersion: number,
  { key, assertCurrent }: Command,
) {
  const body = BusinessVersionCommandSchema.parse({ expectedVersion });
  const header = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.POST(path, {
      params: {
        header: { ...header, ...kindHeader(kind), 'Idempotency-Key': key },
      },
      body,
    }),
    BusinessOwnerSchema,
  );
}

export const submitBusiness = (
  api: BrowserApi,
  kind: BusinessKind,
  expectedVersion: number,
  command: Command,
) =>
  versionCommand(api, kind, '/businesses/me/submit', expectedVersion, command);

export const reactivateBusiness = (
  api: BrowserApi,
  kind: BusinessKind,
  expectedVersion: number,
  command: Command,
) =>
  versionCommand(
    api,
    kind,
    '/businesses/me/reactivate',
    expectedVersion,
    command,
  );

// --- Provider expertise (Services-owned; own `expertiseVersion`) ----------
// Resolved server-side as the caller's provider business: no kind header.

export async function getExpertise(api: Reader, signal?: AbortSignal) {
  return unwrap(
    await api.GET('/businesses/me/expertise', withSignal(signal)),
    ProviderExpertiseSchema,
  );
}

export async function replaceExpertise(
  api: BrowserApi,
  input: { subcategoryIds: string[]; expectedVersion: number },
  assertCurrent: () => void,
) {
  const body = ProviderExpertiseReplaceSchema.parse(input);
  const header = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.PUT('/businesses/me/expertise', { params: { header }, body }),
    ProviderExpertiseSchema,
  );
}
