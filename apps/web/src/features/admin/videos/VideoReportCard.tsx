'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import {
  MediaReportDecisionSchema,
  type MediaReportDecision,
  type VideoModerationQueueItem,
} from '@apnatown/shared';
import { Card } from '@apnatown/ui/cards/Card';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { EmbedCard } from '../../reels';

export function VideoReportCard({
  item,
  locale,
  nonce,
  canEdit,
  busy,
  error,
  onDecision,
}: {
  item: Extract<VideoModerationQueueItem, { queueItemType: 'report' }>;
  locale: string;
  nonce: string;
  canEdit: boolean;
  busy: boolean;
  error: string | undefined;
  onDecision: (decision: MediaReportDecision) => void;
}) {
  const t = useTranslations('admin.videos');
  const [preview, setPreview] = useState(false);
  const [action, setAction] = useState<MediaReportDecision['action']>();
  const [reason, setReason] = useState('');
  const [invalidReason, setInvalidReason] = useState(false);
  const businessName =
    (locale === 'hi'
      ? item.video.businessNameHi
      : item.video.businessNameEn) ??
    item.video.businessNameEn ??
    item.video.businessNameHi ??
    '—';

  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action) return;
    const parsed = MediaReportDecisionSchema.safeParse({
      action,
      expectedVersion: item.reportVersion,
      targetVersion: item.targetVersion,
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
          tone="ap-pending"
          icon="⚑"
          label={t('tabs.reported')}
        />
        <span className="text-small text-text-2">
          {item.video.provider === 'youtube' ? t('youtube') : t('instagram')}
        </span>
      </div>
      <h2 className="m-0 text-h3 [overflow-wrap:anywhere]">{businessName}</h2>
      {item.video.caption && (
        <p className="m-0 [overflow-wrap:anywhere]">{item.video.caption}</p>
      )}
      <dl className="m-0 grid gap-1">
        <div>
          <dt className="inline font-semibold">{t('reportReasonLabel')}: </dt>
          <dd className="inline">{t(`reportReasons.${item.reason}`)}</dd>
        </div>
        {item.details && (
          <div>
            <dt className="inline font-semibold">{t('reportDetailsLabel')}: </dt>
            <dd className="inline [overflow-wrap:anywhere]">{item.details}</dd>
          </div>
        )}
      </dl>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          aria-expanded={preview}
          onClick={() => setPreview((open) => !open)}
        >
          {t(preview ? 'hidePreview' : 'preview')}
        </Button>
        {canEdit &&
          item.allowedActions.map((value) => (
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
              {t(`reportActions.${value}`)}
            </Button>
          ))}
      </div>
      {preview && (
        <div className="min-w-0">
          <EmbedCard playback={item.video.playback} active nonce={nonce} />
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
          {action === 'remove' && (
            <TextArea
              label={t('removeReason')}
              value={reason}
              maxLength={500}
              required
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
              {t(`reportActions.${action}`)}
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
