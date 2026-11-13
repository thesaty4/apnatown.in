'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import {
  ErrorState,
  NoPermissionState,
  OfflineState,
} from '@apnatown/ui/feedback/StateViews';
import { Button } from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../shared/api/result';
import { useOnline } from '../../shared/hooks/use-online';
import { deniedCodes, errorKey } from './parts';

/**
 * Shared owner-dashboard read states (loading, offline, no permission,
 * error + retry) for a screen-level query; renders `children` with data.
 */
/** The parts of a (possibly infinite) React Query result this view needs. */
export type ReadState<T> = {
  data: T | undefined;
  isPending: boolean;
  isFetching: boolean;
  fetchStatus: string;
  error: unknown;
  refetch: () => Promise<unknown>;
};

export function OwnerQueryState<T>({
  query,
  loadingLabel,
  errorTitle,
  children,
}: {
  query: ReadState<T>;
  loadingLabel: string;
  errorTitle: string;
  children: (data: T) => ReactNode;
}) {
  const common = useTranslations('business.common');
  const te = useTranslations('business.errors');
  const online = useOnline();
  if (query.data !== undefined) return children(query.data);
  if (query.isPending && (!online || query.fetchStatus === 'paused'))
    return (
      <OfflineState
        headingLevel="h2"
        title={common('offlineTitle')}
        message={common('offlineMessage')}
        action={null}
      />
    );
  if (query.isPending) return <Skeleton label={loadingLabel} />;
  const code = failureCode(query.error);
  if (deniedCodes.has(code))
    return (
      <NoPermissionState
        title={common('forbiddenTitle')}
        message={common('forbiddenMessage')}
        action={null}
      />
    );
  return (
    <ErrorState
      headingLevel="h2"
      title={errorTitle}
      message={te(errorKey(code))}
      action={
        <Button
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          {common('retry')}
        </Button>
      }
    />
  );
}
