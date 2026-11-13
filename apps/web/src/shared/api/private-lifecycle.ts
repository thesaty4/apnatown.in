import type { QueryClient } from '@tanstack/react-query';
import { ApiFailure } from './result';
import { queryKeys, accountScope, type Session } from './query-keys';

/** Security revision only, not a second server-state store. All data is in Query. */
export class PrivateLifecycle {
  private epoch = 0;
  private listeners = new Set<() => void>();
  constructor(
    private client: QueryClient,
    private resetTransport: () => void,
  ) {}
  snapshot = () => this.epoch;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  assert = (epoch: number) => {
    if (this.epoch !== epoch) throw new ApiFailure('SESSION_CHANGED');
  };
  advance(includeSession = true) {
    ++this.epoch; // Fence callbacks before cancellation, clearing or notification.
    this.resetTransport();
    void this.client.cancelQueries(
      includeSession ? {} : { queryKey: queryKeys.private },
    );
    this.client.removeQueries({ queryKey: queryKeys.private });
    this.client.getMutationCache().clear();
    this.listeners.forEach((listener) => listener());
  }
  expire(code: string) {
    this.advance();
    this.client
      .getQueryCache()
      .find({ queryKey: queryKeys.session })
      ?.setState({
        data: undefined,
        error: new ApiFailure(code),
        status: 'error',
        fetchStatus: 'idle',
      });
  }
  accept(next: Session) {
    const previous = this.client.getQueryData<Session>(queryKeys.session);
    if (
      previous &&
      JSON.stringify(accountScope(previous, 0)) !==
        JSON.stringify(accountScope(next, 0))
    )
      this.advance(false);
  }
}
