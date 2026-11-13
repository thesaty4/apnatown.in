import {
  ConsentListSchema,
  ConsentRecordSchema,
  type ConsentChannel,
  type ConsentPurpose,
} from '@apnatown/shared/users';
import type { BrowserApi } from '../../shared/api/browser';
import { unwrap } from '../../shared/api/result';
import { privateQueryOptions } from '../../shared/api/private-query';
import { queryKeys, type AccountScope } from '../../shared/api/query-keys';
import type { PrivateLifecycle } from '../../shared/api/private-lifecycle';

export type ConsentChange = {
  purpose: ConsentPurpose;
  channel: ConsentChannel;
  granted: boolean;
  /** The notice shown when the user chose; required only for a grant. */
  noticeVersion: string | null;
};

type Reader = Pick<BrowserApi, 'GET'>;
export async function getConsents(api: Reader, signal?: AbortSignal) {
  return unwrap(
    await api.GET('/users/me/consents', { ...(signal && { signal }) }),
    ConsentListSchema,
  );
}

export function consentsOptions(
  api: BrowserApi,
  scope: AccountScope,
  lifecycle: PrivateLifecycle,
) {
  return privateQueryOptions(
    queryKeys.consents(scope),
    scope.epoch,
    lifecycle,
    (signal) => getConsents(api, signal),
  );
}

/** CSRF/Origin from the session transport. Withdrawals never carry a notice. */
export async function saveConsent(
  api: BrowserApi,
  { purpose, channel, granted, noticeVersion }: ConsentChange,
  assertCurrent: () => void,
) {
  const header = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.PUT('/users/me/consents/{purpose}', {
      params: { header, path: { purpose } },
      body: {
        channel,
        granted,
        ...(granted && noticeVersion !== null && { noticeVersion }),
      },
    }),
    ConsentRecordSchema,
  );
}
