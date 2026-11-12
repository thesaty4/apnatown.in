'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import type { TaxonomyImage } from '@apnatown/shared/catalog';
import { Avatar } from '@apnatown/ui/data/Avatar';
import { Button } from '@apnatown/ui/primitives/Button';
import { useAdmin } from '../../admin';
import { useTaxonomyImageUpload } from '../image-upload';
import { taxonomySrcSet } from '../parts';
import { failureCode } from '../../../shared/api/result';
export function TaxonomyImageField({
  assetId,
  image,
  previewLabel,
  onAssetIdChange,
  onPendingChange,
  onScopeReset,
}: {
  assetId: string | null;
  image?: TaxonomyImage | undefined;
  previewLabel: string;
  onAssetIdChange: (assetId: string | null) => void;
  onPendingChange: (pending: boolean) => void;
  onScopeReset: () => void;
}) {
  const t = useTranslations('catalog.admin.categories');
  const { policy: policyQuery, upload } = useTaxonomyImageUpload();
  const policy = policyQuery.data?.policy;
  const { lifecycle } = useAdmin();
  const [file, setFile] = useState<File>();
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [uploaded, setUploaded] = useState<{
    assetId: string; path: string; width: number; height: number;
  }>();
  const key = useRef<string | undefined>(undefined);
  const [validationError, setValidationError] = useState<
    'imageTypeInvalid' | 'imageSizeInvalid'
  >();
  const inputRef = useRef<HTMLInputElement>(null);
  const resetRef = useRef(onScopeReset);
  const pendingRef = useRef(onPendingChange);

  useEffect(() => {
    resetRef.current = onScopeReset;
  }, [onScopeReset]);

  useEffect(() => {
    pendingRef.current = onPendingChange;
  }, [onPendingChange]);

  useEffect(() => {
    const unsubscribe = lifecycle.subscribe(() => {
      setFile(undefined);
      setPreviewUrl(undefined);
      setValidationError(undefined);
      setUploaded(undefined);
      key.current = undefined;
      pendingRef.current(false);
      resetRef.current();
    });
    return unsubscribe;
  }, [lifecycle]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(undefined);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    setValidationError(undefined);
    upload.reset();
    if (!selected) return;
    if (!policy || !policy.allowedMimeTypes.some((type) => type === selected.type)) {
      setFile(undefined);
      onPendingChange(false);
      setValidationError('imageTypeInvalid');
      return;
    }
    if (selected.size > policy.maxBytes) {
      setFile(undefined);
      onPendingChange(false);
      setValidationError('imageSizeInvalid');
      return;
    }
    setFile(selected);
    key.current = crypto.randomUUID();
    onPendingChange(true);
  }

  function discardSelection() {
    setFile(undefined);
    setValidationError(undefined);
    key.current = undefined;
    upload.reset();
    onPendingChange(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  const src = previewUrl ?? (assetId === uploaded?.assetId ? uploaded?.path
    : assetId !== null ? image?.path : undefined);
  const hasAttachment = assetId !== null;
  const help = policy ? t('configuredImageHelp', {
    types: policy.allowedMimeTypes.map((type) => type.slice(6).toUpperCase()).join(', '),
    width: policy.minWidth, height: policy.minHeight,
    megabytes: (policy.maxBytes / 1_048_576).toFixed(2),
  }) : t('imageHelp');
  const error = upload.isError ? failureCode(upload.error) : undefined;
  const uploadError = error === 'MEDIA_TOO_LARGE' ? 'imageSizeInvalid'
    : error === 'MEDIA_TYPE_NOT_ALLOWED' ? 'imageTypeInvalid'
    : error === 'MEDIA_IMAGE_PROCESSING_FAILED' ? 'imageProcessingFailed'
    : 'uploadFailed';

  return (
    <section className="grid min-w-0 gap-2 rounded-md border border-border p-3">
      <div className="grid gap-1">
        <h3 className="text-small font-semibold text-text">
          {t('imageTitle')}
        </h3>
        <p className="text-small text-text-2 [overflow-wrap:anywhere]">
          {help}
        </p>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <Avatar
          label={src ? t('imagePreview', { name: previewLabel }) : ''}
          emoji="🏷️"
          size="mini"
          {...(src ? { src } : {})}
          srcSet={!file && assetId !== uploaded?.assetId ? taxonomySrcSet(image) : undefined}
          imageWidth={uploaded?.width ?? image?.width}
          imageHeight={uploaded?.height ?? image?.height}
        />
        <div className="grid min-w-0 flex-1 gap-2">
          <label
            htmlFor="taxonomy-image-file"
            className="text-small font-medium text-text"
          >
            {t('chooseImage')}
          </label>
          <input
            ref={inputRef}
            id="taxonomy-image-file"
            type="file"
            accept={policy?.allowedMimeTypes.join(',')}
            disabled={!policy || policyQuery.isError || policyQuery.isFetching || upload.isPending}
            aria-describedby="taxonomy-image-help taxonomy-image-status"
            onChange={chooseFile}
            className="min-h-button-min-height w-full min-w-0 rounded-md border border-border bg-surface px-2 py-2 text-small text-text file:mr-2 file:min-h-button-min-height file:rounded-md file:border-0 file:bg-primary-soft file:px-3 file:font-semibold file:text-text focus-visible:ring-focus"
          />
        </div>
      </div>
      <span id="taxonomy-image-help" className="sr-only">
        {help}
      </span>
      {validationError && (
        <p
          role="alert"
          className="text-small text-error [overflow-wrap:anywhere]"
        >
          {t(validationError)}
        </p>
      )}
      {file && (
        <p
          id="taxonomy-image-status"
          role="status"
          aria-live="polite"
          className="text-small text-text-2 [overflow-wrap:anywhere]"
        >
          {t('selectedImageNotUploaded', { name: file.name })}
        </p>
      )}
      {(policyQuery.isPending || policyQuery.isError) && (
        <p
          id="taxonomy-image-status"
          role="status"
          className="text-small text-text-2 [overflow-wrap:anywhere]"
        >
          {t(policyQuery.isPending ? 'loadingImagePolicy' : 'uploadUnavailable')}
        </p>
      )}
      {policyQuery.isError && <Button variant="outline" disabled={policyQuery.isFetching}
        onClick={() => void policyQuery.refetch()}>{t('retryUpload')}</Button>}
      {error && <p role="alert" className="text-small text-error">{t(uploadError)}</p>}
      {uploaded && !file && <p role="status" className="text-small text-text-2">{t('uploadReady')}</p>}
      {file && (
        <Button
          disabled={!policy || policyQuery.isError}
          loading={upload.isPending}
          aria-describedby="taxonomy-image-status"
          className="w-full sm:w-auto"
          onClick={() => {
            if (!key.current) return;
            void upload.run({ file, key: key.current }, (result) => {
              setUploaded({
                assetId: result.assetId, path: result.previewPath,
                width: result.width, height: result.height,
              });
              onAssetIdChange(result.assetId);
              discardSelection();
            });
          }}
        >
          {t('uploadImage')}
        </Button>
      )}
      {file && (
        <Button
          variant="outline"
          disabled={upload.isPending}
          className="w-full sm:w-auto"
          onClick={discardSelection}
        >
          {t('discardImageSelection')}
        </Button>
      )}
      {hasAttachment && (
        <Button
          variant="danger"
          disabled={upload.isPending}
          className="w-full sm:w-auto"
          onClick={() => {
            discardSelection();
            setUploaded(undefined);
            onAssetIdChange(null);
          }}
        >
          {t('removeImage')}
        </Button>
      )}
    </section>
  );
}
