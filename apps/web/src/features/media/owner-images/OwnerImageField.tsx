'use client';

import { useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@apnatown/ui/primitives/Button';
import { useOnline } from '../../../shared/hooks/use-online';
import { ownerPreviewPath } from './api';
import { PendingTile } from './tiles';
import {
  DropZone,
  PolicyNote,
  PreviewImage,
  usePolicyText,
  usePolicyView,
} from './parts';
import { useUploadQueue } from './use-upload-queue';

export type OwnerImageFieldProps = {
  purpose: 'business_profile_logo' | 'business_profile_cover' | 'video_thumbnail';
  businessId: string;
  value: string | null;
  onChange: (assetId: string | null) => void;
  disabled?: boolean;
  label: string;
  /** Optional: blocks the owning form's Save while a file is uploading. */
  onPendingChange?: (pending: boolean) => void;
  /** Optional localized server error for this field (e.g. media invalid). */
  error?: string | undefined;
};

/** Localized copy per single-image purpose (logo square, cover/thumbnail wide). */
const copy = {
  business_profile_logo: { hint: 'logoHint', alt: 'logoAlt', drop: 'dropLogo' },
  business_profile_cover: { hint: 'coverHint', alt: 'coverAlt', drop: 'dropCover' },
  video_thumbnail: {
    hint: 'thumbnailHint',
    alt: 'thumbnailAlt',
    drop: 'dropThumbnail',
  },
} as const;

/**
 * Single image (logo square 1:1; cover or video thumbnail wide 16:9). A new file is
 * uploaded immediately; only the returned asset ID is handed to the form,
 * which saves it with the profile.
 */
export function OwnerImageField({
  purpose,
  businessId,
  value,
  onChange,
  disabled = false,
  label,
  onPendingChange,
  error,
}: OwnerImageFieldProps) {
  const t = useTranslations('media.ownerImages');
  const online = useOnline();
  const view = usePolicyView(purpose, businessId);
  const policy = view.state === 'ready' ? view.policy : undefined;
  const text = usePolicyText(policy);
  const labelId = useId();
  const hintId = useId();
  const errorId = useId();
  const [announcement, setAnnouncement] = useState('');
  const queue = useUploadQueue({
    purpose,
    businessId,
    onPendingChange,
    onUploaded: (result) => {
      onChange(result.assetId);
      setAnnouncement(t('singleUploaded'));
    },
  });
  const logo = purpose === 'business_profile_logo';
  const keys = copy[purpose];
  const frame = logo ? 'aspect-square w-28 shrink-0' : 'aspect-video w-full';
  const pending = queue.items[0];
  const busy = queue.active > 0;
  const canChoose = !disabled && Boolean(policy) && online && !busy;
  const choose = (files: File[]) => {
    if (!policy || !files[0]) return;
    queue.items.forEach((item) => queue.remove(item.id));
    queue.add(files.slice(0, 1), policy, 1);
  };
  const src = value ? ownerPreviewPath(value) : undefined;

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-describedby={[hintId, error ? errorId : undefined]
        .filter(Boolean)
        .join(' ')}
      className="grid min-w-0 content-start gap-2"
    >
      <p id={labelId} className="m-0 text-field-label font-semibold">
        {label}
      </p>
      <p
        id={hintId}
        className="m-0 text-small text-text-2 [overflow-wrap:anywhere]"
      >
        {t(keys.hint)}
        {text.hint && ` ${text.hint}`}
      </p>
      {pending ? (
        <ul className={`m-0 grid list-none p-0 ${logo ? 'w-40' : ''}`}>
          <PendingTile
            item={pending}
            aspect={logo ? 'aspect-square' : 'aspect-video'}
            message={
              pending.issue
                ? text.issue(pending.issue, pending.name)
                : undefined
            }
            disabled={disabled}
            onRetry={() => queue.retry(pending.id)}
            onRemove={() => queue.remove(pending.id)}
          />
        </ul>
      ) : value ? (
        <div
          className={`flex min-w-0 gap-3 ${logo ? 'flex-wrap items-center' : 'flex-col'}`}
        >
          <div
            className={`${frame} overflow-hidden border border-border bg-surface-2 ${logo ? 'rounded-lg' : 'rounded-md'}`}
          >
            <PreviewImage
              key={value}
              src={src}
              alt={t(keys.alt)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <ReplaceButton
              label={t('replace')}
              accept={policy?.allowedMimeTypes.join(',')}
              disabled={!canChoose}
              describedBy={hintId}
              onFile={(file) => choose([file])}
            />
            <Button
              type="button"
              size="small"
              variant="text"
              disabled={disabled || busy}
              onClick={() => {
                onChange(null);
                setAnnouncement(t('singleRemoved'));
              }}
            >
              {t('removeSingle')}
            </Button>
          </div>
        </div>
      ) : (
        <DropZone
          label={t(keys.drop)}
          buttonLabel={t('chooseSingle')}
          accept={policy?.allowedMimeTypes.join(',')}
          multiple={false}
          disabled={!canChoose}
          describedBy={hintId}
          onFiles={choose}
        />
      )}
      <PolicyNote view={view} />
      {!online && (
        <p role="status" className="m-0 text-small text-warning">
          {t('issues.offline')}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="m-0 text-field-error text-error"
        >
          {error}
        </p>
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

function ReplaceButton({
  label,
  accept,
  disabled,
  describedBy,
  onFile,
}: {
  label: string;
  accept: string | undefined;
  disabled: boolean;
  describedBy: string;
  onFile: (file: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={input}
        type="file"
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        accept={accept}
        disabled={disabled}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          if (file) onFile(file);
        }}
      />
      <Button
        type="button"
        size="small"
        variant="ghost"
        disabled={disabled}
        aria-describedby={describedBy}
        onClick={() => input.current?.click()}
      >
        {label}
      </Button>
    </>
  );
}
