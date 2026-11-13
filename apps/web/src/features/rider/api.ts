import {
  RiderCurrentOfferSchema,
  RiderDisputeInputSchema,
  RiderDisputeResultSchema,
  RiderDraftWriteSchema,
  RiderEarningsSchema,
  RiderHistoryPageSchema,
  RiderJobSchema,
  RiderOnlineInputSchema,
  RiderOnlineStateSchema,
  RiderProfileSchema,
  RiderSummarySchema,
  type RiderDisputeInput,
  type RiderDraftWrite,
} from '@apnatown/shared/delivery';
import type { components } from '@apnatown/api-client';
import type { BrowserApi } from '../../shared/api/browser';
import { unwrap } from '../../shared/api/result';

type Reader = Pick<BrowserApi, 'GET'>;
/** One user intent: a stable Idempotency-Key reused by retries of the same payload. */
export type Command = { key: string; assertCurrent: () => void };
export const HISTORY_RANGES = ['all', 'today', 'week'] as const;
export type HistoryRange = (typeof HISTORY_RANGES)[number];
export const EARNINGS_RANGES = ['day', 'week'] as const;
export type EarningsRange = (typeof EARNINGS_RANGES)[number];

/** URL `?range=` → a known history filter; anything else is `all`. */
export const parseHistoryRange = (value: unknown): HistoryRange =>
  HISTORY_RANGES.find((range) => range === value) ?? 'all';

const withSignal = (signal?: AbortSignal) => (signal ? { signal } : {});

/** Own application/profile; an applicant without one gets the empty version-0 draft. */
export async function getRiderMe(api: Reader, signal?: AbortSignal) {
  return unwrap(
    await api.GET('/delivery/riders/me', withSignal(signal)),
    RiderProfileSchema,
  );
}

/** Draft save / submit. Only the current step's fields are sent. */
export async function saveRiderDraft(
  api: BrowserApi,
  input: RiderDraftWrite,
  { key, assertCurrent }: Command,
) {
  const body = RiderDraftWriteSchema.parse(
    input,
  ) as components['schemas']['RiderDraftWriteDto'];
  const header = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.PUT('/delivery/riders/me', {
      params: { header: { ...header, 'Idempotency-Key': key } },
      body,
    }),
    RiderProfileSchema,
  );
}

export async function setRiderOnline(
  api: BrowserApi,
  online: boolean,
  assertCurrent: () => void,
) {
  const body = RiderOnlineInputSchema.parse({ online });
  const header = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.POST('/delivery/riders/me/online', {
      params: { header },
      body,
    }),
    RiderOnlineStateSchema,
  );
}

export async function getRiderSummary(api: Reader, signal?: AbortSignal) {
  return unwrap(
    await api.GET('/delivery/riders/me/summary', withSignal(signal)),
    RiderSummarySchema,
  );
}

export async function getCurrentOffer(api: Reader, signal?: AbortSignal) {
  return unwrap(
    await api.GET('/delivery/riders/me/offers/current', withSignal(signal)),
    RiderCurrentOfferSchema,
  );
}

/** 404 DELIVERY_JOB_NOT_FOUND is the explicit "no active delivery" answer. */
export async function getActiveJob(api: Reader, signal?: AbortSignal) {
  return unwrap(
    await api.GET('/delivery/riders/me/active', withSignal(signal)),
    RiderJobSchema,
  );
}

export async function getRiderHistory(
  api: Reader,
  range: HistoryRange,
  cursor: string | undefined,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/delivery/riders/me/history', {
      params: { query: { range, ...(cursor ? { cursor } : {}) } },
      ...withSignal(signal),
    }),
    RiderHistoryPageSchema,
  );
}

export async function getRiderEarnings(
  api: Reader,
  range: EarningsRange,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/delivery/riders/me/earnings', {
      params: { query: { range } },
      ...withSignal(signal),
    }),
    RiderEarningsSchema,
  );
}

/** Jobless report: Settings support intake returns the persisted receipt ID. */
export async function createRiderDispute(
  api: BrowserApi,
  input: RiderDisputeInput,
  { key, assertCurrent }: Command,
) {
  const body = RiderDisputeInputSchema.parse(
    input,
  ) as components['schemas']['RiderDisputeInputDto'];
  const header = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.POST('/delivery/riders/me/disputes', {
      params: { header: { ...header, 'Idempotency-Key': key } },
      body,
    }),
    RiderDisputeResultSchema,
  );
}
