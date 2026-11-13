'use client';

import { useId, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { AdminBusinessListingType } from '@apnatown/shared/admin';
import { ErrorState } from '@apnatown/ui/feedback/StateViews';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { Button } from '@apnatown/ui/primitives/Button';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { failureCode } from '../../../shared/api/result';
import { useAdmin } from '../AdminShell';
import { Alert, Notice } from '../parts';
import {
  ApprovalStatusBadge,
  AreaName,
  CategoryName,
} from '../approvals/parts';
import { editListing, removeListing } from './api';
import { ListingEditForm } from './ListingEditForm';
import { ListingReports } from './ListingReports';
import { isListingConflict, useListingError, useListingName } from './parts';
import { listingDetailOptions, useListingCommand } from './queries';

/** Listing detail sheet: facts, edit/status form, remove and open reports. */
export function ListingEditSheet({
  type,
  id,
  onClose,
}: {
  type: AdminBusinessListingType;
  id: string;
  onClose: () => void;
}) {
  const context = useAdmin();
  const t = useTranslations('admin.listings');
  const ts = useTranslations('admin.state');
  const message = useListingError();
  const name = useListingName();
  const formId = useId();
  const detail = useQuery(listingDetailOptions(context, type, id));
  const [notice, setNotice] = useState<string>();
  const [confirm, setConfirm] = useState(false);
  const [removeNote, setRemoveNote] = useState('');
  const edit = useListingCommand(
    context,
    (api, input: Parameters<typeof editListing>[2], command) =>
      editListing(api, { type, id }, input, command),
  );
  const remove = useListingCommand(
    context,
    (api, input: Parameters<typeof removeListing>[2], command) =>
      removeListing(api, { type, id }, input, command),
  );
  const busy = edit.mutation.isPending || remove.mutation.isPending;
  const data = detail.data;
  const listing = data?.listing;
  const own = listing?.ownerUserId === context.scope.userId;
  const canEdit =
    !own && Boolean(data?.allowedActions.some((action) => action !== 'remove'));
  const canRemove = !own && Boolean(data?.allowedActions.includes('remove'));
  const failure = edit.mutation.error ?? remove.mutation.error;
  const failureText = failure ? message(failureCode(failure)) : undefined;
  const conflict = failure ? isListingConflict(failureCode(failure)) : false;

  let body;
  if (detail.isPending) {
    body = <Skeleton label={ts('loading')} />;
  } else if (!data || !listing) {
    body = (
      <ErrorState
        headingLevel="h2"
        title={t('detail.loadErrorTitle')}
        message={message(failureCode(detail.error))}
        action={
          <Button
            loading={detail.isFetching}
            onClick={() => void detail.refetch()}
          >
            {ts('retry')}
          </Button>
        }
      />
    );
  } else {
    body = (
      <div className="grid gap-4">
        <dl className="m-0 grid gap-2 text-small">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-text-2">{t('columns.status')}</dt>
            <dd className="m-0">
              <ApprovalStatusBadge status={listing.status} />
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-text-2">{t('columns.category')}</dt>
            <dd className="m-0 text-end">
              <CategoryName categoryId={listing.categoryId} />
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-text-2">{t('columns.area')}</dt>
            <dd className="m-0 text-end">
              <AreaName cityId={listing.cityId} areaId={listing.areaId} />
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-text-2">{t('detail.address')}</dt>
            <dd className="m-0 min-w-0 text-end [overflow-wrap:anywhere]">
              {listing.addressText ?? t('detail.notSet')}
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-text-2">{t('columns.rating')}</dt>
            <dd className="m-0">
              <span aria-hidden="true">—</span>
              <span className="sr-only">{t('ratingUnavailable')}</span>
            </dd>
          </div>
        </dl>
        {own && <Alert message={message('ADMIN_SELF_ACTION')} />}
        {!own && !canEdit && !canRemove && (
          <p className="m-0 text-small text-text-2">{t('detail.viewOnly')}</p>
        )}
        {failureText && (
          <Alert
            message={
              conflict
                ? t('detail.reloaded', { reason: failureText })
                : failureText
            }
          />
        )}
        <Notice message={notice} />
        {canEdit && (
          <ListingEditForm
            key={listing.version}
            formId={formId}
            detail={data}
            busy={busy}
            onSubmit={(value) => {
              setNotice(undefined);
              edit.submit(value, () => setNotice(t('detail.saved')));
            }}
          />
        )}
        <ListingReports detail={data} />
      </div>
    );
  }

  return (
    <>
      <Sheet
        open
        wide
        busy={busy}
        onOpenChange={(next) => !next && onClose()}
        title={listing ? name(listing) : t('detail.title')}
        closeLabel={t('close')}
        footer={
          listing && (canEdit || canRemove) ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              {canRemove ? (
                <Button
                  variant="danger"
                  disabled={busy}
                  onClick={() => setConfirm(true)}
                >
                  {t('remove.action')}
                </Button>
              ) : (
                <span />
              )}
              {canEdit && (
                <Button
                  type="submit"
                  form={formId}
                  loading={edit.mutation.isPending}
                  disabled={busy}
                >
                  {t('detail.save')}
                </Button>
              )}
            </div>
          ) : undefined
        }
      >
        {body}
      </Sheet>
      {listing && (
        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          tone="danger"
          busy={remove.mutation.isPending}
          title={t('remove.title')}
          impact={t('remove.impact')}
          cancelLabel={t('cancel')}
          confirmLabel={t('remove.confirm')}
          onConfirm={() => {
            const note = removeNote.trim();
            remove.submit(
              { expectedVersion: listing.version, ...(note ? { note } : {}) },
              () => {
                setConfirm(false);
                onClose();
              },
            );
          }}
        >
          <TextArea
            label={t('remove.note')}
            hint={t('edit.noteHint')}
            value={removeNote}
            maxLength={500}
            onChange={(event) => setRemoveNote(event.target.value)}
          />
          {remove.mutation.error && (
            <Alert message={message(failureCode(remove.mutation.error))} />
          )}
        </ConfirmDialog>
      )}
    </>
  );
}
