'use client';

import { useEffect, useId, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  HydrationBoundary,
  useInfiniteQuery,
  useQueryClient,
  type DehydratedState,
} from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Card } from '@apnatown/ui/cards/Card';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
} from '@apnatown/ui/feedback/StateViews';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { Button } from '@apnatown/ui/primitives/Button';
import { useSession } from '../../../shared/auth/SessionProvider';
import { failureCode } from '../../../shared/api/result';
import { queryKeys } from '../../../shared/api/query-keys';
import { useAdmin } from '../AdminShell';
import { AdminFailure } from '../parts';
import {
  approvalsHref,
  readApprovalFilters,
  type ApprovalFilters,
} from './filters';
import { isApprovalDenied, statusKey, useApprovalError } from './parts';
import { QueueCardList } from './QueueCards';
import { ApprovalStatusFilter, ApprovalTypeTabs } from './QueueFilters';
import { QueueTable } from './QueueTable';
import { approvalQueueOptions } from './queries';

/** Hydrates the server-read first page only for the account and session
 * revision that rendered it; a late payload never fills a newer identity. */
export function ApprovalQueueScreen({
  initial,
  owner,
}: {
  initial: DehydratedState;
  owner?: string | undefined;
}) {
  const { state, epoch } = useSession();
  const current =
    state.kind === 'ready' && state.data.userId === owner && epoch === 0;
  return (
    <HydrationBoundary state={current ? initial : undefined}>
      <ApprovalQueue />
    </HydrationBoundary>
  );
}

/** S-ADMN-02 queue: type tabs + status filter in the URL, oldest first. */
function ApprovalQueue() {
  const context = useAdmin();
  const { me, scope, recheck } = context;
  const t = useTranslations('admin.approvals');
  const ts = useTranslations('admin.state');
  const message = useApprovalError();
  const client = useQueryClient();
  const router = useRouter();
  const params = useSearchParams();
  const paramString = params.toString();
  const filters = useMemo(() => {
    const search = new URLSearchParams(paramString);
    return readApprovalFilters((name) => search.get(name));
  }, [paramString]);
  const { type, status } = filters;
  const permitted = me.isSuper || me.permissions.approvals.includes('view');
  const [navigating, startTransition] = useTransition();
  const tabsId = useId();

  const list = useInfiniteQuery({
    ...approvalQueueOptions(context, type, status),
    enabled: permitted,
  });
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const unavailable = list.data?.pages[0]?.unavailable.includes(type) ?? false;
  const code = list.isError ? failureCode(list.error) : undefined;
  const denied = Boolean(code && isApprovalDenied(code));

  // A denial re-reads authority; protected rows never outlive lost access.
  useEffect(() => {
    if (denied) recheck();
    if (!permitted || denied)
      client.removeQueries({ queryKey: queryKeys.adminApprovalsRoot(scope) });
  }, [client, denied, permitted, recheck, scope]);

  function navigate(next: ApprovalFilters) {
    startTransition(() => router.push(approvalsHref(next), { scroll: false }));
  }

  let body;
  if (!permitted || denied) {
    body = (
      <NoPermissionState
        headingLevel="h2"
        title={ts('forbiddenTitle')}
        message={code ? message(code) : t('noPermission')}
        action={<Button onClick={recheck}>{ts('checkAgain')}</Button>}
      />
    );
  } else if (list.isPending) {
    body = <QueueSkeleton label={ts('loading')} />;
  } else if (code && !list.data) {
    body = (
      <ErrorState
        headingLevel="h2"
        title={t('loadErrorTitle')}
        message={message(code)}
        action={
          <Button loading={list.isFetching} onClick={() => void list.refetch()}>
            {ts('retry')}
          </Button>
        }
      />
    );
  } else if (unavailable) {
    body = (
      <EmptyState
        headingLevel="h2"
        icon="🛵"
        title={t('riderUnavailable.title')}
        message={t('riderUnavailable.message')}
        action={null}
      />
    );
  } else if (!items.length) {
    body =
      status === 'pending' ? (
        <EmptyState
          headingLevel="h2"
          icon="🎉"
          title={t('empty.caughtUpTitle')}
          message={t('empty.caughtUpMessage', { type: t(`types.${type}`) })}
          action={null}
        />
      ) : (
        <EmptyState
          headingLevel="h2"
          title={t('empty.filteredTitle')}
          message={t('empty.filteredMessage', {
            status: t(`status.${statusKey[status]}`),
          })}
          action={
            <Button
              variant="outline"
              onClick={() => navigate({ type, status: 'pending' })}
            >
              {t('empty.showPending')}
            </Button>
          }
        />
      );
  } else {
    body = (
      <div className="grid gap-3">
        {code && <AdminFailure code={code} />}
        <QueueTable items={items} filters={filters} />
        <QueueCardList items={items} filters={filters} />
        {list.isFetchNextPageError && (
          <AdminFailure
            code={failureCode(list.error)}
            busy={list.isFetchingNextPage}
            retry={() => void list.fetchNextPage()}
          />
        )}
        {list.hasNextPage && !list.isFetchNextPageError && (
          <Button
            variant="outline"
            className="justify-self-center"
            loading={list.isFetchingNextPage}
            onClick={() => void list.fetchNextPage()}
          >
            {t('loadMore')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <section className="grid min-w-0 gap-stack-gap">
      <h1 className="m-0 font-display text-h1 desktop:text-h1-desktop">
        {t('title')}
      </h1>
      <ApprovalTypeTabs
        id={tabsId}
        value={type}
        onChange={(next) => navigate({ type: next, status: 'pending' })}
      />
      <div
        role="tabpanel"
        id={`${tabsId}-panel`}
        aria-labelledby={`${tabsId}-tab-${type}`}
        aria-busy={navigating || (list.isFetching && !list.isFetchingNextPage)}
        className="grid min-w-0 gap-stack-gap"
      >
        {type !== 'rider' && (
          <ApprovalStatusFilter
            value={status}
            onChange={(next) => navigate({ type, status: next })}
          />
        )}
        {body}
      </div>
    </section>
  );
}

function QueueSkeleton({ label }: { label: string }) {
  return (
    <Card padded>
      <Skeleton label={label} />
    </Card>
  );
}
