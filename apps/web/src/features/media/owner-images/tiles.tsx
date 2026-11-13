'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@apnatown/ui/primitives/Button';
import { NavIcon, type NavIconName } from '../../../shared/ui/NavIcon';
import { finalIssues } from './issues';
import { PreviewImage } from './parts';
import type { PendingUpload } from './use-upload-queue';

/** A chosen file still checking/uploading, or failed with retry/discard. */
export function PendingTile({
  item,
  message,
  disabled,
  onRetry,
  onRemove,
  aspect = 'aspect-[4/3]',
}: {
  item: PendingUpload;
  message: string | undefined;
  disabled: boolean;
  onRetry: () => void;
  onRemove: () => void;
  aspect?: string;
}) {
  const t = useTranslations('media.ownerImages');
  const failed = item.status === 'failed';
  return (
    <li
      aria-busy={!failed}
      className={`grid min-w-0 content-start gap-1.5 rounded-md border p-1.5 ${failed ? 'border-error bg-error-soft' : 'border-border bg-surface'}`}
    >
      <div className={`relative ${aspect} overflow-hidden rounded-sm`}>
        <PreviewImage
          src={item.previewUrl}
          alt={t('pendingAlt', { name: item.name })}
        />
        {!failed && (
          <span className="absolute inset-0 grid place-items-center bg-overlay text-small font-semibold text-surface">
            <span className="flex items-center gap-2 rounded-pill bg-text px-3 py-1">
              <span
                aria-hidden="true"
                className="size-3.5 animate-spin rounded-pill border-2 border-surface border-t-transparent motion-reduce:animate-none"
              />
              {t(item.status === 'uploading' ? 'uploading' : 'waiting')}
            </span>
          </span>
        )}
      </div>
      <p className="m-0 truncate text-caption text-text-2" title={item.name}>
        {item.name}
      </p>
      {failed && (
        <>
          <p
            role="alert"
            className="m-0 text-small text-error [overflow-wrap:anywhere]"
          >
            {message}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {!(item.issue && finalIssues.has(item.issue)) && (
              <Button
                size="small"
                variant="outline"
                disabled={disabled}
                onClick={onRetry}
              >
                {t('retry')}
              </Button>
            )}
            <Button
              size="small"
              variant="text"
              disabled={disabled}
              onClick={onRemove}
            >
              {t('discard')}
            </Button>
          </div>
        </>
      )}
    </li>
  );
}

/** 48px icon-only action with an accessible name and tooltip. */
export function IconButton({
  icon,
  label,
  ref,
  ...props
}: {
  icon: NavIconName;
  label: string;
  ref?: (node: HTMLButtonElement | null) => void;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      {...props}
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className="grid min-h-touch min-w-touch place-items-center rounded-sm text-text-2 transition-colors duration-2 ease-standard hover:bg-surface-2 hover:text-text focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
    >
      <NavIcon name={icon} className="size-4.5" />
    </button>
  );
}
