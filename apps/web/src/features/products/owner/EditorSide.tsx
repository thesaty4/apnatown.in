'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PRODUCT_MEDIA_LIMIT } from '@apnatown/shared/products';
import { Card } from '@apnatown/ui/cards/Card';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { Switch } from '@apnatown/ui/primitives/Selection';
import { NavIcon } from '../../../shared/ui/NavIcon';
import { OwnerImagesField } from '../../media/owner-images';
import { fieldId, type SectionProps } from './EditorDetails';

/**
 * Right column (prototype): photos, gallery consent, sale/featured toggles,
 * shareable link and the block Save button.
 */
export function EditorSide({
  draft,
  set,
  error,
  disabled,
  galleryDefault,
  onGalleryDefault,
  shareUrl,
  saving,
  businessId,
  uploading,
  onUploadPending,
}: SectionProps & {
  businessId: string;
  uploading: boolean;
  onUploadPending: (pending: boolean) => void;
  galleryDefault: boolean;
  onGalleryDefault: (next: boolean) => void;
  shareUrl: string | undefined;
  saving: boolean;
}) {
  const t = useTranslations('products.editor');
  return (
    <div className="grid content-start gap-4">
      <Card padded className="grid gap-3">
        {/* Integration point: shared owner uploader (features/media/owner-images). */}
        <div id={fieldId('media')} tabIndex={-1} className="min-w-0 focus-visible:ring-focus">
          <OwnerImagesField
            purpose="product"
            businessId={businessId}
            value={draft.media}
            onChange={(next) => set('media', next)}
            max={PRODUCT_MEDIA_LIMIT}
            disabled={disabled}
            label={t('photos')}
            describedBy={`${fieldId('media')}-hint`}
            galleryDefault={galleryDefault}
            onPendingChange={onUploadPending}
          />
        </div>
        <p id={`${fieldId('media')}-hint`} className="m-0 text-small text-text-2">
          {t('photosHint', { max: PRODUCT_MEDIA_LIMIT })}
        </p>
        {error('media') && (
          <p role="alert" className="m-0 text-field-error font-medium text-error">
            {error('media')}
          </p>
        )}
      </Card>
      <Card padded className="border-secondary">
        <Switch
          label={t('galleryConsent')}
          description={t('galleryConsentHint')}
          checked={galleryDefault}
          disabled={disabled}
          onChange={(event) => onGalleryDefault(event.target.checked)}
        />
      </Card>
      <Card padded className="grid gap-1">
        <Switch
          label={t('available')}
          description={t('availableHint')}
          checked={draft.availableForSale}
          disabled={disabled}
          onChange={(event) => set('availableForSale', event.target.checked)}
        />
        <Switch
          label={t('published')}
          description={t('publishedHint')}
          checked={draft.published}
          disabled={disabled}
          onChange={(event) => set('published', event.target.checked)}
        />
        <Switch
          id={fieldId('featuredSelected')}
          label={t('featured')}
          description={t('featuredHint')}
          checked={draft.featuredSelected}
          disabled={disabled}
          {...(error('featuredSelected') ? { error: error('featuredSelected') ?? '' } : {})}
          onChange={(event) => set('featuredSelected', event.target.checked)}
        />
      </Card>
      {shareUrl && <ShareCard url={shareUrl} published={draft.published} />}
      <div className="hidden desktop:grid">
        <SaveBar saving={saving} disabled={disabled} uploading={uploading} />
      </div>
    </div>
  );
}

/** Save + upload-wait note. Desktop: end of the side column; mobile: the
 * form's sticky bottom bar (EditorForm), so Save is always reachable. */
export function SaveBar({
  saving,
  disabled,
  uploading,
}: {
  saving: boolean;
  disabled: boolean;
  uploading: boolean;
}) {
  const t = useTranslations('products.editor');
  const noteId = useId();
  return (
    <div className="grid gap-2">
      <Button
        type="submit"
        className="w-full"
        loading={saving}
        disabled={disabled || uploading}
        aria-describedby={uploading ? noteId : undefined}
      >
        {t('save')}
      </Button>
      {uploading && (
        <p id={noteId} role="status" className="m-0 text-small text-text-2">
          {t('waitUploads')}
        </p>
      )}
    </div>
  );
}

function ShareCard({ url, published }: { url: string; published: boolean }) {
  const t = useTranslations('products.editor');
  const [copied, setCopied] = useState<'idle' | 'copied' | 'failed'>('idle');
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied('copied');
    } catch {
      setCopied('failed');
    }
  }
  async function share() {
    try {
      await navigator.share({ url });
    } catch {
      // A dismissed share sheet is not an error.
    }
  }
  return (
    <Card padded className="grid gap-3">
      <h2 className="m-0 text-h4">{t('shareTitle')}</h2>
      <Input
        label={t('shareLabel')}
        wrapperClassName="[&>label]:sr-only"
        readOnly
        dir="ltr"
        value={url}
        hint={published ? undefined : t('shareUnpublished')}
        onFocus={(event) => event.currentTarget.select()}
      />
      <div className="flex flex-wrap gap-2">
        <Button size="small" variant="ghost" onClick={() => void copy()}>
          <NavIcon name="copy" className="size-4" />
          {t('copy')}
        </Button>
        {canShare && (
          <Button size="small" variant="ghost" onClick={() => void share()}>
            <NavIcon name="share" className="size-4" />
            {t('share')}
          </Button>
        )}
      </div>
      <p role="status" aria-live="polite" className="m-0 min-h-5 text-small">
        {copied === 'copied' ? t('copied') : copied === 'failed' ? t('copyFailed') : ''}
      </p>
    </Card>
  );
}
