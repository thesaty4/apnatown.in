import type { BusinessKind } from '@apnatown/shared/businesses';
import {
  DeliveryAssignSchema,
  DeliveryDispatchStateSchema,
  DeliveryRequestSchema,
  RiderCandidatePageSchema,
} from '@apnatown/shared/delivery';
import type { components } from '@apnatown/api-client';
import type { BrowserApi } from '../../shared/api/browser';
import { unwrap } from '../../shared/api/result';

type Reader = Pick<BrowserApi, 'GET'>;

const withSignal = (signal?: AbortSignal) => (signal ? { signal } : {});
const kindHeader = (kind: BusinessKind) => ({ 'X-Business-Kind': kind });

/** Owner platform-rider dispatch command; versions come from the rendered
 * order (and its job, once one exists). */
export type DispatchCommand =
  | { type: 'request'; expectedOrderVersion: number }
  | {
      type: 'assign';
      riderUserId: string;
      expectedOrderVersion: number;
      expectedJobVersion: number | null;
    };

/** Nearest online riders of the job's city (server scoped; a hint only). */
export async function listRiderCandidates(
  api: Reader,
  kind: BusinessKind,
  orderId: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/delivery/orders/{orderId}/riders', {
      params: { header: kindHeader(kind), path: { orderId } },
      ...withSignal(signal),
    }),
    RiderCandidatePageSchema,
  );
}

/** `request` = auto-assign (offer to the nearest eligible rider);
 * `assign` = a directed 60 s offer the chosen rider still has to accept. */
export async function runDispatchCommand(
  api: BrowserApi,
  kind: BusinessKind,
  orderId: string,
  command: DispatchCommand,
  key: string,
  assertCurrent: () => void,
) {
  const csrf = await api.mutationHeaders();
  assertCurrent();
  const params = {
    header: { ...csrf, ...kindHeader(kind), 'Idempotency-Key': key },
    path: { orderId },
  };
  if (command.type === 'request') {
    const body = DeliveryRequestSchema.parse({
      expectedOrderVersion: command.expectedOrderVersion,
    });
    return unwrap(
      await api.POST('/delivery/orders/{orderId}/request', { params, body }),
      DeliveryDispatchStateSchema,
    );
  }
  const body = DeliveryAssignSchema.parse({
    riderUserId: command.riderUserId,
    expectedOrderVersion: command.expectedOrderVersion,
    ...(command.expectedJobVersion !== null && {
      expectedJobVersion: command.expectedJobVersion,
    }),
  }) as components['schemas']['DeliveryAssignDto'];
  return unwrap(
    await api.POST('/delivery/orders/{orderId}/assign', { params, body }),
    DeliveryDispatchStateSchema,
  );
}
