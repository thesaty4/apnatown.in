'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Video } from '@apnatown/shared';
import type { BusinessKind } from '@apnatown/shared/businesses';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { Button } from '@apnatown/ui/primitives/Button';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import {
  EmptyState,
  ErrorState,
  NoPermissionState,
} from '@apnatown/ui/feedback/StateViews';
import { failureCode } from '../../../shared/api/result';
import { Alert } from '../../businesses/parts';
import { EmbedCard } from '../EmbedCard';
import { useLinkTargets } from './gallery-queries';
import { isDenied, refocus, useMediaError } from './parts';
import {
  moved,
  useDeleteVideo,
  useEditVideo,
  useReorder,
  useVideoManager,
} from './queries';
import { VideoCard } from './VideoCard';
import { VideoEditorSheet } from './VideoEditorSheet';

const orderConflict = new Set(['MEDIA_VERSION_CONFLICT', 'MEDIA_LINK_TARGET_INVALID']);

export function VideoList({
  kind,
  businessId,
  nonce,
  notify,
}: {
  kind: BusinessKind;
  businessId: string;
  nonce: string;
  notify: (message: string) => void;
}) {
  const t = useTranslations('vendor.media.videos');
  const message = useMediaError();
  const list = useVideoManager(kind);
  const reorder = useReorder(kind, 'videos');
  const toggle = useEditVideo(kind);
  const remove = useDeleteVideo(kind);
  const { options } = useLinkTargets(kind);
  const [editing, setEditing] = useState<{ id: string; seq: number }>();
  const [previewing, setPreviewing] = useState<Video>();
  const [removing, setRemoving] = useState<Video>();
  const [announcement, setAnnouncement] = useState('');
  const opener = useRef<HTMLElement | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const items = list.data?.items ?? [];

  function restoreFocus() {
    const target = opener.current;
    requestAnimationFrame(() =>
      (target?.isConnected ? target : heading.current)?.focus(),
    );
  }
  function open<T>(set: (value: T) => void, value: T) {
    opener.current = document.activeElement as HTMLElement | null;
    set(value);
  }

  function move(video: Video, delta: -1 | 1) {
    const ids = moved(items.map((item) => item.id), video.id, delta);
    if (!ids) return;
    const position = ids.indexOf(video.id) + 1;
    reorder.save(ids, () => setAnnouncement(t('moved', { position })));
    const edge = position === 1 || position === ids.length;
    refocus(`[data-move="${video.id}:${edge ? -delta : delta}"] button`);
  }

  if (list.isPending)
    return (
      <div className="grid gap-3 tablet:grid-cols-2" aria-busy="true">
        {[0, 1].map((key) => (
          <div key={key} className="h-64 overflow-hidden rounded-lg border border-border">
            <Skeleton shape="block" label={t('loading')} />
          </div>
        ))}
      </div>
    );
  if (list.isError && isDenied(list.error))
    return (
      <NoPermissionState
        headingLevel="h2"
        title={t('forbiddenTitle')}
        message={t('forbidden')}
        action={null}
      />
    );
  if (list.isError)
    return (
      <ErrorState
        headingLevel="h2"
        title={t('errorTitle')}
        message={message(list.error)}
        action={
          <Button disabled={list.isFetching} onClick={() => void list.refetch()}>
            {t('retry')}
          </Button>
        }
      />
    );

  const orderError = reorder.mutation.error;
  return (
    <section aria-labelledby="owner-videos-heading" className="grid gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="owner-videos-heading"
          ref={heading}
          tabIndex={-1}
          className="m-0 text-h3 focus-visible:ring-focus"
        >
          {t('title', { count: items.length })}
        </h2>
        {items.length > 1 && (
          <p className="m-0 text-small text-text-2">{t('orderHint')}</p>
        )}
      </div>
      {orderError && (
        <Alert
          tone={orderConflict.has(failureCode(orderError)) ? 'warn' : 'bad'}
          role="alert"
          action={
            <Button size="card" variant="ghost" onClick={() => reorder.mutation.reset()}>
              {t('dismiss')}
            </Button>
          }
        >
          <p className="m-0">
            {orderConflict.has(failureCode(orderError))
              ? t('orderConflict')
              : message(orderError)}
          </p>
        </Alert>
      )}
      {toggle.mutation.error && !editing && (
        <Alert tone="bad" role="alert">
          <p className="m-0">{message(toggle.mutation.error)}</p>
        </Alert>
      )}
      {items.length === 0 ? (
        <EmptyState
          headingLevel="h2"
          icon="🎬"
          title={t('emptyTitle')}
          message={t('empty')}
          action={null}
        />
      ) : (
        <ol className="m-0 grid list-none gap-3 p-0 tablet:grid-cols-2">
          {items.map((video, index) => (
            <li key={video.id} className="min-w-0">
              <VideoCard
                kind={kind}
                video={video}
                position={index + 1}
                total={items.length}
                orderBusy={reorder.mutation.isPending}
                writeBusy={toggle.mutation.isPending}
                links={options}
                actions={{
                  onMove: (delta) => move(video, delta),
                  onToggle: (field, value) =>
                    toggle.submit(
                      video.id,
                      { [field]: value, expectedVersion: video.version },
                      () => notify(t('visibilitySaved')),
                    ),
                  onPreview: () => open(setPreviewing, video),
                  onEdit: () => open(setEditing, { id: video.id, seq: Date.now() }),
                  onRemove: () => {
                    remove.mutation.reset();
                    open(setRemoving, video);
                  },
                }}
              />
            </li>
          ))}
        </ol>
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {editing && (
        <VideoEditorSheet
          key={editing.seq}
          kind={kind}
          businessId={businessId}
          videoId={editing.id}
          onClose={() => {
            setEditing(undefined);
            restoreFocus();
          }}
          onSaved={(text) => {
            setEditing(undefined);
            notify(text);
            restoreFocus();
          }}
        />
      )}
      <Sheet
        open={previewing !== undefined}
        title={t('previewTitle')}
        closeLabel={t('close')}
        onOpenChange={(next) => {
          if (next) return;
          setPreviewing(undefined);
          restoreFocus();
        }}
      >
        {previewing && (
          <div className="grid gap-3">
            <EmbedCard playback={previewing.playback} active nonce={nonce} />
            {previewing.status !== 'approved' && (
              <p className="m-0 text-small text-text-2">{t('previewPrivate')}</p>
            )}
          </div>
        )}
      </Sheet>
      <ConfirmDialog
        open={removing !== undefined}
        tone="danger"
        title={t('removeTitle')}
        impact={
          remove.mutation.error
            ? message(remove.mutation.error)
            : t('removeImpact')
        }
        cancelLabel={t('cancel')}
        confirmLabel={t('removeConfirm')}
        busy={remove.mutation.isPending}
        onOpenChange={(next) => {
          if (next) return;
          setRemoving(undefined);
          restoreFocus();
        }}
        onConfirm={() => {
          if (!removing) return;
          remove.remove(removing, () => {
            setRemoving(undefined);
            notify(t('removed'));
            requestAnimationFrame(() => heading.current?.focus());
          });
        }}
      />
    </section>
  );
}
