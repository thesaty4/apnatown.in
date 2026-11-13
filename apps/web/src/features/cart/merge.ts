'use client';

import { useState, useSyncExternalStore } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  CartMergeResultSchema,
  type Cart,
  type CartMergeResult,
} from '@apnatown/shared/cart';
import {
  accountScope,
  queryKeys,
  type Session,
} from '../../shared/api/query-keys';
import { failureCode } from '../../shared/api/result';
import { useSession } from '../../shared/auth/SessionProvider';
import { mergeGuestCart } from './api';
import { isTransient } from './queries';

const STORE = 'apnatown.cartMerge';
const USED = 'apnatown.cartUsed';

/** Tab-scoped merge outcome: IDs, reason codes and the idempotency key only. */
const RecordSchema = z.strictObject({
  userId: z.string().min(1).max(64),
  key: z.string().regex(/^[A-Za-z0-9._:-]{1,128}$/),
  review: CartMergeResultSchema.shape.review.nullable(),
});
export type MergeRecord = z.infer<typeof RecordSchema>;
export type MergeReviewItem = CartMergeResult['review'][number];

export function readMergeRecord(userId: string): MergeRecord | undefined {
  try {
    const parsed = RecordSchema.safeParse(
      JSON.parse(sessionStorage.getItem(STORE) ?? 'null'),
    );
    return parsed.success && parsed.data.userId === userId
      ? parsed.data
      : undefined;
  } catch {
    return undefined;
  }
}

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

function writeMergeRecord(record: MergeRecord) {
  try {
    sessionStorage.setItem(STORE, JSON.stringify(record));
  } catch {
    // Storage unavailable: the review is simply not shown later.
  }
  notify();
}

export function clearMergeRecord() {
  try {
    sessionStorage.removeItem(STORE);
  } catch {
    // Nothing stored.
  }
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function rawRecord() {
  try {
    return sessionStorage.getItem(STORE);
  } catch {
    return null;
  }
}

/** The stored merge outcome for this account; `undefined` on the server. */
export function useMergeRecord(userId: string | undefined) {
  const raw = useSyncExternalStore(subscribe, rawRecord, () => null);
  return raw && userId ? readMergeRecord(userId) : undefined;
}

/** Non-identifying hint that this browser has used a guest cart. */
export function markCartUsed() {
  try {
    localStorage.setItem(USED, '1');
  } catch {
    // Badge falls back to signed-in reads only.
  }
}

export function cartUsed() {
  try {
    return localStorage.getItem(USED) === '1';
  } catch {
    return false;
  }
}

type MergeInput = { key: string; epoch: number };

/**
 * `POST /cart/merge-guest` after OTP login (J12). One stable key per login is
 * kept in sessionStorage before the request, so a lost response is retried
 * (here, bounded, or later from the cart page) with the same key and never
 * doubles quantities. Never called from an effect.
 */
export function useGuestCartMerge() {
  const { api, lifecycle } = useSession();
  const client = useQueryClient();
  const [running, setRunning] = useState(false);
  const mutation = useMutation({
    mutationFn: ({ key, epoch }: MergeInput) =>
      mergeGuestCart(api, key, () => lifecycle.assert(epoch)),
    retry: (count, error) => count < 2 && isTransient(error),
    gcTime: 0,
    networkMode: 'always',
  });

  /** Call BEFORE `signedIn()`, which clears the guest cart cache. */
  function needed() {
    const cached = client.getQueryData<Cart>(
      queryKeys.cart(null, lifecycle.snapshot()),
    );
    if (cached) return cached.lines.length > 0;
    return cartUsed();
  }

  /**
   * Merges into the signed-in account; resolves (never throws) when settled.
   * A login starts a new command (new key); `retry` replays the stored
   * pending key so a lost response can never merge twice.
   */
  async function merge(retry = false) {
    const session = client.getQueryData<Session>(queryKeys.session);
    if (!session) return;
    const epoch = lifecycle.snapshot();
    const stored = readMergeRecord(session.userId);
    const key =
      retry && stored?.review === null ? stored.key : crypto.randomUUID();
    writeMergeRecord({ userId: session.userId, key, review: null });
    setRunning(true);
    try {
      const result = await mutation.mutateAsync({ key, epoch });
      lifecycle.assert(epoch);
      client.setQueryData(
        queryKeys.cart(accountScope(session, epoch), epoch),
        result.cart,
      );
      if (result.review.length > 0)
        writeMergeRecord({
          userId: session.userId,
          key,
          review: result.review,
        });
      else clearMergeRecord();
    } catch (error) {
      // No guest cart (or already consumed): nothing to retry.
      if (failureCode(error) === 'CART_NOT_FOUND') clearMergeRecord();
    } finally {
      setRunning(false);
    }
  }

  return { needed, merge, running, error: mutation.error };
}
