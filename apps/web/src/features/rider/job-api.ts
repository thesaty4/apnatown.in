import { z } from 'zod';
import {
  DeliveryOfferRespondSchema,
  HandoverResultSchema,
  RiderJobCompleteSchema,
  RiderJobEventInputSchema,
  RiderJobEventResultSchema,
  RiderJobSchema,
  type RiderJob,
  type RiderJobComplete,
  type RiderJobEventInput,
} from '@apnatown/shared/delivery';
import type { components } from '@apnatown/api-client';
import type { BrowserApi } from '../../shared/api/browser';
import { unwrap } from '../../shared/api/result';
import type { Command } from './api';

const NoContentSchema = z.undefined();

async function commandHeader(api: BrowserApi, { key, assertCurrent }: Command) {
  const header = await api.mutationHeaders();
  assertCurrent();
  return { ...header, 'Idempotency-Key': key };
}

/** Accept the current offer at its rendered version → the assigned job. */
export async function acceptOffer(
  api: BrowserApi,
  offerId: string,
  expectedVersion: number,
  command: Command,
) {
  const body = DeliveryOfferRespondSchema.parse({ expectedVersion });
  return unwrap(
    await api.POST('/delivery/offers/{offerId}/accept', {
      params: { header: await commandHeader(api, command), path: { offerId } },
      body,
    }),
    RiderJobSchema,
  );
}

/** Decline the current offer (204); the dispatcher moves to the next rider. */
export async function rejectOffer(
  api: BrowserApi,
  offerId: string,
  expectedVersion: number,
  command: Command,
) {
  const body = DeliveryOfferRespondSchema.parse({ expectedVersion });
  unwrap(
    await api.POST('/delivery/offers/{offerId}/reject', {
      params: { header: await commandHeader(api, command), path: { offerId } },
      body,
    }),
    NoContentSchema,
  );
}

/** One job step (reached_shop / picked_up / reached_drop / fail). */
export async function postJobEvent(
  api: BrowserApi,
  jobId: string,
  input: RiderJobEventInput,
  command: Command,
) {
  const body = RiderJobEventInputSchema.parse(
    input,
  ) as components['schemas']['RiderJobEventInputDto'];
  return unwrap(
    await api.POST('/delivery/jobs/{jobId}/events', {
      params: { header: await commandHeader(api, command), path: { jobId } },
      body,
    }),
    RiderJobEventResultSchema,
  );
}

/** Handover with the customer's typed code (+ explicit cash confirmation). */
export async function completeJob(
  api: BrowserApi,
  jobId: string,
  input: RiderJobComplete,
  command: Command,
) {
  const body = RiderJobCompleteSchema.parse(
    input,
  ) as components['schemas']['RiderJobCompleteDto'];
  return unwrap(
    await api.POST('/delivery/jobs/{jobId}/complete', {
      params: { header: await commandHeader(api, command), path: { jobId } },
      body,
    }),
    HandoverResultSchema,
  );
}

/** The rendered job/order/financial versions every job command must carry. */
export const jobVersions = (job: RiderJob) => ({
  expectedVersion: job.version,
  expectedOrderVersion: job.orderVersion,
  expectedFinancialVersion: job.financialVersion,
});
