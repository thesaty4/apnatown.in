'use client';

import type { ReactNode } from 'react';
import {
  HydrationBoundary,
  useQuery,
  type DehydratedState,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { EmptyState } from '@apnatown/ui/feedback/StateViews';
import { Button } from '@apnatown/ui/primitives/Button';
import { useSession } from '../../shared/auth/SessionProvider';
import { AccessState, Failure } from '../../shared/auth/AccessState';
import { failureCode } from '../../shared/api/result';
import type { BrowserApi } from '../../shared/api/browser';
import { accountScope, type AccountScope } from '../../shared/api/query-keys';
import type { PrivateLifecycle } from '../../shared/api/private-lifecycle';

type Props<T> = {
  initial: DehydratedState;
  owner?: string | undefined;
  options: (
    api: BrowserApi,
    scope: AccountScope,
    lifecycle: PrivateLifecycle,
  ) => UseQueryOptions<T>;
  children: (data: T) => ReactNode;
};

/** Session revision remounts drafts. A late RSC payload from the old authority
 * cannot hydrate a cache after logout, account change, or revocation. */
export function OwnResource<T>({
  initial,
  owner,
  options,
  children,
}: Props<T>) {
  const { state, epoch, api, lifecycle } = useSession();
  if (state.kind !== 'ready') return <AccessState />;
  return (
    <HydrationBoundary
      state={state.data.userId === owner && epoch === 0 ? initial : undefined}
    >
      <ResourceBody
        key={`${state.data.userId}:${epoch}`}
        options={options(api, accountScope(state.data, epoch), lifecycle)}
      >
        {children}
      </ResourceBody>
    </HydrationBoundary>
  );
}

function ResourceBody<T>({
  options,
  children,
}: {
  options: UseQueryOptions<T>;
  children: (data: T) => ReactNode;
}) {
  const query = useQuery(options);
  const t = useTranslations('account.common');
  if (query.isPending) return <Skeleton label={t('loading')} />;
  const retry = () => {
    void query.refetch();
  };
  if (query.isError) {
    const code = failureCode(query.error);
    return code === 'USER_NOT_FOUND' ? (
      <EmptyState
        title={t('emptyTitle')}
        message={t('emptyMessage')}
        action={<Button onClick={retry}>{t('retry')}</Button>}
      />
    ) : (
      <Failure code={code} retry={retry} retryDisabled={query.isFetching} />
    );
  }
  return children(query.data);
}
