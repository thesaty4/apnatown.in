'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import {
  VideoCommentDecisionSchema,
  type VideoCommentAdminPage,
  type VideoCommentDecision,
  type VideoCommentStatus,
} from '@apnatown/shared';
import { Card } from '@apnatown/ui/cards/Card';
import { StatusBadge, type BadgeTone } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { TextArea } from '@apnatown/ui/primitives/TextArea';

const statusPresentation: Record<
  VideoCommentStatus,
  { icon: string; tone: BadgeTone }
> = {
  pending: { icon: '⏳', tone: 'ap-pending' },
  published: { icon: '✓', tone: 'ap-approved' },
  removed: { icon: '⊘', tone: 'ap-rejected' },
};
const statusLabels = {
  pending: 'comments.status.pending',
  published: 'comments.status.published',
  removed: 'comments.status.removed',
} as const;

export function VideoCommentModerationCard({
  item,
  canEdit,
  busy,
  error,
  onDecision,
}: {
  item: VideoCommentAdminPage['items'][number];
  canEdit: boolean;
  busy: boolean;
  error?: string | undefined;
  onDecision: (decision: VideoCommentDecision) => void;
}) {
  const t = useTranslations('admin.videos');
  const [action, setAction] = useState<VideoCommentDecision['action']>();
  const [reason, setReason] = useState('');
  const [invalidReason, setInvalidReason] = useState(false);
  const status = statusPresentation[item.status];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action) return;
    const parsed = VideoCommentDecisionSchema.safeParse({
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

  function publish() {
    const parsed = VideoCommentDecisionSchema.safeParse({
      action: 'publish',
      expectedVersion: item.version,
    });
    if (parsed.success) onDecision(parsed.data);
  }

  return (
    <Card padded className="grid content-start gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <StatusBadge
          tone={status.tone}
          icon={status.icon}
          label={t(statusLabels[item.status])}
        />
        <span className="text-small text-text-2">
          {t('comments.version', { version: item.version })}
        </span>
      </div>
      <p className="m-0 [overflow-wrap:anywhere]">
        <strong>{t('comments.author')}: </strong>
        {item.authorLabel}
      </p>
      <p className="m-0 whitespace-pre-wrap [overflow-wrap:anywhere]">
        {item.text}
      </p>
      <dl className="m-0 grid gap-1 text-small text-text-2">
        <div className="grid gap-1 tablet:grid-cols-[auto_1fr]">
          <dt className="font-semibold">{t('comments.videoId')}</dt>
          <dd className="m-0 [overflow-wrap:anywhere]">{item.videoId}</dd>
        </div>
        <div className="grid gap-1 tablet:grid-cols-[auto_1fr]">
          <dt className="font-semibold">{t('comments.businessId')}</dt>
          <dd className="m-0 [overflow-wrap:anywhere]">{item.businessId}</dd>
        </div>
      </dl>
      {item.reason && (
        <p className="m-0 [overflow-wrap:anywhere]">
          <strong>{t('reasonLabel')}: </strong>
          {item.reason}
        </p>
      )}
      {canEdit && item.allowedActions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {item.allowedActions.includes('publish') && (
            <Button disabled={busy} onClick={publish}>
              {t('comments.publish')}
            </Button>
          )}
          {item.allowedActions.includes('remove') && (
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => {
                setAction('remove');
                setReason('');
                setInvalidReason(false);
              }}
            >
              {t('comments.remove')}
            </Button>
          )}
        </div>
      )}
      {action === 'remove' && (
        <form onSubmit={submit} className="grid gap-3">
          <TextArea
            label={t('comments.reasonLabel')}
            value={reason}
            maxLength={500}
            required
            error={invalidReason ? t('comments.reasonRequired') : undefined}
            onChange={(event) => {
              setReason(event.currentTarget.value);
              setInvalidReason(false);
            }}
          />
          {error && (
            <p role="alert" className="m-0 text-error [overflow-wrap:anywhere]">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy}>
              {t('comments.remove')}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setAction(undefined)}
            >
              {t('cancel')}
            </Button>
          </div>
        </form>
      )}
      {error && action !== 'remove' && (
        <p role="alert" className="m-0 text-error [overflow-wrap:anywhere]">
          {error}
        </p>
      )}
      {!canEdit && (
        <p className="m-0 text-small text-text-2">{t('readOnly')}</p>
      )}
    </Card>
  );
}
