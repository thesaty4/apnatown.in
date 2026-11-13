import { queryOptions } from '@tanstack/react-query';
import {
  PlatformHealthSchema,
  PublicSettingsSchema,
  SupportMessageAcceptedSchema,
} from '@apnatown/shared/settings';
import type { BrowserApi } from '../../shared/api/browser';
import { normalizeFailure, unwrap } from '../../shared/api/result';
import { queryKeys } from '../../shared/api/query-keys';

async function guarded<T>(read: () => Promise<T>, signal: AbortSignal) {
  try {
    const data = await read();
    signal.throwIfAborted();
    return data;
  } catch (error) {
    signal.throwIfAborted();
    throw normalizeFailure(error);
  }
}

/** Public safe projection (configured support contacts, flags). The API marks
 * it no-store, so a short client stale time only avoids refetch storms. */
export function publicSettingsOptions(api: Pick<BrowserApi, 'GET'>) {
  return queryOptions({
    queryKey: queryKeys.publicSettings,
    staleTime: 60_000,
    queryFn: ({ signal }) =>
      guarded(
        async () =>
          unwrap(
            await api.GET('/settings/public', { signal }),
            PublicSettingsSchema,
          ),
        signal,
      ),
  });
}

/** No-store health probe used only by an explicit "Check again". */
export function healthOptions(api: Pick<BrowserApi, 'GET'>) {
  return queryOptions({
    queryKey: queryKeys.health,
    enabled: false,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    queryFn: ({ signal }) =>
      guarded(
        async () =>
          unwrap(await api.GET('/health', { signal }), PlatformHealthSchema),
        signal,
      ),
  });
}

/** Message-only intake; the caller keeps one key per message for replay. */
export async function sendSupportMessage(
  api: BrowserApi,
  { message, key }: { message: string; key: string },
) {
  const header = { ...(await api.mutationHeaders()), 'Idempotency-Key': key };
  try {
    return unwrap(
      await api.POST('/support/messages', {
        params: { header },
        body: { message },
      }),
      SupportMessageAcceptedSchema,
    );
  } catch (error) {
    throw normalizeFailure(error);
  }
}

/** Configured E.164 → user-initiated links; never an arbitrary URL. */
export const callHref = (e164: string) => `tel:${e164}`;
export const whatsappHref = (e164: string) =>
  `https://wa.me/${e164.replace(/\D/g, '')}`;
