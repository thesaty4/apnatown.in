'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import {
  VideoCommentCreateSchema,
  type VideoCommentPublicItem,
  type VideoCommentStatus,
} from '@apnatown/shared';
import { Card } from '@apnatown/ui/cards/Card';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
} from '@apnatown/ui/feedback/StateViews';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { StatusBadge, type BadgeTone } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { failureCode } from '../../shared/api/result';
import { AccessState } from '../../shared/auth/AccessState';
import { useSession } from '../../shared/auth/SessionProvider';
import { useVideoCommentActions, useVideoComments } from './queries';

const statusPresentation: Record<
  VideoCommentStatus,
  { icon: string; tone: BadgeTone }
> = {
  pending: { icon: '⏳', tone: 'ap-pending' },
  published: { icon: '✓', tone: 'ap-approved' },
  removed: { icon: '⊘', tone: 'ap-rejected' },
};
const statusLabels = {
  pending: 'status.pending',
  published: 'status.published',
  removed: 'status.removed',
} as const;

function CommentStatus({ comment }: { comment: VideoCommentPublicItem }) {
  const t = useTranslations('engagement.comments');
  const presentation = statusPresentation[comment.status];
  return (
    <StatusBadge
      tone={presentation.tone}
      icon={presentation.icon}
      label={t(statusLabels[comment.status])}
    />
  );
}

function CommentItem({
  comment,
  busy,
  error,
  onDelete,
}: {
  comment: VideoCommentPublicItem;
  busy: boolean;
  error?: string | undefined;
  onDelete: () => void;
}) {
  const t = useTranslations('engagement.comments');
  return (
    <li>
      <Card padded className="grid gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="m-0 min-w-0 font-semibold [overflow-wrap:anywhere]">
            {comment.authorLabel}
          </p>
          <CommentStatus comment={comment} />
        </div>
        <p className="m-0 whitespace-pre-wrap [overflow-wrap:anywhere]">
          {comment.text}
        </p>
        {comment.canDelete && (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              disabled={busy}
              onClick={onDelete}
            >
              {t('remove')}
            </Button>
            {error && (
              <p role="alert" className="m-0 text-error [overflow-wrap:anywhere]">
                {error}
              </p>
            )}
          </div>
        )}
      </Card>
    </li>
  );
}

export function CommentsPanel({ videoId }: { videoId: string }) {
  const t = useTranslations('engagement.comments');
  const { state } = useSession();
  const { query } = useVideoComments(videoId);
  const actions = useVideoCommentActions(videoId);
  const [text, setText] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [posted, setPosted] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string>();
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const listCode = query.isError ? failureCode(query.error) : undefined;
  const createCode = actions.create.isError
    ? failureCode(actions.create.error)
    : undefined;
  const deleteCode = actions.remove.isError
    ? failureCode(actions.remove.error)
    : undefined;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = VideoCommentCreateSchema.safeParse({ text });
    if (!parsed.success) {
      setInvalid(true);
      setPosted(false);
      return;
    }
    setInvalid(false);
    setPosted(false);
    actions.submit(parsed.data, () => {
      setText('');
      setPosted(true);
    });
  }

  function deleteComment(commentId: string) {
    setDeleteTarget(commentId);
    actions.delete(commentId, () => setDeleteTarget(undefined));
  }

  const canComment =
    state.kind === 'ready' && state.data.roles.includes('customer');
  const createError =
    createCode === 'COMMON_RATE_LIMITED'
      ? t('rateLimited')
      : createCode && t('failed');
  const deleteError = deleteCode && t('deleteFailed');

  return (
    <section aria-labelledby="video-comments-heading" className="grid gap-4">
      <h2 id="video-comments-heading" className="m-0 text-h3">
        {t('title')}
      </h2>
      {canComment ? (
        <Card padded className="grid gap-3">
          <form onSubmit={submit} className="grid gap-3">
            <TextArea
              label={t('addLabel')}
              hint={t('moderationHint')}
              value={text}
              maxLength={500}
              required
              error={invalid ? t('validation') : undefined}
              onChange={(event) => {
                setText(event.currentTarget.value);
                setInvalid(false);
              }}
            />
            {createError && (
              <p role="alert" className="m-0 text-error [overflow-wrap:anywhere]">
                {createError}
              </p>
            )}
            {posted && (
              <p role="status" className="m-0 text-text-2 [overflow-wrap:anywhere]">
                {t('sent')}
              </p>
            )}
            <div className="flex flex-wrap justify-end">
              <Button type="submit" loading={actions.create.isPending}>
                {t(actions.create.isPending ? 'posting' : 'post')}
              </Button>
            </div>
          </form>
        </Card>
      ) : state.kind === 'ready' ? (
        <NoPermissionState
          title={t('restrictedTitle')}
          message={t('restrictedMessage')}
          action={null}
        />
      ) : (
        <AccessState guest guestMessage={t('loginPrompt')} />
      )}
      {query.isPending ? (
        <Skeleton label={t('loading')} />
      ) : listCode && items.length === 0 ? (
        <ErrorState
          title={t('errorTitle')}
          message={t('loadFailed')}
          action={
            <Button
              variant="outline"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              {t('retry')}
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState title={t('emptyTitle')} message={t('empty')} action={null} />
      ) : (
        <div className="grid gap-3" aria-busy={query.isFetching}>
          {listCode && (
            <ErrorState
              title={t('errorTitle')}
              message={t('loadFailed')}
              action={
                <Button
                  variant="outline"
                  disabled={query.isFetching}
                  onClick={() => void query.refetch()}
                >
                  {t('retry')}
                </Button>
              }
            />
          )}
          <ul className="m-0 grid list-none gap-3 p-0">
            {items.map((comment) => (
              <CommentItem
                key={`${comment.id}:${comment.version}`}
                comment={comment}
                busy={actions.remove.isPending}
                error={
                  deleteTarget === comment.id && deleteError
                    ? deleteError
                    : undefined
                }
                onDelete={() => deleteComment(comment.id)}
              />
            ))}
          </ul>
          {query.isFetchNextPageError && (
            <ErrorState
              title={t('errorTitle')}
              message={t('loadFailed')}
              action={
                <Button
                  variant="outline"
                  disabled={query.isFetchingNextPage}
                  onClick={() => void query.fetchNextPage()}
                >
                  {t('retry')}
                </Button>
              }
            />
          )}
          {query.hasNextPage && (
            <Button
              variant="outline"
              loading={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              {t('more')}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
