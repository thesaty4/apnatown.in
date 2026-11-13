'use client';

import { useId, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Button } from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../../shared/api/result';
import { NavIcon } from '../../../shared/ui/NavIcon';
import type { OwnerImagePolicy, OwnerImagePurpose } from './api';
import { issueForCode, type UploadIssue } from './issues';
import { useOwnerImagePolicy } from './queries';

const typeLabel: Record<string, string> = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
};

export type PolicyView =
  | { state: 'loading' }
  | { state: 'ready'; policy: OwnerImagePolicy }
  | { state: 'unavailable' | 'forbidden' | 'error'; retry: () => void };

/** Owner upload policy reduced to the states every uploader renders. */
export function usePolicyView(
  purpose: OwnerImagePurpose,
  businessId: string,
): PolicyView {
  const query = useOwnerImagePolicy(purpose, businessId);
  const retry = () => void query.refetch();
  if (query.data)
    return query.data.policy.enabled
      ? { state: 'ready', policy: query.data.policy }
      : { state: 'unavailable', retry };
  if (query.isError) {
    const code = failureCode(query.error);
    if (code === 'MEDIA_UPLOAD_POLICY_REQUIRED')
      return { state: 'unavailable', retry };
    if (issueForCode(code, true) === 'forbidden')
      return { state: 'forbidden', retry };
    return { state: 'error', retry };
  }
  return { state: 'loading' };
}

/** Message parameters shared by policy hints and file issues. */
export function usePolicyText(policy: OwnerImagePolicy | undefined) {
  const t = useTranslations('media.ownerImages');
  const format = useFormatter();
  const types = policy
    ? format.list(
        policy.allowedMimeTypes.map((type) => typeLabel[type] ?? type),
        { type: 'disjunction' },
      )
    : '';
  const size = policy
    ? format.number(policy.maxBytes / 1_048_576, { maximumFractionDigits: 1 })
    : '';
  const params = {
    types,
    size,
    width: policy ? format.number(policy.minWidth) : '',
    height: policy ? format.number(policy.minHeight) : '',
  };
  return {
    hint: policy ? t('policyHint', params) : '',
    issue: (issue: UploadIssue, name: string) =>
      t(`issues.${issue}`, { ...params, name }),
  };
}

/** Same-origin preview with a neutral fallback; never a provider URL. */
export function PreviewImage({
  src,
  alt,
  className = '',
}: {
  src: string | undefined;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState<string>();
  if (!src || failed === src)
    return (
      <span
        role="img"
        aria-label={alt}
        className={`grid size-full place-items-center bg-surface-2 text-h3 text-muted ${className}`}
      >
        <span aria-hidden="true">🖼️</span>
      </span>
    );
  return (
    // Uploader-only, no-store gateway bytes: never through the Next optimizer.
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(src)}
      className={`block size-full object-cover ${className}`}
    />
  );
}

/**
 * Prototype `.drop` area: dashed target with a real button (keyboard and
 * screen-reader path) opening a native file input; drag-and-drop is an
 * optional pointer shortcut onto the same handler.
 */
export function DropZone({
  label,
  hint,
  buttonLabel,
  accept,
  multiple,
  disabled,
  describedBy,
  onFiles,
  children,
}: {
  label: string;
  hint?: string | undefined;
  buttonLabel: string;
  accept: string | undefined;
  multiple: boolean;
  disabled: boolean;
  describedBy?: string | undefined;
  onFiles: (files: File[]) => void;
  children?: ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const [over, setOver] = useState(false);
  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setOver(false);
    if (disabled) return;
    const files = [...event.dataTransfer.files];
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  };
  return (
    <div
      onDragOver={(event) => {
        if (disabled) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
      className={`grid min-w-0 justify-items-center gap-1 rounded-md border-2 border-dashed p-4 text-center transition-colors duration-2 ease-standard motion-reduce:transition-none ${over ? 'border-primary bg-primary-soft' : 'border-border-strong bg-surface-2'} ${disabled ? 'opacity-60' : ''}`}
    >
      <NavIcon name="camera" className="size-5.5 text-text-2" />
      <span className="text-small text-text [overflow-wrap:anywhere]">
        {label}
      </span>
      {hint && (
        <span
          id={hintId}
          className="text-caption text-muted [overflow-wrap:anywhere]"
        >
          {hint}
        </span>
      )}
      {children}
      <input
        ref={input}
        type="file"
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => {
          const files = [...(event.currentTarget.files ?? [])];
          event.currentTarget.value = '';
          if (files.length) onFiles(files);
        }}
      />
      <Button
        type="button"
        size="small"
        variant="ghost"
        className="mt-1.5 gap-1.5"
        disabled={disabled}
        aria-describedby={
          [hint ? hintId : undefined, describedBy].filter(Boolean).join(' ') ||
          undefined
        }
        onClick={() => input.current?.click()}
      >
        <NavIcon name="upload" className="size-4" />
        {buttonLabel}
      </Button>
    </div>
  );
}

/** Policy-level note (loading / unavailable / no-permission / error+retry). */
export function PolicyNote({ view }: { view: PolicyView }) {
  const t = useTranslations('media.ownerImages');
  if (view.state === 'ready') return null;
  if (view.state === 'loading')
    return (
      <p role="status" className="m-0 text-small text-text-2">
        {t('policyLoading')}
      </p>
    );
  return (
    <div
      role={view.state === 'error' ? 'alert' : 'note'}
      className="flex min-w-0 flex-wrap items-center gap-2 rounded-md border border-info bg-info-soft px-3 py-2 text-small text-text"
    >
      <span aria-hidden="true">{view.state === 'forbidden' ? '🔒' : 'ℹ️'}</span>
      <span className="min-w-0 flex-1 basis-48 [overflow-wrap:anywhere]">
        {t(`policy.${view.state}`)}
      </span>
      {view.state === 'error' && (
        <Button size="small" variant="outline" onClick={view.retry}>
          {t('retry')}
        </Button>
      )}
    </div>
  );
}
