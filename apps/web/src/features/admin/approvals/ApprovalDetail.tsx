'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  HydrationBoundary,
  useInfiniteQuery,
  useQueryClient,
  type DehydratedState,
} from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { AdminBusinessApprovalType } from '@apnatown/shared/admin';
import { Card } from '@apnatown/ui/cards/Card';
import {
  ErrorState,
  NoPermissionState,
  NotFoundState,
} from '@apnatown/ui/feedback/StateViews';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { Button, buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { useSession } from '../../../shared/auth/SessionProvider';
import { failureCode } from '../../../shared/api/result';
import { queryKeys } from '../../../shared/api/query-keys';
import { useAdmin } from '../AdminShell';
import { Alert } from '../parts';
import { ApplicantFacts } from './ApplicantFacts';
import { ApprovalDocumentViewer } from './ApprovalDocumentViewer';
import { ApprovalHistory } from './ApprovalHistory';
import { DecisionPanel } from './DecisionPanel';
import { approvalsHref, readApprovalFilters } from './filters';
import {
  ApprovalStatusBadge,
  isApprovalDenied,
  useApplicationName,
  useApprovalError,
} from './parts';
import { approvalDetailOptions, useApprovalDecision } from './queries';

export function ApprovalDetailScreen({
  type,
  id,
  initial,
  owner,
}: {
  type: AdminBusinessApprovalType;
  id: string;
  initial: DehydratedState;
  owner?: string | undefined;
}) {
  const { state, epoch } = useSession();
  const current =
    state.kind === 'ready' && state.data.userId === owner && epoch === 0;
  return (
    <HydrationBoundary state={current ? initial : undefined}>
      {/* A new item is a fresh review: no dialog, reason or error carries over. */}
      <ApprovalDetail key={`${type}:${id}`} type={type} id={id} />
    </HydrationBoundary>
  );
}

function ApprovalDetail({
  type,
  id,
}: {
  type: AdminBusinessApprovalType;
  id: string;
}) {
  const context = useAdmin();
  const { me, scope, recheck } = context;
  const t = useTranslations('admin.approvals');
  const ts = useTranslations('admin.state');
  const message = useApprovalError();
  const name = useApplicationName();
  const client = useQueryClient();
  const params = useSearchParams();
  const listStatus = readApprovalFilters((key) => params.get(key)).status;
  const backHref = approvalsHref({ type, status: listStatus });
  const permitted = me.isSuper || me.permissions.approvals.includes('view');

  const detail = useInfiniteQuery({
    ...approvalDetailOptions(context, type, id),
    enabled: permitted,
  });
  const decision = useApprovalDecision(context);
  const readCode = detail.isError ? failureCode(detail.error) : undefined;
  const writeCode = decision.mutation.isError
    ? failureCode(decision.mutation.error)
    : undefined;
  const denied = [readCode, writeCode].some(
    (code) => code !== undefined && isApprovalDenied(code),
  );

  useEffect(() => {
    if (denied) recheck();
    if (!permitted || denied)
      client.removeQueries({ queryKey: queryKeys.adminApprovalsRoot(scope) });
  }, [client, denied, permitted, recheck, scope]);

  const back = (
    <Link
      href={backHref}
      className="justify-self-start text-small font-semibold text-primary underline-offset-2 hover:underline focus-visible:ring-focus"
    >
      <span aria-hidden="true">‹ </span>
      {t('back')}
    </Link>
  );

  const application = detail.data?.pages[0]?.detail.application;
  let content;
  if (!permitted || denied) {
    const code = readCode ?? writeCode;
    content = (
      <NoPermissionState
        headingLevel="h1"
        title={ts('forbiddenTitle')}
        message={code ? message(code) : t('noPermission')}
        action={<Button onClick={recheck}>{ts('checkAgain')}</Button>}
      />
    );
  } else if (detail.isPending) {
    content = (
      <Card padded>
        <Skeleton label={ts('loading')} />
      </Card>
    );
  } else if (!application) {
    const code = readCode ?? 'COMMON_INTERNAL';
    content =
      code === 'BUSINESS_NOT_FOUND' ? (
        <NotFoundState
          headingLevel="h1"
          title={t('notFoundTitle')}
          message={message(code)}
          action={
            <Link href={backHref} className={buttonVariantClassName('primary')}>
              {t('back')}
            </Link>
          }
        />
      ) : (
        <ErrorState
          headingLevel="h1"
          title={t('detailErrorTitle')}
          message={message(code)}
          action={
            <Button
              loading={detail.isFetching}
              onClick={() => void detail.refetch()}
            >
              {ts('retry')}
            </Button>
          }
        />
      );
  } else {
    const history =
      detail.data?.pages.flatMap((page) => page.detail.history.items) ?? [];
    content = (
      <>
        <header className="flex flex-wrap items-center gap-3">
          <h1 className="m-0 min-w-0 font-display text-h2 [overflow-wrap:anywhere] desktop:text-h1">
            {name(application)}
          </h1>
          <ApprovalStatusBadge status={application.status} />
        </header>
        {readCode && (
          <Alert
            message={message(readCode)}
            action={
              <Button
                variant="outline"
                loading={detail.isFetching}
                onClick={() => void detail.refetch()}
              >
                {ts('retry')}
              </Button>
            }
          />
        )}
        <div className="grid min-w-0 gap-stack-gap desktop:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] desktop:items-start">
          <div className="grid min-w-0 gap-stack-gap">
            <ApprovalDocumentViewer id={application.id} />
            <ApplicantFacts type={type} application={application} />
          </div>
          <div className="grid min-w-0 gap-stack-gap">
            <DecisionPanel
              type={type}
              application={application}
              decision={decision}
              writeCode={writeCode}
              reload={() => void detail.refetch()}
            />
            <ApprovalHistory
              items={history}
              hasMore={detail.hasNextPage}
              loadingMore={detail.isFetchingNextPage}
              moreFailed={detail.isFetchNextPageError}
              loadMore={() => void detail.fetchNextPage()}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <section
      className="grid min-w-0 gap-stack-gap max-desktop:pb-28"
      aria-busy={detail.isFetching && !detail.isFetchingNextPage}
    >
      {back}
      {content}
    </section>
  );
}
