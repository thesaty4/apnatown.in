'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type {
  MediaReportDecision,
  PhotoReportQueueItem,
} from '@apnatown/shared';
import { Card } from '@apnatown/ui/cards/Card';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { imageSources } from '../../gallery/media';
import { useIstTime } from '../approvals/parts';

const placementLabels = {
  gallery_photo: 'reports.placement.galleryPhoto',
  product_image: 'reports.placement.productImage',
  service_image: 'reports.placement.serviceImage',
} as const;

/** S-ADMN-11 photo report: gateway preview only, plain-text report fields. */
export function PhotoReportCard({
  item,
  locale,
  canEdit,
  busy,
  error,
  onDecision,
}: {
  item: PhotoReportQueueItem;
  locale: string;
  canEdit: boolean;
  busy: boolean;
  error: string | undefined;
  /** `done` runs after a successful decision (queue already invalidated). */
  onDecision: (decision: MediaReportDecision, done: () => void) => void;
}) {
  const t = useTranslations('admin.videos');
  const time = useIstTime();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const removeButton = useRef<HTMLButtonElement>(null);
  const [reason, setReason] = useState('');
  const [invalidReason, setInvalidReason] = useState(false);
  const { photo } = item;
  const businessName =
    (locale === 'hi' ? photo.businessNameHi : photo.businessNameEn) ??
    photo.businessNameEn ??
    photo.businessNameHi ??
    '—';
  const preview = photo.preview ? imageSources(photo.preview, 480) : null;
  const versions = {
    expectedVersion: item.reportVersion,
    targetVersion: item.targetVersion,
  };

  function setDialog(open: boolean) {
    setConfirmRemove(open);
    // Return focus to the trigger when the dialog closes without a decision.
    if (!open) requestAnimationFrame(() => removeButton.current?.focus());
  }

  function remove() {
    const trimmed = reason.trim();
    if (!trimmed) {
      setInvalidReason(true);
      return;
    }
    setInvalidReason(false);
    onDecision({ action: 'remove', reason: trimmed, ...versions }, () =>
      setConfirmRemove(false),
    );
  }

  return (
    <Card padded className="grid content-start gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <StatusBadge tone="ap-pending" icon="⚑" label={t('tabs.reported')} />
        <span className="text-small text-text-2 [overflow-wrap:anywhere]">
          {t(placementLabels[item.placementType])}
        </span>
      </div>
      {preview && photo.preview ? (
        <img
          src={preview.src}
          srcSet={preview.srcSet}
          sizes="(min-width: 600px) 50vw, 100vw"
          alt={t('reports.photo.previewAlt', { business: businessName })}
          width={photo.preview.width}
          height={photo.preview.height}
          loading="lazy"
          decoding="async"
          className="block aspect-[4/3] h-auto w-full rounded-md bg-surface-2 object-contain"
        />
      ) : (
        <div className="grid aspect-[4/3] w-full place-items-center rounded-md border border-dashed border-border bg-surface-2 p-4 text-center text-small text-text-2">
          {t('reports.photo.previewUnavailable')}
        </div>
      )}
      <h2 className="m-0 text-h3 [overflow-wrap:anywhere]">{businessName}</h2>
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
        <div>
          <dt className="inline font-semibold">
            {t('reports.photo.reportedAt')}:{' '}
          </dt>
          <dd className="inline">
            <time dateTime={item.createdAt}>{time(item.createdAt)}</time>
          </dd>
        </div>
      </dl>
      {photo.moderationState === 'removed' && (
        <p className="m-0 text-small text-text-2 [overflow-wrap:anywhere]">
          {t('reports.photo.alreadyRemoved')}
        </p>
      )}
      {error && !confirmRemove && (
        <p role="alert" className="m-0 text-error [overflow-wrap:anywhere]">
          {error}
        </p>
      )}
      {canEdit ? (
        <div className="flex flex-wrap gap-2">
          {item.allowedActions.includes('dismiss') && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                onDecision({ action: 'dismiss', ...versions }, () => {})
              }
            >
              {t('reportActions.dismiss')}
            </Button>
          )}
          {item.allowedActions.includes('remove') && (
            <Button
              ref={removeButton}
              variant="danger"
              disabled={busy}
              onClick={() => {
                setReason('');
                setInvalidReason(false);
                setConfirmRemove(true);
              }}
            >
              {t('reports.photo.remove')}
            </Button>
          )}
        </div>
      ) : (
        <p className="m-0 text-small text-text-2">{t('readOnly')}</p>
      )}
      {item.allowedActions.includes('remove') && canEdit && (
        <ConfirmDialog
          open={confirmRemove}
          onOpenChange={setDialog}
          tone="danger"
          busy={busy}
          title={t('reports.photo.removeTitle')}
          impact={t('reports.photo.removeImpact')}
          cancelLabel={t('cancel')}
          confirmLabel={t('reports.photo.remove')}
          onConfirm={remove}
        >
          <TextArea
            label={t('removeReason')}
            value={reason}
            maxLength={500}
            required
            error={
              invalidReason ? t('reports.photo.reasonRequired') : undefined
            }
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
        </ConfirmDialog>
      )}
    </Card>
  );
}
