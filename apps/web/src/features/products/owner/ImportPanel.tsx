'use client';

import { useId, useRef, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import type { BusinessKind } from '@apnatown/shared/businesses';
import { PRODUCT_IMPORT_HEADERS } from '@apnatown/shared/products';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { Button } from '@apnatown/ui/primitives/Button';
import { ApiFailure, failureCode } from '../../../shared/api/result';
import { Alert } from '../../businesses/parts';
import { productErrorKey } from './errors';
import { ProductIcon } from './icons';
import { ImportErrors } from './ImportErrors';
import { useImportPolicy, useImportProducts } from './queries';

const ACCEPT = '.csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** CSV template generated on the client from the server's header list. */
function downloadTemplate(headers: readonly string[]) {
  const blob = new Blob([`${headers.join(',')}\r\n`], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'apnatown-products-template.csv';
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Bulk CSV/XLSX import (S-VEND-05 / S-PROV-06). All-or-nothing: success
 * reports every row created; any failure reports that nothing was imported.
 */
export function ImportPanel({
  kind,
  open,
  onClose,
  onImported,
}: {
  kind: BusinessKind;
  open: boolean;
  onClose: () => void;
  onImported: (count: number) => void;
}) {
  const t = useTranslations('products.import');
  const te = useTranslations('products.errors');
  const format = useFormatter();
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const policy = useImportPolicy(kind, open);
  const upload = useImportProducts(kind);
  const [file, setFile] = useState<File>();
  const [selection, setSelection] = useState(0);
  const [localError, setLocalError] = useState<string>();
  const [done, setDone] = useState<number>();

  const data = policy.data;
  const policyCode = policy.isError ? failureCode(policy.error) : undefined;
  const disabled =
    data?.enabled === false ||
    policyCode === 'PRODUCT_IMPORT_POLICY_REQUIRED' ||
    (upload.isError &&
      failureCode(upload.error) === 'PRODUCT_IMPORT_POLICY_REQUIRED');
  const headers = data?.headers.length ? data.headers : PRODUCT_IMPORT_HEADERS;
  const maxBytes = data?.maxBytes ?? undefined;
  const size = (bytes: number) =>
    `${format.number(bytes / 1_048_576, { maximumFractionDigits: 1 })} MB`;

  function choose(next: File | undefined) {
    setDone(undefined);
    upload.reset();
    setLocalError(undefined);
    setFile(next);
    setSelection((current) => current + 1);
    if (!next) return;
    if (!/\.(csv|xlsx)$/iu.test(next.name)) setLocalError(t('wrongType'));
    else if (maxBytes && next.size > maxBytes)
      setLocalError(t('tooLarge', { max: size(maxBytes) }));
  }
  function submit() {
    if (!file || localError) return;
    void upload.run({ file, selection }, (result) => {
      setDone(result.importedCount);
      setFile(undefined);
      if (fileRef.current) fileRef.current.value = '';
      onImported(result.importedCount);
    });
  }

  const failure =
    upload.error instanceof ApiFailure ? upload.error : undefined;
  let body;
  if (policy.isPending) body = <Skeleton label={t('loading')} />;
  else if (disabled)
    body = (
      <Alert tone="info" role="status" title={t('disabledTitle')}>
        <p className="m-0">{t('disabledBody')}</p>
      </Alert>
    );
  else if (policyCode)
    body = (
      <Alert
        tone="bad"
        role="alert"
        action={
          <Button size="small" variant="outline" onClick={() => void policy.refetch()}>
            {t('retry')}
          </Button>
        }
      >
        <p className="m-0">{te(productErrorKey(policyCode))}</p>
      </Alert>
    );
  else
    body = (
      <div className="grid gap-4">
        <ul className="m-0 grid gap-1 ps-5 text-small text-text-2">
          <li>{t('ruleAllOrNothing')}</li>
          {data?.maxRows && (
            <li>{t('ruleRows', { max: format.number(data.maxRows) })}</li>
          )}
          {maxBytes && <li>{t('ruleSize', { max: size(maxBytes) })}</li>}
          <li>{t('ruleIds')}</li>
        </ul>
        <div>
          <Button size="small" variant="ghost" onClick={() => downloadTemplate(headers)}>
            <ProductIcon name="download" className="size-4" />
            {t('template')}
          </Button>
        </div>
        <div className="grid gap-field-gap">
          <label htmlFor={inputId} className="text-field-label font-semibold">
            {t('fileLabel')}
          </label>
          <input
            ref={fileRef}
            id={inputId}
            type="file"
            accept={ACCEPT}
            aria-describedby={`${inputId}-hint`}
            aria-invalid={localError ? true : undefined}
            disabled={upload.isPending}
            onChange={(event) => choose(event.target.files?.[0])}
            className="min-h-touch w-full min-w-0 rounded-md border-2 border-dashed border-border-strong bg-surface-2 p-3 text-small file:me-3 file:min-h-button-small file:rounded-sm file:border-0 file:bg-primary-soft file:px-3 file:font-semibold file:text-primary focus-visible:ring-focus"
          />
          <p id={`${inputId}-hint`} className="m-0 text-small-min text-muted">
            {t('fileHint')}
          </p>
          {localError && (
            <p role="alert" className="m-0 text-field-error font-medium text-error">
              {localError}
            </p>
          )}
        </div>
        {done !== undefined && (
          <Alert tone="ok" role="status" title={t('successTitle')}>
            <p className="m-0">
              {t('successBody', { count: done, formatted: format.number(done) })}
            </p>
          </Alert>
        )}
        {failure && <ImportErrors failure={failure} />}
      </div>
    );

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={t('title')}
      description={t('intro')}
      closeLabel={t('close')}
      wide
      busy={upload.isPending}
      footer={
        disabled || policy.isPending || policyCode ? undefined : (
          <Button
            className="w-full"
            loading={upload.isPending}
            disabled={!file || Boolean(localError)}
            onClick={submit}
          >
            <ProductIcon name="upload" className="size-4.5" />
            {t('submit')}
          </Button>
        )
      }
    >
      {body}
    </Sheet>
  );
}
