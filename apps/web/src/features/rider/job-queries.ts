'use client';

import { useQueryClient } from '@tanstack/react-query';
import type {
  HandoverResult,
  RiderCurrentOffer,
  RiderJob,
  RiderJobComplete,
  RiderJobEventInput,
  RiderJobEventResult,
  RiderOffer,
} from '@apnatown/shared/delivery';
import type { AccountScope } from '../../shared/api/query-keys';
import { useIdempotencyKey } from '../../shared/api/idempotency';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import { useRealtimeInvalidation } from '../../shared/realtime/RealtimeProvider';
import { acceptOffer, completeJob, postJobEvent, rejectOffer } from './job-api';
import { riderKeys, useRiderContext } from './queries';

/** Every rider read that an offer/job change can affect (not the profile). */
const workKeys = (scope: AccountScope) => [
  riderKeys.offer(scope),
  riderKeys.active(scope),
  riderKeys.summary(scope),
  [...riderKeys.all(scope), 'history'],
  [...riderKeys.all(scope), 'earnings'],
];

/**
 * `event: delivery` (offer created/expired/revoked, job progressed) and every
 * stream (re)connect mark the rider's offer, active job, summary and reports
 * stale. Hints carry no data; the REST reads stay authoritative. Mounted once
 * by the rider shell.
 */
export function useRiderLive(enabled: boolean) {
  const { scope } = useRiderContext();
  useRealtimeInvalidation(
    ['delivery'],
    enabled && scope ? workKeys(scope) : null,
  );
}

function useRefreshWork() {
  const client = useQueryClient();
  const { scope } = useRiderContext();
  return () =>
    scope
      ? Promise.all(
          workKeys(scope).map((queryKey) =>
            client.invalidateQueries({ queryKey }),
          ),
        )
      : Promise.resolve();
}

export type OfferDecision = 'accept' | 'reject';

/**
 * Accept / reject the current offer with its rendered version. Accept seeds
 * the returned job as the active one (navigation happens only after this
 * commits). Any outcome (including expired/taken conflicts) re-reads the
 * offer, active job and summary so the server state is shown, never a guess.
 */
export function useOfferResponse() {
  const client = useQueryClient();
  const { api, lifecycle, scope } = useRiderContext();
  const keys = useIdempotencyKey();
  const refresh = useRefreshWork();
  const mutation = usePrivateMutation(
    lifecycle,
    async (
      input: { offer: RiderOffer; decision: OfferDecision; key: string },
      assertCurrent,
    ): Promise<RiderJob | null> => {
      const command = { key: input.key, assertCurrent };
      const { offerId, version } = input.offer;
      try {
        const job =
          input.decision === 'accept'
            ? await acceptOffer(api, offerId, version, command)
            : (await rejectOffer(api, offerId, version, command), null);
        assertCurrent();
        if (scope) {
          await client.cancelQueries({ queryKey: riderKeys.offer(scope) });
          assertCurrent();
          client.setQueryData<RiderCurrentOffer>(riderKeys.offer(scope), {
            offer: null,
          });
          if (job) client.setQueryData(riderKeys.active(scope), job);
        }
        void refresh();
        return job;
      } catch (error) {
        void refresh();
        throw error;
      }
    },
  );
  return {
    mutation,
    respond(
      offer: RiderOffer,
      decision: OfferDecision,
      onSuccess?: (job: RiderJob | null) => void,
    ) {
      const key = keys.for(`${offer.offerId}:${offer.version}:${decision}`);
      return mutation.run({ offer, decision, key }, (job) => {
        keys.clear();
        onSuccess?.(job);
      });
    },
  };
}

export type JobCommand =
  | { type: 'event'; input: RiderJobEventInput }
  | { type: 'complete'; input: RiderJobComplete };
export type JobCommandResult =
  | { type: 'event'; result: RiderJobEventResult }
  | { type: 'complete'; result: HandoverResult };

/**
 * One job step / completion per user intent. The returned job (if still
 * live) replaces the cached active job; terminal results and every
 * rejection re-read the rider's work so versions, items, payable amount and
 * code metadata are current before another attempt.
 */
export function useJobCommand(jobId: string) {
  const client = useQueryClient();
  const { api, lifecycle, scope } = useRiderContext();
  const keys = useIdempotencyKey();
  const refresh = useRefreshWork();
  const mutation = usePrivateMutation(
    lifecycle,
    async (
      input: { command: JobCommand; key: string },
      assertCurrent,
    ): Promise<JobCommandResult> => {
      const command = { key: input.key, assertCurrent };
      try {
        const outcome: JobCommandResult =
          input.command.type === 'event'
            ? {
                type: 'event',
                result: await postJobEvent(
                  api,
                  jobId,
                  input.command.input,
                  command,
                ),
              }
            : {
                type: 'complete',
                result: await completeJob(
                  api,
                  jobId,
                  input.command.input,
                  command,
                ),
              };
        assertCurrent();
        const job = outcome.type === 'event' ? outcome.result.job : null;
        if (scope && job) {
          await client.cancelQueries({ queryKey: riderKeys.active(scope) });
          assertCurrent();
          client.setQueryData(riderKeys.active(scope), job);
        }
        void refresh();
        return outcome;
      } catch (error) {
        void refresh();
        throw error;
      }
    },
  );
  return {
    mutation,
    async run(
      command: JobCommand,
      onSuccess?: (result: JobCommandResult) => void,
    ) {
      const key = keys.for(`${command.type}:${JSON.stringify(command.input)}`);
      await mutation.run({ command, key }, (result) => {
        keys.clear();
        onSuccess?.(result);
      });
      // The typed code is cleared after every attempt, so its key (whose
      // in-memory fingerprint includes it) is never kept around either.
      if (command.type === 'complete') keys.clear();
    },
  };
}
