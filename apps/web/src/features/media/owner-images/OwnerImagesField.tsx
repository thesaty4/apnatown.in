'use client';

import { useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Switch } from '@apnatown/ui/primitives/Selection';
import { useOnline } from '../../../shared/hooks/use-online';
import { ownerPreviewPath, type OwnerMediaItem } from './api';
import {
  DropZone,
  PolicyNote,
  PreviewImage,
  usePolicyText,
  usePolicyView,
} from './parts';
import type { NavIconName } from '../../../shared/ui/NavIcon';
import { IconButton, PendingTile } from './tiles';
import { useUploadQueue } from './use-upload-queue';

export type OwnerImagesFieldProps = {
  purpose: 'product' | 'service';
  businessId: string;
  value: OwnerMediaItem[];
  onChange: (next: OwnerMediaItem[]) => void;
  /** Listing image limit (products/services allow five). */
  max?: number;
  disabled?: boolean;
  label: string;
  describedBy?: string;
  /** `showInGallery` for newly added images (business Gallery default). */
  galleryDefault: boolean;
  /** Optional: true while any chosen file is still checking/uploading, so the
   * owning form can block Save until every image has an asset ID. */
  onPendingChange?: (pending: boolean) => void;
};

/**
 * Ordered listing photos: upload (button or drop), per-file pending/retry,
 * reorder with buttons (first image is the cover), remove and a per-image
 * Gallery consent toggle. Only server-issued asset IDs reach `onChange`.
 */
export function OwnerImagesField({
  purpose,
  businessId,
  value,
  onChange,
  max = 5,
  disabled = false,
  label,
  describedBy,
  galleryDefault,
  onPendingChange,
}: OwnerImagesFieldProps) {
  const t = useTranslations('media.ownerImages');
  const online = useOnline();
  const view = usePolicyView(purpose, businessId);
  const policy = view.state === 'ready' ? view.policy : undefined;
  const text = usePolicyText(policy);
  const hintId = useId();
  const uid = useId();
  const [announcement, setAnnouncement] = useState('');
  const [refused, setRefused] = useState(0);
  const latest = useRef(value);
  latest.current = value;
  const controls = useRef(new Map<string, HTMLButtonElement | null>());
  const queue = useUploadQueue({
    purpose,
    businessId,
    onPendingChange,
    onUploaded: (result) => {
      if (latest.current.some((item) => item.assetId === result.assetId))
        return;
      const next = [
        ...latest.current,
        { assetId: result.assetId, showInGallery: galleryDefault },
      ];
      latest.current = next;
      onChange(next);
      setAnnouncement(t('uploaded', { position: next.length }));
    },
  });
  const capacity = max - value.length - queue.active;

  function focusLater(key: string, fallback?: string) {
    requestAnimationFrame(() => {
      const target = controls.current.get(key);
      const control =
        target && !target.disabled
          ? target
          : fallback
            ? controls.current.get(fallback)
            : undefined;
      control?.focus();
    });
  }

  function move(index: number, by: -1 | 1) {
    const target = index + by;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item!);
    onChange(next);
    setAnnouncement(
      t(target === 0 ? 'movedToCover' : 'moved', { position: target + 1 }),
    );
    const id = item!.assetId;
    focusLater(`${id}:${by}`, `${id}:${-by}`);
  }

  function remove(index: number) {
    const next = value.filter((_, at) => at !== index);
    onChange(next);
    setAnnouncement(t('removed', { position: index + 1 }));
    const neighbour = next[Math.min(index, next.length - 1)];
    if (neighbour) focusLater(`${neighbour.assetId}:remove`);
  }

  return (
    <fieldset
      className="m-0 grid min-w-0 gap-3 border-0 p-0"
      aria-describedby={[hintId, describedBy].filter(Boolean).join(' ')}
    >
      <legend className="mb-1 flex w-full flex-wrap items-baseline justify-between gap-2 p-0 text-field-label font-semibold">
        <span>{label}</span>
        <span className="text-caption font-normal text-muted">
          {t('count', { count: value.length, max })}
        </span>
      </legend>
      <p
        id={hintId}
        className="m-0 text-small text-text-2 [overflow-wrap:anywhere]"
      >
        {t('multiHint')}
        {text.hint && ` ${text.hint}`}
      </p>
      <PolicyNote view={view} />
      {(value.length > 0 || queue.items.length > 0) && (
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 tablet:grid-cols-3">
          {value.map((item, index) => {
            const position = index + 1;
            const button = (
              key: string,
              icon: NavIconName,
              name: string,
              onClick: () => void,
              off = false,
            ) => (
              <IconButton
                ref={(node) => {
                  controls.current.set(`${item.assetId}:${key}`, node);
                }}
                icon={icon}
                label={name}
                disabled={disabled || off}
                onClick={onClick}
              />
            );
            return (
              <li
                key={item.assetId}
                className="grid min-w-0 content-start gap-1.5 rounded-md border border-border bg-surface p-1.5 shadow-1"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                  <PreviewImage
                    src={ownerPreviewPath(item.assetId)}
                    alt={t('photoAlt', { position })}
                  />
                  {index === 0 && (
                    <span className="absolute start-1.5 top-1.5 rounded-pill bg-text px-2 py-0.5 text-caption font-semibold text-surface">
                      {t('cover')}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-1">
                  {button(
                    '-1',
                    'cl',
                    t('moveEarlier', { position }),
                    () => move(index, -1),
                    index === 0,
                  )}
                  {button(
                    '1',
                    'cr',
                    t('moveLater', { position }),
                    () => move(index, 1),
                    index === value.length - 1,
                  )}
                  {button('remove', 'trash', t('remove', { position }), () =>
                    remove(index),
                  )}
                </div>
                <span id={`${uid}-${index}-photo`} className="sr-only">
                  {t('photoAlt', { position })}
                </span>
                <Switch
                  id={`${uid}-${index}-gallery`}
                  label={t('showInGallery')}
                  checked={item.showInGallery}
                  disabled={disabled}
                  aria-labelledby={`${uid}-${index}-gallery-label ${uid}-${index}-photo`}
                  wrapperClassName="text-small"
                  onChange={(event) =>
                    onChange(
                      value.map((entry, at) =>
                        at === index
                          ? { ...entry, showInGallery: event.target.checked }
                          : entry,
                      ),
                    )
                  }
                />
              </li>
            );
          })}
          {queue.items.map((item) => (
            <PendingTile
              key={item.id}
              item={item}
              message={
                item.issue ? text.issue(item.issue, item.name) : undefined
              }
              disabled={disabled}
              onRetry={() => queue.retry(item.id)}
              onRemove={() => queue.remove(item.id)}
            />
          ))}
        </ul>
      )}
      {capacity > 0 ? (
        <DropZone
          label={t(value.length ? 'addMore' : 'dropLabel')}
          buttonLabel={t('choose')}
          accept={policy?.allowedMimeTypes.join(',')}
          multiple
          disabled={disabled || !policy || !online}
          describedBy={hintId}
          onFiles={(files) => {
            if (!policy) return;
            setRefused(queue.add(files, policy, capacity));
          }}
        />
      ) : (
        <p role="note" className="m-0 text-small text-text-2">
          {t('limitReached', { max })}
        </p>
      )}
      {!online && (
        <p role="status" className="m-0 text-small text-warning">
          {t('issues.offline')}
        </p>
      )}
      {refused > 0 && (
        <p role="alert" className="m-0 text-small text-error">
          {t('tooMany', { max, count: refused })}
        </p>
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </fieldset>
  );
}
