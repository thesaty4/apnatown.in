'use client';

import { useTranslations } from 'next-intl';
import type { BusinessKind } from '@apnatown/shared/businesses';
import { OwnerImageField } from '../../media/owner-images';
import { useFieldError, type SectionProps } from './shared';

export type ImageSlot = 'logo' | 'cover';

/**
 * Business logo (1:1) and cover (16:9) through the shared owner uploader. The
 * returned asset IDs travel with the profile PATCH (`logoAssetId` /
 * `coverAssetId`); uploads open only while the server grants `uploadMedia`.
 */
export function ImageSlots({
  kind,
  businessId,
  canUpload,
  form,
  set,
  errors,
  disabled,
  onPendingChange,
}: SectionProps & {
  kind: BusinessKind;
  businessId: string;
  canUpload: boolean;
  onPendingChange: (slot: ImageSlot, pending: boolean) => void;
}) {
  const t = useTranslations('business.media');
  const fieldError = useFieldError(errors);
  if (!canUpload) return <LockedSlots kind={kind} />;
  return (
    <div className="grid min-w-0 gap-4 tablet:grid-cols-[auto_minmax(0,1fr)]">
      <OwnerImageField
        purpose="business_profile_logo"
        businessId={businessId}
        label={t('logo')}
        value={form.logoAssetId}
        onChange={(logoAssetId) => set({ logoAssetId })}
        disabled={Boolean(disabled)}
        onPendingChange={(pending) => onPendingChange('logo', pending)}
        error={fieldError('logoAssetId')}
      />
      <OwnerImageField
        purpose="business_profile_cover"
        businessId={businessId}
        label={t('cover')}
        value={form.coverAssetId}
        onChange={(coverAssetId) => set({ coverAssetId })}
        disabled={Boolean(disabled)}
        onPendingChange={(pending) => onPendingChange('cover', pending)}
        error={fieldError('coverAssetId')}
      />
    </div>
  );
}

/** Profile edits are closed (e.g. suspended/inactive): honest, inert slots. */
function LockedSlots({ kind }: { kind: BusinessKind }) {
  const t = useTranslations('business.media');
  return (
    <div className="grid min-w-0 gap-2">
      <div className="grid min-w-0 gap-3 tablet:grid-cols-2">
        {(['logo', 'cover'] as const).map((slot) => (
          <div key={slot} className="grid min-w-0 gap-1">
            <p className="m-0 text-field-label font-semibold">{t(slot)}</p>
            <div
              aria-disabled="true"
              className="grid justify-items-center gap-1 rounded-md border-2 border-dashed border-border-strong bg-surface-2 p-4 text-center text-small text-muted"
            >
              <span aria-hidden="true" className="text-h3">
                {kind === 'shop' ? '🏪' : '🔧'}
              </span>
              <span>{t(slot === 'logo' ? 'logoHint' : 'coverHint')}</span>
            </div>
          </div>
        ))}
      </div>
      <p role="note" className="m-0 text-small text-text-2">
        <span aria-hidden="true">ℹ️ </span>
        {t('unavailable')}
      </p>
    </div>
  );
}
