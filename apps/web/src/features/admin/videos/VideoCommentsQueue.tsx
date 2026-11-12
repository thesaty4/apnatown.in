'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  VideoCommentStatusSchema,
  type VideoCommentStatus,
} from '@apnatown/shared';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
} from '@apnatown/ui/feedback/StateViews';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { Button } from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../../shared/api/result';
import { queryKeys } from '../../../shared/api/query-keys';
import { useAdmin } from '../AdminShell';
import { AdminFailure, adminErrorKey, isDenied } from '../parts';
import { VideoCommentModerationCard } from './VideoCommentModerationCard';
import { useVideoCommentDecision, videoCommentsOptions } from './comments-queries';

const statuses = ['pending', 'published', 'removed'] as const;
const statusLabels = {
  pending: 'comments.status.pending',
  published: 'comments.status.published',
  removed: 'comments.status.removed',
} as const;
const decisionRefreshCodes = new Set([
  'COMMENT_INVALID_TRANSITION',
  'COMMENT_VERSION_CONFLICT',
  'ENGAGEMENT_TARGET_NOT_FOUND',
]);

export function VideoCommentsQueue() {
  const context = useAdmin();
  const { me, scope, recheck } = context;
  const t = useTranslations('admin.videos');
  const te = useTranslations('admin.errors');
  const ts = useTranslations('admin.state');
  const pathname = usePathname();
  const params = useSearchParams();
  const parsedStatus = VideoCommentStatusSchema.safeParse(params.get('status'));
  const status = parsedStatus.success ? parsedStatus.data : 'pending';
  const client = useQueryClient();
  const permitted = me.isSuper || me.permissions.reviews.includes('view');
  const canEdit = me.isSuper || me.permissions.reviews.includes('edit');
  const list = useInfiniteQuery({
    ...videoCommentsOptions(context, status),
    enabled: permitted,
  });
  const decision = useVideoCommentDecision(context);
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const counts = list.data?.pages[0]?.counts;
  const listCode = list.isError ? failureCode(list.error) : undefined;
  const decisionCode = decision.mutation.isError
    ? failureCode(decision.mutation.error)
    : undefined;
  const denied = Boolean(listCode && isDenied(listCode));
  const deniedDecision = Boolean(decisionCode && isDenied(decisionCode));
  const [decisionTarget, setDecisionTarget] = useState<string>();

  useEffect(() => {
    if (denied) recheck();
    if (!permitted || denied) {
      client.removeQueries({
        queryKey: queryKeys.adminVideoCommentsRoot(scope),
      });
    }
  }, [client, denied, permitted, recheck, scope]);

  useEffect(() => {
    if (deniedDecision) {
      recheck();
      client.removeQueries({
        queryKey: queryKeys.adminVideoCommentsRoot(scope),
      });
    }
  }, [client, deniedDecision, recheck, scope]);

  useEffect(() => {
    if (decisionCode && decisionRefreshCodes.has(decisionCode))
      void client.invalidateQueries({
        queryKey: queryKeys.adminVideoCommentsRoot(scope),
      });
  }, [client, decisionCode, scope]);

  let content;
  if (!permitted || denied || deniedDecision) {
    content = (
      <NoPermissionState
        title={ts('forbiddenTitle')}
        message={
          decisionCode
            ? te(adminErrorKey(decisionCode))
            : listCode
              ? te(adminErrorKey(listCode))
              : ts('adminOnly')
        }
        action={<Button onClick={recheck}>{ts('checkAgain')}</Button>}
      />
    );
  } else if (list.isPending) {
    content = <Skeleton label={ts('loading')} />;
  } else if (listCode && items.length === 0) {
    content = (
      <ErrorState
        title={ts('errorTitle')}
        message={te(adminErrorKey(listCode))}
        action={
          <Button
            disabled={list.isFetching}
            onClick={() => void list.refetch()}
          >
            {te('retry')}
          </Button>
        }
      />
    );
  } else if (!items.length) {
    content = (
      <EmptyState
        title={t('empty.title')}
        message={t('empty.message')}
        action={null}
      />
    );
  } else {
    content = (
      <div
        className="grid gap-3"
        aria-busy={list.isFetching && !list.isFetchingNextPage}
      >
        {listCode && <AdminFailure code={listCode} />}
        {decisionCode &&
          (!decisionTarget || !items.some((item) => item.id === decisionTarget)) && (
            <AdminFailure code={decisionCode} />
          )}
        <ul className="m-0 grid list-none gap-3 p-0 tablet:grid-cols-2">
          {items.map((item) => (
            <li key={`${item.id}:${item.version}`}>
              <VideoCommentModerationCard
                item={item}
                canEdit={canEdit}
                busy={decision.mutation.isPending}
                error={
                  decisionTarget === item.id && decisionCode
                    ? te(adminErrorKey(decisionCode))
                    : undefined
                }
                onDecision={(body) => {
                  setDecisionTarget(item.id);
                  decision.submit(item.id, item.videoId, body, () =>
                    setDecisionTarget(undefined),
                  );
                }}
              />
            </li>
          ))}
        </ul>
        {list.isFetchNextPageError && (
          <AdminFailure
            code={failureCode(list.error)}
            busy={list.isFetchingNextPage}
            retry={() => void list.fetchNextPage()}
          />
        )}
        {list.hasNextPage && (
          <Button
            variant="outline"
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
    <section className="grid gap-4">
      <nav aria-label={t('comments.statusLabel')} className="flex flex-wrap gap-2">
        {statuses.map((value) => (
          <Link
            key={value}
            href={`${pathname}?content=comments&status=${value}`}
            scroll={false}
            aria-current={value === status ? 'page' : undefined}
            className={`inline-flex min-h-touch items-center gap-2 rounded-pill border-2 px-4 py-2 font-semibold whitespace-normal [overflow-wrap:anywhere] focus-visible:ring-focus ${
              value === status
                ? 'border-primary bg-primary-soft text-primary'
                : 'border-border bg-surface text-text-2'
            }`}
          >
            <span>{t(statusLabels[value])}</span>
            <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-caption">
              {counts?.[value] ?? '—'}
            </span>
          </Link>
        ))}
      </nav>
      {decisionCode && !items.length && (
        <AdminFailure code={decisionCode} />
      )}
      {content}
    </section>
  );
}
