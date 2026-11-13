'use client';

import { useTranslations } from 'next-intl';
import type { Video } from '@apnatown/shared';
import type { BusinessKind } from '@apnatown/shared/businesses';
import { Badge } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { Switch } from '@apnatown/ui/primitives/Selection';
import { Card } from '@apnatown/ui/cards/Card';
import { NavIcon } from '../../../shared/ui/NavIcon';
import { Alert } from '../../businesses/parts';
import { IconButton, PreviewImage } from '../../media/owner-images';
import { linkKey, type LinkOption } from './gallery-queries';
import { ProviderBadge, VideoStatusChip } from './parts';
import { useOwnerVideoDetail } from './queries';

export type VideoCardActions = {
  onMove: (delta: -1 | 1) => void;
  onToggle: (field: 'showInGallery' | 'showInReels', value: boolean) => void;
  onPreview: () => void;
  onEdit: () => void;
  onRemove: () => void;
};

/** Prototype `vmedia` video card: status, reason, links, toggles, actions. */
export function VideoCard({
  kind,
  video,
  position,
  total,
  orderBusy,
  writeBusy,
  links,
  actions,
}: {
  kind: BusinessKind;
  video: Video;
  position: number;
  total: number;
  orderBusy: boolean;
  writeBusy: boolean;
  links: ReadonlyMap<string, LinkOption>;
  actions: VideoCardActions;
}) {
  const t = useTranslations('vendor.media.video');
  const removed = video.status === 'removed';
  // The list DTO has no thumbnail/reason: rejected/removed cards read the
  // detail for the decision reason; others show a detail already cached.
  const detail = useOwnerVideoDetail(kind, video.id, {
    enabled: video.status === 'rejected' || removed,
  }).data;
  const current = detail?.video.version === video.version ? detail : undefined;
  const title = video.caption || t('untitled', { position });
  const reason = current?.decisionReason;

  return (
    <Card padded className="grid h-full min-w-0 content-start gap-3">
      <div className="flex min-w-0 gap-3">
        <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md border border-border bg-surface-2 tablet:w-36">
          {current?.thumbnail ? (
            <PreviewImage
              src={current.thumbnail.previewPath}
              alt={t('thumbnailAlt', { title })}
            />
          ) : (
            <div className="grid size-full place-items-center text-text-2">
              <NavIcon name="play" className="size-6" />
              <span className="sr-only">{t('noThumbnail')}</span>
            </div>
          )}
        </div>
        <div className="grid min-w-0 flex-1 content-start gap-1.5">
          <h3 className="m-0 line-clamp-2 text-body font-semibold [overflow-wrap:anywhere]">
            {title}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            <ProviderBadge video={video} />
            <VideoStatusChip status={video.status} />
          </div>
          <p className="m-0 text-caption-min text-text-2">
            {t('position', { position, total })}
          </p>
        </div>
        <div className="-me-2 -mt-2 flex shrink-0 flex-col">
          <MoveButton
            id={video.id}
            delta={-1}
            label={t('moveUp', { title })}
            disabled={orderBusy || position === 1}
            onMove={actions.onMove}
          />
          <MoveButton
            id={video.id}
            delta={1}
            label={t('moveDown', { title })}
            disabled={orderBusy || position === total}
            onMove={actions.onMove}
          />
        </div>
      </div>

      {video.status === 'rejected' && (
        <Alert tone="bad" title={t('rejectedTitle')}>
          <p className="m-0">{reason ?? t('rejectedNoReason')}</p>
          <p className="m-0 text-text-2">{t('rejectedHelp')}</p>
        </Alert>
      )}
      {video.status === 'pending' && (
        <Alert tone="warn" icon="⏳">
          <p className="m-0">{t('pendingHelp')}</p>
        </Alert>
      )}
      {removed && (
        <Alert tone="bad" icon="⊘" title={t('removedTitle')}>
          {reason && <p className="m-0">{reason}</p>}
          <p className="m-0 text-text-2">{t('removedHelp')}</p>
        </Alert>
      )}

      {video.hashtags.length > 0 && (
        <p className="m-0 text-small text-primary [overflow-wrap:anywhere]">
          {video.hashtags.map((tag) => `#${tag}`).join(' ')}
        </p>
      )}

      {current && (
        <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-small">
          <span className="font-semibold">{t('linked')}</span>
          {current.links.length === 0 ? (
            <span className="text-text-2">{t('nothingLinked')}</span>
          ) : (
            current.links.map((link) => (
              <Badge
                key={linkKey(link)}
                tone="info"
                icon={link.targetType === 'product' ? '📦' : '🛠️'}
                label={links.get(linkKey(link))?.name ?? t(`linkFallback.${link.targetType}`)}
              />
            ))
          )}
        </div>
      )}

      {!removed && (
        <div className="grid gap-1 border-t border-border pt-2 tablet:grid-cols-2">
          <Switch
            label={t('showInGallery')}
            checked={video.showInGallery}
            disabled={writeBusy}
            onChange={(event) =>
              actions.onToggle('showInGallery', event.currentTarget.checked)
            }
          />
          <Switch
            label={t('showInReels')}
            checked={video.showInReels}
            disabled={writeBusy}
            onChange={(event) =>
              actions.onToggle('showInReels', event.currentTarget.checked)
            }
          />
          <p className="m-0 text-caption-min text-text-2 tablet:col-span-2 [overflow-wrap:anywhere]">
            {t('toggleKeepsApproval')}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
        <Button size="card" variant="ghost" className="gap-1.5" onClick={actions.onPreview}>
          <NavIcon name="eye" className="size-4" />
          {t('preview')}
        </Button>
        {!removed && (
          <Button
            size="card"
            variant="outline"
            className="gap-1.5"
            data-video-edit={video.id}
            onClick={actions.onEdit}
          >
            <NavIcon name="edit" className="size-4" />
            {video.status === 'rejected' ? t('fixAndResubmit') : t('edit')}
          </Button>
        )}
        <Button
          size="card"
          variant="text"
          className="gap-1.5 text-error hover:bg-error-soft"
          onClick={actions.onRemove}
        >
          <NavIcon name="trash" className="size-4" />
          {t('remove')}
        </Button>
      </div>
    </Card>
  );
}

function MoveButton({
  id,
  delta,
  label,
  disabled,
  onMove,
}: {
  id: string;
  delta: -1 | 1;
  label: string;
  disabled: boolean;
  onMove: (delta: -1 | 1) => void;
}) {
  return (
    <span data-move={`${id}:${delta}`} className="contents">
      <IconButton
        icon={delta < 0 ? 'cu' : 'cd'}
        label={label}
        disabled={disabled}
        onClick={() => onMove(delta)}
      />
    </span>
  );
}
