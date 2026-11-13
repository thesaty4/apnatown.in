'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import {
  VideoModerationDecisionSchema,
  VideoModerationTabSchema,
  type VideoModerationDecision,
  type VideoModerationItem,
  type VideoModerationTab,
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
import { failureCode } from '../../../shared/api/result';
import { queryKeys } from '../../../shared/api/query-keys';
import { useAdmin } from '../AdminShell';
import { AdminFailure, adminErrorKey, isDenied } from '../parts';
import { EmbedCard } from '../../reels';
import { useVideoModerationDecision, videoModerationOptions } from './queries';
import { mediaReportCountsOptions } from './reports-queries';
import { ReportedQueue } from './ReportedQueue';
import { VideoCommentsQueue } from './VideoCommentsQueue';

const statusPresentation: Record<
  Exclude<VideoModerationTab, 'reported'>,
  { icon: string; tone: BadgeTone }
> = {
  pending: { icon: '⏳', tone: 'ap-pending' },
  approved: { icon: '✓', tone: 'ap-approved' },
  rejected: { icon: '✕', tone: 'ap-rejected' },
  removed: { icon: '⊘', tone: 'ap-rejected' },
};

const tabs: readonly VideoModerationTab[] = [
  'pending',
  'approved',
  'rejected',
  'removed',
  'reported',
];

export function VideoModerationScreen({ nonce }: { nonce: string }) {
  const context = useAdmin();
  const { me, scope, recheck } = context;
  const t = useTranslations('admin.videos');
  const te = useTranslations('admin.errors');
  const ts = useTranslations('admin.state');
  const locale = useLocale();
  const client = useQueryClient();
  const pathname = usePathname();
  const params = useSearchParams();
  const contentTab = params.get('content') === 'comments' ? 'comments' : 'videos';
  const parsedTab = VideoModerationTabSchema.safeParse(params.get('tab'));
  const tab = parsedTab.success ? parsedTab.data : 'pending';
  const [decisionTarget, setDecisionTarget] = useState<string>();
  const permitted = me.isSuper || me.permissions.reviews.includes('view');
  const canEdit = me.isSuper || me.permissions.reviews.includes('edit');
  // Reported renders the combined media-report queue (S-ADMN-11); the video
  // list then only supplies the other tabs' counts via the shared pending key.
  const reported = tab === 'reported';
  const list = useInfiniteQuery({
    ...videoModerationOptions(context, reported ? 'pending' : tab),
    enabled: permitted && contentTab === 'videos',
  });
  const reportCounts = useQuery({
    ...mediaReportCountsOptions(context),
    enabled: permitted && contentTab === 'videos',
  });
  const decision = useVideoModerationDecision(context);
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const counts = list.data?.pages[0]?.counts;
  const listCode = list.isError ? failureCode(list.error) : undefined;
  const decisionCode = decision.mutation.isError
    ? failureCode(decision.mutation.error)
    : undefined;
  const denied = Boolean(listCode && isDenied(listCode));

  useEffect(() => {
    if (denied) recheck();
    if (!permitted || denied) {
      client.removeQueries({
        queryKey: queryKeys.adminVideoModerationRoot(scope),
      });
    }
  }, [client, denied, permitted, recheck, scope]);

  function submitDecision(
    item: VideoModerationItem,
    body: VideoModerationDecision,
  ) {
    setDecisionTarget(item.id);
    decision.submit(item.id, body, () => setDecisionTarget(undefined));
  }

  const deniedDecision = Boolean(decisionCode && isDenied(decisionCode));
  useEffect(() => {
    if (deniedDecision) {
      recheck();
      client.removeQueries({
        queryKey: queryKeys.adminVideoModerationRoot(scope),
      });
    }
  }, [client, deniedDecision, recheck, scope]);

  let videoContent;
  if (!permitted || denied || deniedDecision) {
    videoContent = (
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
    videoContent = <Skeleton label={ts('loading')} />;
  } else if (listCode && !list.data) {
    videoContent = (
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
    videoContent = (
      <EmptyState
        title={t('empty.title')}
        message={t('empty.message')}
        action={null}
      />
    );
  } else {
    videoContent = (
      <div
        className="grid gap-3"
        aria-busy={list.isFetching && !list.isFetchingNextPage}
      >
        {listCode && <AdminFailure code={listCode} />}
        {decisionCode &&
          (!decisionTarget ||
            !items.some(
              (item) =>
                item.queueItemType === 'video' && item.id === decisionTarget,
            )) && (
            <AdminFailure code={decisionCode} />
          )}
        <ul className="m-0 grid list-none gap-3 p-0 tablet:grid-cols-2">
          {items.map((item) =>
            item.queueItemType === 'report' ? null : (
              <li key={`${item.id}:${item.version}`}>
                <VideoModerationCard
                  item={item}
                  locale={locale}
                  nonce={nonce}
                  canEdit={canEdit}
                  busy={decision.mutation.isPending}
                  error={
                    decisionTarget === item.id && decisionCode
                      ? te(adminErrorKey(decisionCode))
                      : undefined
                  }
                  onDecision={(body) => submitDecision(item, body)}
                />
              </li>
            ),
          )}
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
    <section className="grid gap-5">
      <header className="grid gap-2">
        <h1 className="m-0 font-display text-h2">{t('title')}</h1>
      </header>
      <nav aria-label={t('content.label')} className="flex flex-wrap gap-2">
        <Link
          href={`${pathname}?tab=pending`}
          scroll={false}
          aria-current={contentTab === 'videos' ? 'page' : undefined}
          className={`inline-flex min-h-touch items-center rounded-pill border-2 px-4 py-2 font-semibold whitespace-normal [overflow-wrap:anywhere] focus-visible:ring-focus ${
            contentTab === 'videos'
              ? 'border-primary bg-primary-soft text-primary'
              : 'border-border bg-surface text-text-2'
          }`}
        >
          {t('content.videos')}
        </Link>
        <Link
          href={`${pathname}?content=comments&status=pending`}
          scroll={false}
          aria-current={contentTab === 'comments' ? 'page' : undefined}
          className={`inline-flex min-h-touch items-center rounded-pill border-2 px-4 py-2 font-semibold whitespace-normal [overflow-wrap:anywhere] focus-visible:ring-focus ${
            contentTab === 'comments'
              ? 'border-primary bg-primary-soft text-primary'
              : 'border-border bg-surface text-text-2'
          }`}
        >
          {t('content.comments')}
        </Link>
      </nav>
      {contentTab === 'comments' ? (
        <VideoCommentsQueue />
      ) : (
        <>
          {decisionCode && !items.length && !reported && (
            <AdminFailure code={decisionCode} />
          )}
          <nav aria-label={t('tabsLabel')} className="flex flex-wrap gap-2">
            {tabs.map((value) => (
              <Link
                key={value}
                href={`${pathname}?tab=${value}`}
                scroll={false}
                aria-current={value === tab ? 'page' : undefined}
                className={`inline-flex min-h-touch items-center gap-2 rounded-pill border-2 px-4 py-2 font-semibold whitespace-normal [overflow-wrap:anywhere] focus-visible:ring-focus ${
                  value === tab
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-border bg-surface text-text-2'
                }`}
              >
                <span>{t(`tabs.${value}`)}</span>
                <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-caption">
                  {(value === 'reported'
                    ? reportCounts.data?.total
                    : counts?.[value]) ?? '—'}
                </span>
              </Link>
            ))}
          </nav>
          {reported ? <ReportedQueue nonce={nonce} /> : videoContent}
        </>
      )}
    </section>
  );
}

function VideoModerationCard({
  item,
  locale,
  nonce,
  canEdit,
  busy,
  error,
  onDecision,
}: {
  item: VideoModerationItem;
  locale: string;
  nonce: string;
  canEdit: boolean;
  busy: boolean;
  error: string | undefined;
  onDecision: (decision: VideoModerationDecision) => void;
}) {
  const t = useTranslations('admin.videos');
  const [preview, setPreview] = useState(false);
  const [action, setAction] = useState<VideoModerationDecision['action']>();
  const [reason, setReason] = useState('');
  const [invalidReason, setInvalidReason] = useState(false);
  const state = statusPresentation[item.status];
  const businessName =
    (locale === 'hi' ? item.businessNameHi : item.businessNameEn) ??
    item.businessNameEn ??
    item.businessNameHi ??
    '—';

  const actions: VideoModerationDecision['action'][] =
    item.status === 'pending'
      ? ['approve', 'reject', 'remove']
      : item.status === 'approved'
        ? ['remove']
        : item.status === 'rejected'
          ? ['approve', 'remove']
          : ['approve'];

  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action) return;
    const parsed = VideoModerationDecisionSchema.safeParse({
      action,
      expectedVersion: item.version,
      ...(reason.trim() ? { reason: reason.trim() } : {}),
    });
    if (!parsed.success) {
      setInvalidReason(true);
      return;
    }
    setInvalidReason(false);
    onDecision(parsed.data);
  }

  return (
    <Card padded className="grid content-start gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <StatusBadge
          tone={state.tone}
          icon={state.icon}
          label={t(`tabs.${item.status}`)}
        />
        <span className="text-small text-text-2">
          {item.provider === 'youtube' ? t('youtube') : t('instagram')}
        </span>
      </div>
      <h2 className="m-0 text-h3 [overflow-wrap:anywhere]">{businessName}</h2>
      {item.caption && (
        <p className="m-0 [overflow-wrap:anywhere]">{item.caption}</p>
      )}
      {item.hashtags.length > 0 && (
        <p className="m-0 text-small text-text-2 [overflow-wrap:anywhere]">
          {item.hashtags.map((tag) => `#${tag}`).join(' ')}
        </p>
      )}
      {item.decisionReason && (
        <p className="m-0 text-small [overflow-wrap:anywhere]">
          <strong>{t('reasonLabel')}:</strong> {item.decisionReason}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          aria-expanded={preview}
          onClick={() => setPreview((open) => !open)}
        >
          {t(preview ? 'hidePreview' : 'preview')}
        </Button>
        {canEdit &&
          actions.map((value) => (
            <Button
              key={value}
              variant={value === 'remove' ? 'danger' : 'outline'}
              disabled={busy}
              onClick={() => {
                setAction(value);
                setReason('');
                setInvalidReason(false);
              }}
            >
              {t(`actions.${value}`)}
            </Button>
          ))}
      </div>
      {preview && (
        <div className="min-w-0">
          <EmbedCard playback={item.playback} active nonce={nonce} />
        </div>
      )}
      {action && (
        <form onSubmit={confirm} className="grid gap-3">
          {action === 'remove' && (
            <div className="grid gap-1">
              <h3 className="m-0 text-body">{t('removeTitle')}</h3>
              <p className="m-0 text-small text-text-2 [overflow-wrap:anywhere]">
                {t('removeImpact')}
              </p>
            </div>
          )}
          {action !== 'approve' && (
            <TextArea
              label={t(action === 'reject' ? 'rejectReason' : 'reasonLabel')}
              value={reason}
              maxLength={500}
              required={action === 'reject'}
              error={invalidReason ? t('reasonRequired') : undefined}
              onChange={(event) => {
                setReason(event.currentTarget.value);
                setInvalidReason(false);
              }}
            />
          )}
          {error && (
            <p role="alert" className="m-0 text-error">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy}>
              {t(`actions.${action}`)}
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setAction(undefined)}
            >
              {t('cancel')}
            </Button>
          </div>
        </form>
      )}
      {!canEdit && (
        <p className="m-0 text-small text-text-2">{t('readOnly')}</p>
      )}
    </Card>
  );
}
