'use client';

import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ApiFailure, normalizeFailure } from './result';
import type { PrivateLifecycle } from './private-lifecycle';

/** Variables never enter the mutation cache. The transient input is consumed by
 * mutationFn and released after settlement; the hook owns pending/error state.
 * A revision AND mounted check protect callbacks even if transport ignores abort. */
export function usePrivateMutation<Input, Output>(
  lifecycle: PrivateLifecycle,
  operation: (input: Input, assertCurrent: () => void) => Promise<Output>,
) {
  // Bind to the rendered authority, not the authority at click time: an event
  // from an old form must never be rebound while React is scheduling its removal.
  const renderedEpoch = lifecycle.snapshot();
  const input = useRef<{ value: Input; epoch: number } | undefined>(undefined);
  const locked = useRef(false);
  const mounted = useRef(true);
  const mutation = useMutation({
    mutationFn: async () => {
      const request = input.current;
      input.current = undefined;
      if (!request) throw new ApiFailure('SESSION_CHANGED');
      const assertCurrent = () => {
        lifecycle.assert(request.epoch);
        if (!mounted.current) throw new ApiFailure('SESSION_CHANGED');
      };
      assertCurrent();
      try {
        const result = await operation(request.value, assertCurrent);
        assertCurrent();
        return result;
      } catch (error) {
        throw normalizeFailure(error);
      }
    },
    retry: false,
    gcTime: 0,
    networkMode: 'always',
  });
  const { reset } = mutation;
  useEffect(() => {
    mounted.current = true;
    const unsubscribe = lifecycle.subscribe(() => {
      input.current = undefined;
      reset();
    });
    return () => {
      mounted.current = false;
      input.current = undefined;
      reset();
      unsubscribe();
    };
  }, [lifecycle, reset]);
  return {
    ...mutation,
    async run(
      value: Input,
      onSuccess?: (output: Output) => void | Promise<void>,
    ) {
      if (locked.current) return;
      locked.current = true;
      const epoch = renderedEpoch;
      input.current = { value, epoch };
      try {
        const result = await mutation.mutateAsync();
        lifecycle.assert(epoch);
        if (mounted.current) await onSuccess?.(result);
      } catch {
        // React Query owns the normalized error. Superseded flows have no callback.
      } finally {
        input.current = undefined;
        locked.current = false;
        // Results needed by the active flow (e.g. a challenge) remain until reset.
      }
    },
  };
}
