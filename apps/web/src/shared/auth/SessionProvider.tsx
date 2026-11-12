'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createBrowserApi, type BrowserApi } from '../api/browser';
import { failureCode, resource, type Resource } from '../api/result';
import { PrivateLifecycle } from '../api/private-lifecycle';
import { usePrivateMutation } from '../api/use-private-mutation';
import { queryKeys, type Session } from '../api/query-keys';
import { postLogout, sessionOptions } from './api';

type AuthContext = {
  state: Resource<Session> | { kind: 'loading' };
  epoch: number;
  api: BrowserApi;
  lifecycle: PrivateLifecycle;
  refresh: () => Promise<Resource<Session>>;
  signedIn: () => Promise<void>;
  broadcast: () => void;
};
const Context = createContext<AuthContext | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const [{ api, lifecycle }] = useState(() => {
    const api = createBrowserApi((code) => {
      if (['SESSION_EXPIRED', 'ACCOUNT_UNAVAILABLE'].includes(code))
        lifecycle.expire(code);
    });
    const lifecycle = new PrivateLifecycle(client, () => api.reset());
    return { api, lifecycle };
  });
  const epoch = useSyncExternalStore(
    lifecycle.subscribe,
    lifecycle.snapshot,
    () => 0,
  );
  const query = useQuery(sessionOptions(api, lifecycle));
  const state: AuthContext['state'] = query.isError
    ? { kind: 'error', code: failureCode(query.error) }
    : query.data
      ? { kind: 'ready', data: query.data }
      : { kind: 'loading' };
  const channel = useRef<BroadcastChannel | null>(null);
  const broadcast = () => channel.current?.postMessage('changed');
  const refresh = () =>
    resource(async () => {
      await client.invalidateQueries({
        queryKey: queryKeys.session,
        refetchType: 'none',
      });
      return client.fetchQuery(sessionOptions(api, lifecycle));
    });
  async function signedIn() {
    lifecycle.expire('SESSION_CHANGED');
    broadcast();
    // CSRF rotation is internal to the transport; bootstrap on the next write.
    await refresh();
  }
  useEffect(() => {
    const changed = () => {
      lifecycle.expire('SESSION_CHANGED');
      void client.fetchQuery(sessionOptions(api, lifecycle)).catch(() => {});
    };
    if ('BroadcastChannel' in window) {
      channel.current = new BroadcastChannel('apnatown-session');
      channel.current.onmessage = changed; // Signal only, never a supplied principal.
    }
    const restored = (event: PageTransitionEvent) => {
      if (event.persisted) changed();
    };
    window.addEventListener('pageshow', restored);
    return () => {
      channel.current?.close();
      window.removeEventListener('pageshow', restored);
      lifecycle.advance();
    };
  }, [api, client, lifecycle]);
  const expiresAt = state.kind === 'ready' ? state.data.expiresAt : undefined;
  useEffect(() => {
    if (!expiresAt) return;
    const wait = Math.min(
      2_147_000_000,
      Math.max(0, Date.parse(expiresAt) - Date.now()),
    );
    const timer = setTimeout(() => {
      lifecycle.expire('SESSION_EXPIRED');
      void client.fetchQuery(sessionOptions(api, lifecycle)).catch(() => {});
    }, wait);
    return () => clearTimeout(timer);
  }, [expiresAt, api, client, lifecycle]);
  return (
    <Context.Provider
      value={{ state, epoch, api, lifecycle, refresh, signedIn, broadcast }}
    >
      {children}
    </Context.Provider>
  );
}

export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error('SessionProvider required');
  return value;
}

export function useLogout() {
  const { api, lifecycle } = useSession();
  return usePrivateMutation(lifecycle, async (_: void, assertCurrent) => {
    await postLogout(api, assertCurrent);
    assertCurrent();
  });
}
