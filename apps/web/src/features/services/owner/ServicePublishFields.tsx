'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { SERVICE_MEDIA_LIMIT } from '@apnatown/shared/services';
import { Switch } from '@apnatown/ui/primitives/Selection';
import { OwnerImagesField } from '../../media/owner-images';
import { SECTION, type FieldsProps } from './ServiceFormFields';

/** Photos (shared owner uploader) and the Gallery consent switch. */
export function MediaFields({
  form,
  set,
  error,
  disabled,
  businessId,
  onUploadsPending,
}: FieldsProps) {
  const t = useTranslations('service.manager.form');
  const errorId = useId();
  const mediaError = error('media');
  return (
    <div className={SECTION}>
      <OwnerImagesField
        purpose="service"
        businessId={businessId}
        label={t('photos')}
        value={form.media}
        onChange={(media) => set({ media })}
        max={SERVICE_MEDIA_LIMIT}
        disabled={disabled}
        galleryDefault={form.galleryVisible}
        onPendingChange={onUploadsPending}
        {...(mediaError && { describedBy: errorId })}
      />
      {mediaError && (
        <p id={errorId} className="m-0 text-small text-field-error">
          <span aria-hidden="true">⚠ </span>
          {mediaError}
        </p>
      )}
      <div className="rounded-md border border-border bg-surface-2 px-3">
        <Switch
          label={t('galleryVisible')}
          description={t('galleryVisibleHint')}
          checked={form.galleryVisible}
          disabled={disabled}
          onChange={(event) => set({ galleryVisible: event.target.checked })}
        />
      </div>
    </div>
  );
}

/** Active switch and the Premium featured selection. */
export function VisibilityFields({
  form,
  set,
  error,
  disabled,
  featuredInactive,
  statusLocked,
}: FieldsProps & {
  featuredInactive: boolean;
  /** The server offers no status edge for this service right now. */
  statusLocked: boolean;
}) {
  const t = useTranslations('service.manager.form');
  const featuredError = error('featuredSelected');
  return (
    <div className={SECTION}>
      <Switch
        label={t('active')}
        description={t('activeHint')}
        checked={form.status === 'active'}
        disabled={disabled || statusLocked}
        onChange={(event) =>
          set({ status: event.target.checked ? 'active' : 'paused' })
        }
      />
      <Switch
        label={t('featured')}
        description={
          featuredInactive ? t('featuredInactive') : t('featuredHint')
        }
        checked={form.featuredSelected}
        disabled={disabled}
        {...(featuredError && { error: featuredError })}
        onChange={(event) => set({ featuredSelected: event.target.checked })}
      />
    </div>
  );
}
