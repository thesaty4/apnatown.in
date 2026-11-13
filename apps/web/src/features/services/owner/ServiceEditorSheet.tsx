'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import type { BusinessKind } from '@apnatown/shared/businesses';
import type { ServiceOwner } from '@apnatown/shared/services';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { Button } from '@apnatown/ui/primitives/Button';
import { ApiFailure, failureCode } from '../../../shared/api/result';
import { useOnline } from '../../../shared/hooks/use-online';
import { Alert } from '../../businesses/parts';
import {
  createBody,
  emptyServiceForm,
  patchBody,
  readServiceForm,
  serverField,
  toServiceForm,
  type ServiceField,
  type ServiceForm,
  type ServiceIssues,
} from './form-model';
import { fieldIssue, formIssue } from './errors';
import { PublicLinkField } from './parts';
import { useSaveService } from './queries';
import { BasicsFields, PriceFields, ScopeFields } from './ServiceFormFields';
import { MediaFields, VisibilityFields } from './ServicePublishFields';

/**
 * Add/edit sheet (prototype `svEdit`, extended by S-VEND-13). Mount it with a
 * `key` per opened service so the form seeds once from the confirmed DTO.
 */
export function ServiceEditorSheet({
  kind,
  businessId,
  galleryDefault,
  service,
  publicUrl,
  onClose,
  onSaved,
  onReload,
}: {
  kind: BusinessKind;
  businessId: string;
  galleryDefault: boolean;
  /** Null = create. */
  service: ServiceOwner | null;
  publicUrl: string | null;
  onClose: () => void;
  onSaved: (service: ServiceOwner, created: boolean) => void;
  /** Re-read after a version conflict; resolves the latest DTO, if any. */
  onReload: () => Promise<ServiceOwner | undefined>;
}) {
  const t = useTranslations('service.manager');
  const te = useTranslations('service.manager.errors');
  const online = useOnline();
  const formRef = useRef<HTMLFormElement>(null);
  const [base, setBase] = useState(service);
  const [form, setForm] = useState<ServiceForm>(() =>
    service ? toServiceForm(service) : emptyServiceForm(galleryDefault),
  );
  const [issues, setIssues] = useState<ServiceIssues>({});
  const [uploading, setUploading] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [noChanges, setNoChanges] = useState(false);
  const { mutation, save } = useSaveService(kind);

  const code = mutation.error ? failureCode(mutation.error) : null;
  const conflict = code === 'SERVICES_VERSION_CONFLICT';
  const serverFields =
    mutation.error instanceof ApiFailure ? mutation.error.fields : [];
  const serverTarget = code ? serverField(serverFields) : null;
  const serverFieldKey =
    code && !conflict
      ? code === 'FEATURED_ENTITLEMENT_UNAVAILABLE'
        ? 'featuredSelected'
        : serverTarget
      : null;
  const serverFieldIssue = code ? fieldIssue(code) : null;
  const generalIssue =
    code && !conflict && !(serverFieldKey && serverFieldIssue)
      ? formIssue(code, online)
      : null;

  const error = (field: ServiceField) => {
    const key =
      issues[field] ??
      (serverFieldKey === field && serverFieldIssue
        ? serverFieldIssue
        : undefined);
    return key ? te(key) : undefined;
  };

  function set(patch: Partial<ServiceForm>) {
    setForm((current) => ({ ...current, ...patch }));
    setIssues((current) => {
      const next = { ...current };
      for (const key of Object.keys(patch)) {
        if (key === 'priceFrom' || key === 'priceType')
          delete next.priceFromPaise;
        if (key === 'priceTo' || key === 'priceType') delete next.priceToPaise;
        delete next[key as ServiceField];
      }
      return next;
    });
    setNoChanges(false);
    if (mutation.error && !conflict) mutation.reset();
  }

  function focusFirstInvalid() {
    requestAnimationFrame(() => {
      formRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (uploading || mutation.isPending || conflict) return;
    const read = readServiceForm(form);
    if (!read.ok) {
      setIssues(read.issues);
      focusFirstInvalid();
      return;
    }
    setIssues({});
    if (!base) {
      save({ mode: 'create', body: createBody(read.wire) }, (saved) =>
        onSaved(saved, true),
      );
      return;
    }
    const body = patchBody(base, read.wire);
    if (!body) {
      setNoChanges(true);
      return;
    }
    save({ mode: 'update', id: base.id, body }, (saved) =>
      onSaved(saved, false),
    );
  }

  async function reload() {
    setReloading(true);
    try {
      const latest = await onReload();
      if (latest) {
        setBase(latest);
        setForm(toServiceForm(latest));
        setIssues({});
        mutation.reset();
      }
    } finally {
      setReloading(false);
    }
  }

  const busy = mutation.isPending;
  const statusLocked = Boolean(
    base &&
    !base.allowedStatuses.includes(
      base.status === 'active' ? 'paused' : 'active',
    ),
  );
  const fieldProps = {
    form,
    set,
    error,
    disabled: busy || conflict,
    businessId,
    onUploadsPending: setUploading,
  };

  return (
    <Sheet
      open
      wide
      stickyFooter
      busy={busy}
      title={base ? t('editTitle') : t('addTitle')}
      closeLabel={t('close')}
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
      footer={
        <div className="grid min-w-0 gap-2">
          {uploading && (
            <p role="status" className="m-0 text-small text-text-2">
              {t('waitForUploads')}
            </p>
          )}
          {noChanges && (
            <p role="status" className="m-0 text-small text-text-2">
              {t('noChanges')}
            </p>
          )}
          <div className="flex items-center gap-row-gap">
            <Button
              variant="ghost"
              className="min-w-0 flex-1"
              disabled={busy}
              onClick={onClose}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              form="service-editor"
              className="min-w-0 flex-1"
              loading={busy}
              disabled={busy || uploading || conflict || !online}
            >
              {t('save')}
            </Button>
          </div>
        </div>
      }
    >
      <form
        id="service-editor"
        ref={formRef}
        noValidate
        onSubmit={submit}
        className="grid min-w-0 gap-4"
      >
        {conflict && (
          <Alert
            tone="warn"
            role="alert"
            title={t('conflictTitle')}
            action={
              <Button
                size="small"
                variant="outline"
                loading={reloading}
                disabled={reloading}
                onClick={() => void reload()}
              >
                {t('reload')}
              </Button>
            }
          >
            <p className="m-0">{t('conflictBody')}</p>
          </Alert>
        )}
        {generalIssue && (
          <Alert tone="bad" role="alert">
            <p className="m-0">{te(generalIssue)}</p>
          </Alert>
        )}
        {!online && !generalIssue && (
          <Alert tone="warn" role="status">
            <p className="m-0">{te('offline')}</p>
          </Alert>
        )}
        <BasicsFields {...fieldProps} />
        <PriceFields {...fieldProps} />
        <ScopeFields {...fieldProps} />
        <MediaFields {...fieldProps} />
        <VisibilityFields
          {...fieldProps}
          statusLocked={statusLocked}
          featuredInactive={Boolean(
            base?.featuredSelected && !base.featured && form.featuredSelected,
          )}
        />
        {base && publicUrl && <PublicLinkField url={publicUrl} />}
      </form>
    </Sheet>
  );
}
