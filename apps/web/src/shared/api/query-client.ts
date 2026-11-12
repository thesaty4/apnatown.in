import { QueryClient } from '@tanstack/react-query';

/** A caller-owned client: never a module-global SSR cache or persisted cache. */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // SSR data stays fresh on hydration. Focus/reconnect checks are reads
        // only; session validation overrides focus to always check authority.
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: false,
        retryOnMount: false,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: false,
        gcTime: 0,
        // Fail offline now; never queue an OTP, logout or private write.
        networkMode: 'always',
      },
    },
  });
}
