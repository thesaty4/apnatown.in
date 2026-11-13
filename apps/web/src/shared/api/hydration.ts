import { dehydrate, type QueryKey } from '@tanstack/react-query';
import { createQueryClient } from './query-client';
import { ApiFailure, type Resource } from './result';

/** Called by RSCs with their request-local, no-store typed read. No second HTTP
 * request: the already-read result is prefetched under the client's exact key.
 * Only these account projections are serialized, never CSRF/OTP/documents. */
export async function hydrateResource<T>(key: QueryKey, result: Resource<T>) {
  const client = createQueryClient();
  await client.prefetchQuery({
    queryKey: key,
    queryFn: () => {
      if (result.kind === 'error') throw new ApiFailure(result.code);
      return result.data;
    },
  });
  const state = dehydrate(client, { shouldDehydrateQuery: () => true });
  // Error objects cannot cross the RSC boundary. Keep only safe normalized data.
  for (const query of state.queries) {
    if (query.state.error instanceof ApiFailure) {
      const error = { ...query.state.error };
      query.state.error = error as ApiFailure;
      query.state.fetchFailureReason = error as ApiFailure;
    }
  }
  client.clear();
  return state;
}
