'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { CheckoutAttempt, CheckoutQuote } from '@apnatown/shared/checkout';
import { accountScope, queryKeys } from '../../shared/api/query-keys';
import { privateQueryOptions } from '../../shared/api/private-query';
import { failureCode, retryTransientRead } from '../../shared/api/result';
import { useIdempotencyKey } from '../../shared/api/idempotency';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import { useSession } from '../../shared/auth/SessionProvider';
import { isTransient } from '../cart/queries';
import {
  createCheckoutAttempt,
  getCheckoutAttempt,
  quoteCart,
  type AttemptRequest,
  type QuoteRequest,
} from './api';

/** Signed-in customer scope; null while the session is not ready. */
export function useCheckoutScope() {
  const session = useSession();
  const { state, epoch } = session;
  const scope = state.kind === 'ready' ? accountScope(state.data, epoch) : null;
  return { ...session, scope };
}

/**
 * POST /cart/quote whenever the request (cart version, address, modes)
 * changes. One request is in flight at a time; when it settles, the latest
 * input is quoted. The last confirmed quote stays visible while a newer one
 * loads, flagged `current: false` so it can never be placed.
 */
export function useCheckoutQuote(request: QuoteRequest | null) {
  const { api, lifecycle } = useSession();
  const mutation = usePrivateMutation(
    lifecycle,
    (body: QuoteRequest, assertCurrent): Promise<CheckoutQuote> =>
      quoteCart(api, body, assertCurrent),
  );
  const run = useRef(mutation.run);
  run.current = mutation.run;
  const inflight = useRef(false);
  const attempted = useRef<string | null>(null);
  const [quoted, setQuoted] = useState<{
    input: string;
    quote: CheckoutQuote;
  }>();
  const [failed, setFailed] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const input = request ? JSON.stringify(request) : null;

  useEffect(() => {
    if (input === null || inflight.current || attempted.current === input)
      return;
    attempted.current = input;
    inflight.current = true;
    let ok = false;
    void run
      .current(JSON.parse(input) as QuoteRequest, (quote) => {
        ok = true;
        setQuoted({ input, quote });
      })
      .finally(() => {
        inflight.current = false;
        setFailed(ok ? null : input);
        setTick((value) => value + 1);
      });
  }, [input, tick]);

  return {
    quote: quoted?.quote,
    current: input !== null && quoted?.input === input,
    error: failed !== null && failed === input ? mutation.error : null,
    /** Re-quote the same input (Retry, or after a stale-quote rejection). */
    refresh() {
      attempted.current = null;
      setFailed(null);
      setTick((value) => value + 1);
    },
  };
}

/** POST /checkout/attempts with one stable key per logical attempt: the same
 * quote/versions/method retried after a lost response reuses its key. */
export function usePlaceOrder() {
  const { api, lifecycle, scope, epoch } = useCheckoutScope();
  const client = useQueryClient();
  const keys = useIdempotencyKey();
  return usePrivateMutation(
    lifecycle,
    async (body: AttemptRequest, assertCurrent): Promise<CheckoutAttempt> => {
      const key = keys.for(JSON.stringify(body));
      try {
        const attempt = await createCheckoutAttempt(
          api,
          body,
          key,
          assertCurrent,
        );
        keys.clear();
        if (scope) {
          client.setQueryData(
            queryKeys.checkoutAttempt(scope, attempt.id),
            attempt,
          );
          void client.invalidateQueries({
            queryKey: queryKeys.customerOrdersRoot(scope),
          });
        }
        void client.invalidateQueries({
          queryKey: queryKeys.cart(scope, epoch),
        });
        return attempt;
      } catch (error) {
        if (!isTransient(error)) keys.clear();
        throw error;
      }
    },
  );
}

/** GET /checkout/attempts/{id}: owner-checked; never a code or address. */
export function useCheckoutAttempt(attemptId: string) {
  const { api, lifecycle, scope } = useCheckoutScope();
  return useQuery({
    ...privateQueryOptions(
      scope
        ? queryKeys.checkoutAttempt(scope, attemptId)
        : ['private', 'pending', 'checkout', attemptId],
      scope?.epoch ?? 0,
      lifecycle,
      (signal) => getCheckoutAttempt(api, attemptId, signal),
    ),
    enabled: scope !== null,
    retry: retryTransientRead,
  });
}

export const isNotFound = (error: unknown) =>
  ['CHECKOUT_ATTEMPT_NOT_FOUND', 'COMMON_NOT_FOUND'].includes(
    failureCode(error),
  );
