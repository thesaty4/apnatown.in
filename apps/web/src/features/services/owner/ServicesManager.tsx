'use client';

import { useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { BusinessKind, BusinessOwner } from '@apnatown/shared/businesses';
import type { ServiceOwner } from '@apnatown/shared/services';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import { Button } from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../../shared/api/result';
import { useOnline } from '../../../shared/hooks/use-online';
import { NavIcon } from '../../../shared/ui/NavIcon';
import { OwnerGate } from '../../businesses/BusinessDashboard';
import { useOwnerContext } from '../../businesses/queries';
import {
  Alert,
  LockedNote,
  StatusBanner,
  errorKey,
} from '../../businesses/parts';
import { ToastRegion, useToast } from '../parts';
import { getOwnerService } from './api';
import { rowIssue } from './errors';
import { copyText, serviceUrl } from './parts';
import {
  useDeleteService,
  useOwnerServices,
  useServiceStatus,
} from './queries';
import { ServiceEditorSheet } from './ServiceEditorSheet';
import { serviceName } from './ServiceRow';
import { ServiceRows } from './ServiceRows';
import { ServicesListBody } from './ServicesList';

/** S-VEND-13 / S-PROV-08 owner services manager, shared by both dashboards. */
export function ServicesManager({
  kind,
  baseUrl,
}: {
  kind: BusinessKind;
  baseUrl: string;
}) {
  return (
    <OwnerGate kind={kind}>
      {(business) => <Screen business={business} baseUrl={baseUrl} />}
    </OwnerGate>
  );
}

function Screen({
  business,
  baseUrl,
}: {
  business: BusinessOwner;
  baseUrl: string;
}) {
  const t = useTranslations('service.manager');
  // Listing writes are approved-only (BR-06): earlier states see the banner
  // with its onboarding/overview actions instead of a form that would fail.
  if (!business.capabilities.sell)
    return (
      <div className="grid min-w-0 gap-4">
        <h1 className="m-0 text-h1">{t('title')}</h1>
        <StatusBanner business={business} />
        <LockedNote />
      </div>
    );
  return <Manager business={business} baseUrl={baseUrl} />;
}

type Editor =
  { open: false } | { open: true; service: ServiceOwner | null; seq: number };

function Manager({
  business,
  baseUrl,
}: {
  business: BusinessOwner;
  baseUrl: string;
}) {
  const t = useTranslations('service.manager');
  const te = useTranslations('service.manager.errors');
  const tb = useTranslations('business.errors');
  const locale = useLocale();
  const kind = business.kind;
  const online = useOnline();
  const { api } = useOwnerContext();
  const list = useOwnerServices(kind, true);
  const status = useServiceStatus(kind);
  const remove = useDeleteService(kind);
  const { toast, show, dismiss } = useToast();
  const [editor, setEditor] = useState<Editor>({ open: false });
  const [deleting, setDeleting] = useState<ServiceOwner | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const pages = list.data?.pages;
  const items = useMemo(
    () => pages?.flatMap((page) => page.items) ?? [],
    [pages],
  );
  const rowBusy = status.mutation.isPending || remove.mutation.isPending;

  function restoreFocus(fallback?: HTMLElement | null) {
    const target = opener.current;
    requestAnimationFrame(() => {
      (target?.isConnected ? target : (fallback ?? addButton.current))?.focus();
    });
  }

  function openEditor(service: ServiceOwner | null) {
    opener.current = document.activeElement as HTMLElement | null;
    setEditor((current) => ({
      open: true,
      service,
      seq: (current.open ? current.seq : 0) + 1,
    }));
  }

  function closeEditor() {
    setEditor({ open: false });
    restoreFocus();
  }

  async function copyLink(service: ServiceOwner) {
    const ok = await copyText(serviceUrl(baseUrl, service.slug));
    show(ok ? t('linkCopied') : t('copyFailed'));
  }

  async function reload(id: string) {
    try {
      const latest = await getOwnerService(api, kind, id);
      void list.refetch();
      return latest;
    } catch (error) {
      if (failureCode(error) === 'COMMON_NOT_FOUND') {
        closeEditor();
        show(te('notFound'));
        void list.refetch();
      }
      return undefined;
    }
  }

  const statusCode = status.mutation.error
    ? failureCode(status.mutation.error)
    : null;
  const deleteCode = remove.mutation.error
    ? failureCode(remove.mutation.error)
    : null;
  const issue = (code: string) => te(rowIssue(code, online));

  const addAction = (
    <Button onClick={() => openEditor(null)}>{t('addFirst')}</Button>
  );

  return (
    <div className="grid min-w-0 gap-4">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 text-h1">{t('title')}</h1>
        <Button ref={addButton} size="small" onClick={() => openEditor(null)}>
          <NavIcon name="plus" className="size-4" />
          {t('add')}
        </Button>
      </div>
      <Alert tone="info" role="note">
        <p className="m-0">{t('intro')}</p>
      </Alert>
      {statusCode && (
        <Alert
          tone={statusCode === 'SERVICES_VERSION_CONFLICT' ? 'warn' : 'bad'}
          role="alert"
          action={
            <Button
              size="small"
              variant="outline"
              disabled={list.isFetching}
              onClick={() => {
                status.mutation.reset();
                void list.refetch();
              }}
            >
              {t('reload')}
            </Button>
          }
        >
          <p className="m-0">{issue(statusCode)}</p>
        </Alert>
      )}
      <ServicesListBody
        list={list}
        online={online}
        count={items.length}
        errorMessage={(code) => tb(errorKey(code))}
        emptyAction={addAction}
      >
        <ServiceRows
          items={items}
          busy={rowBusy}
          pendingId={status.mutation.isPending ? togglingId : null}
          publicLive={business.capabilities.publicProfile}
          onToggle={(service, next) => {
            setTogglingId(service.id);
            status.run(service, next, (saved) =>
              show(
                t(
                  saved.status === 'active' ? 'activatedToast' : 'pausedToast',
                  {
                    name: serviceName(saved, locale),
                  },
                ),
              ),
            );
          }}
          onEdit={openEditor}
          onCopy={(service) => void copyLink(service)}
          onDelete={(service) => {
            opener.current = document.activeElement as HTMLElement | null;
            remove.mutation.reset();
            setDeleting(service);
          }}
        />
      </ServicesListBody>
      {editor.open && (
        <ServiceEditorSheet
          key={editor.seq}
          kind={kind}
          businessId={business.id}
          galleryDefault={business.settings.galleryMediaDefault}
          service={editor.service}
          publicUrl={
            editor.service ? serviceUrl(baseUrl, editor.service.slug) : null
          }
          onClose={closeEditor}
          onReload={() =>
            editor.service
              ? reload(editor.service.id)
              : Promise.resolve(undefined)
          }
          onSaved={(saved, created) => {
            closeEditor();
            show(
              t(created ? 'created' : 'saved', {
                name: serviceName(saved, locale),
              }),
            );
          }}
        />
      )}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !remove.mutation.isPending) {
            setDeleting(null);
            restoreFocus();
          }
        }}
        title={t('deleteTitle')}
        impact={
          deleteCode
            ? `${t('deleteImpact')} ${issue(deleteCode)}`
            : t('deleteImpact')
        }
        cancelLabel={t('cancel')}
        confirmLabel={t('delete')}
        tone="danger"
        busy={remove.mutation.isPending}
        confirmDisabled={!online}
        onConfirm={() => {
          if (!deleting) return;
          remove.run(deleting, () => {
            setDeleting(null);
            show(t('deleted'));
            restoreFocus(addButton.current);
          });
        }}
      />
      <ToastRegion
        toast={toast}
        dismiss={dismiss}
        dismissLabel={t('dismiss')}
      />
    </div>
  );
}
