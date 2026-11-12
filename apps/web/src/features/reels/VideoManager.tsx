'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import {
  CreateVideoReportSchema,
  CreateVideoSchema,
  MediaReportReasonSchema,
  type CreateVideo,
  type CreateVideoReport,
  type Video,
} from '@apnatown/shared';
import type { BusinessKind } from '@apnatown/shared/businesses';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { Select } from '@apnatown/ui/primitives/Select';
import { Switch } from '@apnatown/ui/primitives/Selection';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { StatusBadge, type BadgeTone } from '@apnatown/ui/primitives/Badge';
import { Card } from '@apnatown/ui/cards/Card';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
} from '@apnatown/ui/feedback/StateViews';
import { failureCode } from '../../shared/api/result';
import { AccessState, Failure } from '../../shared/auth/AccessState';
import { useSession } from '../../shared/auth/SessionProvider';
import {
  CommentsPanel,
  FollowButton,
  HeartButton,
  LikeButton,
  ShareSheet,
} from '../engagement';
import { EmbedCard } from './EmbedCard';
import {
  useCreateOwnerVideo,
  useOwnerVideos,
  usePublicVideo,
  useReportVideo,
} from './queries';

const statusPresentation: Record<
  Video['status'],
  { icon: string; tone: BadgeTone }
> = {
  pending: { icon: '⏳', tone: 'ap-pending' },
  approved: { icon: '✓', tone: 'ap-approved' },
  rejected: { icon: '✕', tone: 'ap-rejected' },
  removed: { icon: '⊘', tone: 'ap-rejected' },
} as const;

const denied = new Set([
  'COMMON_FORBIDDEN',
  'BUSINESS_NOT_OWNED',
  'BUSINESS_NOT_FOUND',
  'USERS_APPROVAL_REQUIRED',
]);

function buildInput(form: HTMLFormElement): CreateVideo | undefined {
  const values = new FormData(form);
  const parsed = CreateVideoSchema.safeParse({
    source: {
      kind: values.get('kind'),
      url: values.get('url'),
    },
    caption: values.get('caption') ?? '',
    hashtags: String(values.get('hashtags') ?? '')
      .split(',')
      .map((tag) => tag.trim().replace(/^#/, ''))
      .filter(Boolean),
    showInGallery: values.get('showInGallery') === 'on',
    showInReels: values.get('showInReels') === 'on',
  });
  return parsed.success ? parsed.data : undefined;
}

function VideoStatus({ video }: { video: Video }) {
  const t = useTranslations('reels.manager.status');
  const presentation = statusPresentation[video.status];
  return (
    <StatusBadge
      tone={presentation.tone}
      icon={presentation.icon}
      label={t(video.status)}
    />
  );
}

export function VideoManager({ kind }: { kind: BusinessKind }) {
  const t = useTranslations('reels.manager');
  const { state } = useSession();
  const form = useRef<HTMLFormElement>(null);
  const [formInvalid, setFormInvalid] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { query, scope } = useOwnerVideos(kind);
  const create = useCreateOwnerVideo(kind);
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const listCode = query.isError ? failureCode(query.error) : undefined;
  const createCode = create.mutation.isError
    ? failureCode(create.mutation.error)
    : undefined;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = buildInput(event.currentTarget);
    if (!body) {
      setFormInvalid(true);
      setSubmitted(false);
      return;
    }
    setFormInvalid(false);
    setSubmitted(false);
    create.submit(body, () => {
      form.current?.reset();
      setSubmitted(true);
    });
  }

  if (state.kind !== 'ready') return <AccessState />;
  let list;
  if (!scope || query.isPending) {
    list = <Skeleton label={t('loading')} />;
  } else if (listCode && denied.has(listCode)) {
    list = (
      <NoPermissionState
        title={t('forbiddenTitle')}
        message={t('forbiddenMessage')}
        action={null}
      />
    );
  } else if (listCode) {
    list = (
      <ErrorState
        title={t('errorTitle')}
        message={t('errors.failed')}
        action={
          <Button disabled={query.isFetching} onClick={() => void query.refetch()}>
            {t('retry')}
          </Button>
        }
      />
    );
  } else if (items.length === 0) {
    list = (
      <EmptyState
        title={t('emptyTitle')}
        message={t('emptyMessage')}
        action={null}
      />
    );
  } else {
    list = (
      <div className="grid gap-3">
        <ul className="m-0 grid list-none gap-3 p-0 tablet:grid-cols-2">
          {items.map((video) => (
            <li key={video.id}>
              <Card padded className="grid h-full gap-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <VideoStatus video={video} />
                  <a
                    className="min-h-touch text-primary underline [overflow-wrap:anywhere]"
                    href={video.playback.openUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="strict-origin-when-cross-origin"
                  >
                    {t('openProvider')}
                  </a>
                </div>
                {video.caption && (
                  <p className="m-0 [overflow-wrap:anywhere]">{video.caption}</p>
                )}
                {video.hashtags.length > 0 && (
                  <p className="m-0 text-small text-text-2 [overflow-wrap:anywhere]">
                    {video.hashtags.map((tag) => `#${tag}`).join(' ')}
                  </p>
                )}
              </Card>
            </li>
          ))}
        </ul>
        {query.isFetchNextPageError && (
          <ErrorState
            title={t('errorTitle')}
            message={t('errors.failed')}
            action={
              <Button
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
            {t('loadMore')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <section className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="m-0 font-display text-h2">{t('title')}</h1>
        <p className="m-0 max-w-prose text-text-2 [overflow-wrap:anywhere]">
          {t('intro')}
        </p>
      </header>
      <Card padded>
        <form ref={form} onSubmit={submit} className="grid gap-4">
          <Select
            name="kind"
            label={t('sourceKind')}
            defaultValue="youtube"
            options={[
              { value: 'youtube', label: t('youtube') },
              { value: 'instagram', label: t('instagram') },
            ]}
          />
          <Input
            name="url"
            type="url"
            label={t('sourceUrl')}
            required
            maxLength={2048}
            autoComplete="url"
          />
          <Input name="caption" label={t('caption')} maxLength={300} />
          <Input
            name="hashtags"
            label={t('hashtags')}
            hint={t('hashtagsHint')}
          />
          <div className="grid gap-2 tablet:grid-cols-2">
            <Switch name="showInGallery" label={t('showInGallery')} />
            <Switch name="showInReels" label={t('showInReels')} />
          </div>
          {formInvalid && (
            <p role="alert" className="m-0 text-error [overflow-wrap:anywhere]">
              {t('errors.validation')}
            </p>
          )}
          {createCode && (
            <p role="alert" className="m-0 text-error [overflow-wrap:anywhere]">
              {t(`errors.${createCode === 'MEDIA_VIDEO_SOURCE_INVALID' ? 'sourceInvalid' : createCode === 'USERS_APPROVAL_REQUIRED' ? 'approvalRequired' : createCode === 'COMMON_RATE_LIMITED' ? 'rateLimited' : 'failed'}`)}
            </p>
          )}
          {submitted && (
            <p role="status" className="m-0 text-text-2 [overflow-wrap:anywhere]">
              {t('submitted')}
            </p>
          )}
          <Button type="submit" loading={create.mutation.isPending}>
            {t(create.mutation.isPending ? 'submitting' : 'submit')}
          </Button>
        </form>
      </Card>
      <section aria-labelledby="video-list-heading" className="grid gap-3">
        <h2 id="video-list-heading" className="m-0 text-h3">
          {t('listTitle')}
        </h2>
        {list}
      </section>
    </section>
  );
}

export function PublicVideo({ id, nonce }: { id: string; nonce: string }) {
  const t = useTranslations('reels.viewer');
  const query = usePublicVideo(id);
  const report = useReportVideo(id);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] =
    useState<CreateVideoReport['reason']>('inappropriate');
  const [reportDetails, setReportDetails] = useState('');
  const [reportInvalid, setReportInvalid] = useState(false);
  const [reported, setReported] = useState(false);
  if (query.isPending) return <Skeleton label={t('loading')} />;
  if (query.isError) {
    const code = failureCode(query.error);
    if (code === 'MEDIA_VIDEO_NOT_PUBLISHED' || code === 'MEDIA_NOT_FOUND')
      return (
        <EmptyState
          title={t('unavailableTitle')}
          message={t('unavailableMessage')}
          action={null}
        />
      );
    return (
      <Failure
        code={code}
        retry={() => void query.refetch()}
        retryDisabled={query.isFetching}
      />
    );
  }
  const video = query.data;
  const reportCode = report.mutation.isError
    ? failureCode(report.mutation.error)
    : undefined;
  function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = CreateVideoReportSchema.safeParse({
      reason: reportReason,
      details: reportDetails,
    });
    if (!parsed.success) {
      setReportInvalid(true);
      return;
    }
    setReportInvalid(false);
    setReported(false);
    report.submit(parsed.data, () => {
      setReportOpen(false);
      setReportDetails('');
      setReported(true);
    });
  }
  return (
    <article className="mx-auto grid max-w-prose gap-4">
      <h1 className="m-0 font-display text-h2">{t('title')}</h1>
      <EmbedCard playback={video.playback} active nonce={nonce} />
      {video.caption && (
        <p className="m-0 [overflow-wrap:anywhere]">{video.caption}</p>
      )}
      <FollowButton videoId={video.id} businessId={video.businessId} />
      <LikeButton videoId={video.id} businessId={video.businessId} />
      <HeartButton videoId={video.id} businessId={video.businessId} />
      <ShareSheet videoId={video.id} />
      <CommentsPanel videoId={video.id} />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => setReportOpen(true)}>
          {t('report.open')}
        </Button>
        {reported && (
          <p role="status" className="m-0 text-text-2 [overflow-wrap:anywhere]">
            {t('report.success')}
          </p>
        )}
      </div>
      <Sheet
        open={reportOpen}
        onOpenChange={setReportOpen}
        title={t('report.title')}
        description={t('report.description')}
        closeLabel={t('report.cancel')}
        busy={report.mutation.isPending}
      >
        <form onSubmit={submitReport} className="grid gap-4">
          <Select
            label={t('report.reasonLabel')}
            value={reportReason}
            onChange={(event) => {
              const parsed = MediaReportReasonSchema.safeParse(
                event.currentTarget.value,
              );
              if (parsed.success) setReportReason(parsed.data);
            }}
            options={[
              { value: 'inappropriate', label: t('report.reasons.inappropriate') },
              { value: 'misleading', label: t('report.reasons.misleading') },
              { value: 'spam', label: t('report.reasons.spam') },
              { value: 'copyright', label: t('report.reasons.copyright') },
              { value: 'other', label: t('report.reasons.other') },
            ]}
          />
          <TextArea
            label={t('report.detailsLabel')}
            value={reportDetails}
            maxLength={500}
            onChange={(event) => setReportDetails(event.currentTarget.value)}
          />
          {reportInvalid && (
            <p role="alert" className="m-0 text-error [overflow-wrap:anywhere]">
              {t('report.validation')}
            </p>
          )}
          {reportCode && (
            <p role="alert" className="m-0 text-error [overflow-wrap:anywhere]">
              {t(
                reportCode === 'COMMON_RATE_LIMITED'
                  ? 'report.rateLimited'
                  : 'report.failed',
              )}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={report.mutation.isPending}
              onClick={() => setReportOpen(false)}
            >
              {t('report.cancel')}
            </Button>
            <Button type="submit" loading={report.mutation.isPending}>
              {t(report.mutation.isPending ? 'report.submitting' : 'report.submit')}
            </Button>
          </div>
        </form>
      </Sheet>
    </article>
  );
}
