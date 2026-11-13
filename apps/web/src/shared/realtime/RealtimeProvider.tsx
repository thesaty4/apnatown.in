'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import type { RealtimeSignalKind } from '@apnatown/shared/realtime';
import { queryKeys } from '../api/query-keys';
import { useSession } from '../auth/SessionProvider';
import {
  RealtimeConnection,
  type RealtimeListener,
} from './realtime-connection';

type Subscribe = (listener: RealtimeListener) => () => void;
const noop: Subscribe = () => () => {};
const Context = createContext<Subscribe>(noop);

/**
 * One SSE stream per tab for the signed-in account, reopened on every
 * account/epoch change and closed for guests or on logout. Features never
 * open their own stream; they subscribe through `useRealtimeInvalidation`.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { state, epoch } = useSession();
  const client = useQueryClient();
  const userId = state.kind === 'ready' ? state.data.userId : null;
  const [subscribe, setSubscribe] = useState<Subscribe>(() => noop);
  useEffect(() => {
    if (!userId) return;
    const connection = new RealtimeConnection((reason) => {
      // Server-side revalidation failed: let the session read decide.
      if (reason === 'expired')
        void client.invalidateQueries({ queryKey: queryKeys.session });
    });
    connection.start();
    setSubscribe(() => connection.subscribe.bind(connection));
    return () => {
      connection.stop();
      setSubscribe(() => noop);
    };
  }, [client, userId, epoch]);
  return <Context.Provider value={subscribe}>{children}</Context.Provider>;
}

/**
 * Marks `keys` stale (active queries refetch) when a matching hint arrives
 * and on every (re)connect `ready`, which closes any gap while offline.
 * Hints carry no data: the authorized REST reads stay the source of truth,
 * and existing polling/focus refetch remains the fallback. `keys` must be
 * JSON-serializable (account-scoped query keys are).
 */
export function useRealtimeInvalidation(
  topics: readonly RealtimeSignalKind[],
  keys: readonly QueryKey[] | null,
) {
  const subscribe = useContext(Context);
  const client = useQueryClient();
  const topicList = topics.join(',');
  const serialized = keys ? JSON.stringify(keys) : null;
  useEffect(() => {
    if (!serialized) return;
    const wanted = new Set(topicList.split(','));
    const targets = JSON.parse(serialized) as QueryKey[];
    return subscribe((event) => {
      if (event.event !== 'ready' && !wanted.has(event.event)) return;
      for (const queryKey of targets)
        void client.invalidateQueries({ queryKey });
    });
  }, [subscribe, client, topicList, serialized]);
}

/** Raw stream events for UI reactions (e.g. a toast); data stays in REST. */
export function useRealtimeEvents(listener: RealtimeListener) {
  const subscribe = useContext(Context);
  const latest = useRef(listener);
  useEffect(() => {
    latest.current = listener;
  });
  useEffect(() => subscribe((event) => latest.current(event)), [subscribe]);
}
