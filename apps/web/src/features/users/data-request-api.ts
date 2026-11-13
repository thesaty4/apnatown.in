import { queryOptions } from '@tanstack/react-query';
import {
  DataExportSchema,
  DataRequestAcceptedSchema,
  DataRequestCompletionSchema,
  DataRequestSchema,
  type DataRequestStatus,
  type DataRequestType,
} from '@apnatown/shared/users';
import type { BrowserApi } from '../../shared/api/browser';
import { normalizeFailure, unwrap } from '../../shared/api/result';
import { privateQueryOptions } from '../../shared/api/private-query';
import { queryKeys, type AccountScope } from '../../shared/api/query-keys';
import type { PrivateLifecycle } from '../../shared/api/private-lifecycle';

/** Status polling: the server owns progress; the client never guesses a time. */
const POLL_MS = 4_000;
export const isSettled = (status: DataRequestStatus | undefined) =>
  status === 'blocked' || status === 'completed' || status === 'failed';
const poll = (status: DataRequestStatus | undefined) =>
  status === undefined || isSettled(status) ? false : POLL_MS;

/** CSRF/Origin from the session transport; the caller owns the command key. */
export async function createDataRequest(
  api: BrowserApi,
  type: DataRequestType,
  key: string,
  assertCurrent: () => void,
) {
  const header = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.POST('/users/me/data-requests', {
      params: { header: { ...header, 'Idempotency-Key': key } },
      body: type === 'delete' ? { type, confirmed: true } : { type },
    }),
    DataRequestAcceptedSchema,
  );
}

/** Owner-scoped status, polled while queued/processing; stops when settled. */
export function dataRequestOptions(
  api: BrowserApi,
  scope: AccountScope,
  lifecycle: PrivateLifecycle,
  requestId: string,
) {
  return queryOptions({
    ...privateQueryOptions(
      queryKeys.dataRequest(scope, requestId),
      scope.epoch,
      lifecycle,
      async (signal) =>
        unwrap(
          await api.GET('/users/me/data-requests/{requestId}', {
            params: { path: { requestId } },
            signal,
          }),
          DataRequestSchema,
        ),
    ),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchInterval: (query) => poll(query.state.data?.status),
  });
}

/** The private export document is memory-only while its sheet is open. */
export function dataExportOptions(
  api: BrowserApi,
  scope: AccountScope,
  lifecycle: PrivateLifecycle,
  requestId: string,
) {
  return queryOptions({
    ...privateQueryOptions(
      queryKeys.dataExport(scope, requestId),
      scope.epoch,
      lifecycle,
      async (signal) =>
        unwrap(
          await api.GET('/users/me/data-requests/{requestId}/export', {
            params: { path: { requestId } },
            signal,
          }),
          DataExportSchema,
        ),
    ),
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

/** Deletion status after session revocation. The capability is only sent as a
 * bearer header from flow memory; it never enters the key, URL or storage. */
export function deletionCompletionOptions(
  api: BrowserApi,
  requestId: string,
  token: string,
) {
  return queryOptions({
    queryKey: queryKeys.deletionCompletion(requestId),
    queryFn: async ({ signal }) => {
      try {
        return unwrap(
          await api.GET('/users/data-requests/{requestId}/completion', {
            params: {
              path: { requestId },
              header: { Authorization: `Bearer ${token}` },
            },
            signal,
          }),
          DataRequestCompletionSchema,
        );
      } catch (error) {
        signal.throwIfAborted();
        throw normalizeFailure(error);
      }
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchInterval: (query) => poll(query.state.data?.status),
  });
}
