'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { OwnerVideoDetail } from '@apnatown/shared';
import type { BusinessKind } from '@apnatown/shared/businesses';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { Button } from '@apnatown/ui/primitives/Button';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { ErrorState } from '@apnatown/ui/feedback/StateViews';
import { failureCode } from '../../../shared/api/result';
import { useOnline } from '../../../shared/hooks/use-online';
import { Alert } from '../../businesses/parts';
import { useMediaError, VideoStatusChip } from './parts';
import { useEditVideo, useOwnerVideoDetail } from './queries';
import {
  buildEdit,
  toEditorForm,
  VideoEditorFields,
  type EditorForm,
  type EditorIssues,
} from './VideoEditorFields';

const fieldFor: Record<string, keyof EditorIssues> = {
  MEDIA_VIDEO_SOURCE_INVALID: 'url',
  MEDIA_LINK_TARGET_INVALID: 'links',
};

/**
 * Edit a video link, thumbnail, caption, hashtags, linked items and
 * visibility. Hydrates from a fresh GET so a stale list row never seeds it;
 * mount with a `key` per opened video.
 */
export function VideoEditorSheet({
  kind,
  businessId,
  videoId,
  onClose,
  onSaved,
}: {
  kind: BusinessKind;
  businessId: string;
  videoId: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const t = useTranslations('vendor.media.editor');
  const detail = useOwnerVideoDetail(kind, videoId, { enabled: true, fresh: true });
  const edit = useEditVideo(kind);
  const busy = edit.mutation.isPending;
  const [form, setForm] = useState<{ version: number; value: EditorForm }>();
  const data = detail.data;
  // Seed once per confirmed version; a conflict reload re-seeds from the server.
  const current =
    data && form?.version === data.video.version ? form.value : data && toEditorForm(data);

  let body;
  if (detail.isPending) body = <Skeleton label={t('loading')} />;
  else if (!data)
    body = (
      <ErrorState
        headingLevel="h2"
        title={t('loadErrorTitle')}
        message={t('loadError')}
        action={
          <Button disabled={detail.isFetching} onClick={() => void detail.refetch()}>
            {t('retry')}
          </Button>
        }
      />
    );
  else if (data.ownerDeleted || data.video.status === 'removed')
    body = (
      <Alert tone="bad" icon="⊘" title={t('readOnlyTitle')}>
        <p className="m-0">{t('readOnly')}</p>
      </Alert>
    );
  else if (current)
    body = (
      <EditorBody
        kind={kind}
        businessId={businessId}
        detail={data}
        form={current}
        busy={busy}
        edit={edit}
        reload={() => {
          edit.mutation.reset();
          void detail.refetch();
        }}
        reloading={detail.isFetching}
        onForm={(value) => setForm({ version: data.video.version, value })}
        onClose={onClose}
        onSaved={onSaved}
      />
    );

  return (
    <Sheet
      open
      wide
      busy={busy}
      title={t('title')}
      closeLabel={t('close')}
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      {body}
    </Sheet>
  );
}

function EditorBody({
  kind,
  businessId,
  detail,
  form,
  busy,
  edit,
  reload,
  reloading,
  onForm,
  onClose,
  onSaved,
}: {
  kind: BusinessKind;
  businessId: string;
  detail: OwnerVideoDetail;
  form: EditorForm;
  busy: boolean;
  edit: ReturnType<typeof useEditVideo>;
  reload: () => void;
  reloading: boolean;
  onForm: (value: EditorForm) => void;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const t = useTranslations('vendor.media.editor');
  const message = useMediaError();
  const online = useOnline();
  const [issues, setIssues] = useState<EditorIssues>({});
  const [uploading, setUploading] = useState(false);
  const { video } = detail;
  const rejected = video.status === 'rejected';
  const error = edit.mutation.error;
  const code = error ? failureCode(error) : undefined;
  const conflict =
    code === 'MEDIA_VERSION_CONFLICT' || code === 'VIDEO_INVALID_TRANSITION';
  const field = code ? fieldFor[code] : undefined;
  const preview = buildEdit(detail, form, false);
  const sendsBack =
    video.status === 'approved' && 'content' in preview && preview.content;

  function save(resubmit: boolean) {
    const built = buildEdit(detail, form, resubmit);
    if ('issues' in built) return setIssues(built.issues);
    setIssues({});
    if (Object.keys(built.body).length === 1) return onClose();
    edit.submit(video.id, built.body, () =>
      onSaved(
        t(
          resubmit
            ? 'resubmitted'
            : built.content && video.status === 'approved'
              ? 'savedForReview'
              : 'saved',
        ),
      ),
    );
  }

  const shown: EditorIssues = {
    ...issues,
    ...(field && error && { [field]: `server:${message(error)}` }),
  };
  const blocked = busy || uploading || !online;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <VideoStatusChip status={video.status} />
        {rejected && detail.decisionReason && (
          <span className="min-w-0 text-small text-text-2 [overflow-wrap:anywhere]">
            {detail.decisionReason}
          </span>
        )}
      </div>
      {conflict && (
        <Alert
          tone="warn"
          role="alert"
          title={t('conflictTitle')}
          action={
            <Button size="card" variant="outline" loading={reloading} onClick={reload}>
              {t('reload')}
            </Button>
          }
        >
          <p className="m-0">{message(error)}</p>
        </Alert>
      )}
      {error && !conflict && !field && (
        <Alert tone="bad" role="alert">
          <p className="m-0">{message(error)}</p>
        </Alert>
      )}
      <VideoEditorFields
        kind={kind}
        businessId={businessId}
        form={form}
        issues={shown}
        disabled={busy}
        onThumbnailPending={setUploading}
        onChange={(patch) => onForm({ ...form, ...patch })}
      />
      {sendsBack && (
        <Alert tone="warn" role="note">
          <p className="m-0">{t('sendsBack')}</p>
        </Alert>
      )}
      {!online && (
        <p role="status" className="m-0 text-small text-warning">
          {t('offline')}
        </p>
      )}
      <div className="sticky bottom-0 -mx-1 flex flex-wrap justify-end gap-2 border-t border-border bg-surface px-1 pt-3">
        <Button variant="ghost" disabled={busy} onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button
          variant={rejected ? 'outline' : 'primary'}
          loading={busy && !rejected}
          disabled={blocked}
          onClick={() => save(false)}
        >
          {t('save')}
        </Button>
        {rejected && (
          <Button loading={busy} disabled={blocked} onClick={() => save(true)}>
            {t('resubmit')}
          </Button>
        )}
      </div>
    </div>
  );
}
