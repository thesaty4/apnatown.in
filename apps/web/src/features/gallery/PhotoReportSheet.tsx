'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import {
  CreatePhotoReportSchema,
  MediaReportReasonSchema,
  type CreatePhotoReport,
  type MediaPhotoPlacementType,
} from '@apnatown/shared';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { Button } from '@apnatown/ui/primitives/Button';
import { Select } from '@apnatown/ui/primitives/Select';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { failureCode } from '../../shared/api/result';
import { useOnline } from '../../shared/hooks/use-online';
import { useReportPhoto } from './queries';

const REASONS = MediaReportReasonSchema.options;
const errorKey = (code: string) =>
  code === 'COMMON_RATE_LIMITED' || code === 'RATE_LIMITED'
    ? 'rateLimited'
    : code === 'MEDIA_NOT_FOUND'
      ? 'notFound'
      : 'failed';

/**
 * Report one public photo at its exact placement (gallery photo, product
 * image or service image). Guests may report; the server rate-limits per
 * session and acknowledges duplicates. Success never hides the photo.
 */
export function PhotoReportSheet({
  photo,
  open,
  onOpenChange,
  onReported,
}: {
  photo: {
    assetId: string;
    placementType: MediaPhotoPlacementType;
    placementId: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReported: () => void;
}) {
  const t = useTranslations('gallery.report');
  const shared = useTranslations('reels.viewer.report');
  const online = useOnline();
  const report = useReportPhoto(photo.assetId);
  const [reason, setReason] =
    useState<CreatePhotoReport['reason']>('inappropriate');
  const [details, setDetails] = useState('');
  const [invalid, setInvalid] = useState(false);
  const pending = report.mutation.isPending;
  const code = report.mutation.isError
    ? failureCode(report.mutation.error)
    : undefined;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!online) return;
    const trimmed = details.trim();
    const parsed = CreatePhotoReportSchema.safeParse({
      placementType: photo.placementType,
      placementId: photo.placementId,
      reason,
      ...(trimmed ? { details: trimmed } : {}),
    });
    if (!parsed.success) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    report.submit(parsed.data, () => {
      onOpenChange(false);
      setDetails('');
      report.mutation.reset();
      onReported();
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('title')}
      description={t('description')}
      closeLabel={shared('cancel')}
      busy={pending}
    >
      <form onSubmit={submit} className="grid gap-4" noValidate>
        <Select
          label={shared('reasonLabel')}
          value={reason}
          onChange={(event) => {
            const parsed = MediaReportReasonSchema.safeParse(
              event.currentTarget.value,
            );
            if (parsed.success) setReason(parsed.data);
          }}
          options={REASONS.map((value) => ({
            value,
            label: shared(`reasons.${value}`),
          }))}
        />
        <TextArea
          label={shared('detailsLabel')}
          value={details}
          maxLength={500}
          onChange={(event) => setDetails(event.currentTarget.value)}
        />
        {!online && (
          <p role="status" className="m-0 flex items-start gap-2 text-small text-text-2 [overflow-wrap:anywhere]">
            <span aria-hidden="true">📡</span>
            {t('offline')}
          </p>
        )}
        {invalid && (
          <p role="alert" className="m-0 flex items-start gap-2 text-error [overflow-wrap:anywhere]">
            <span aria-hidden="true">⚠</span>
            {shared('validation')}
          </p>
        )}
        {code && (
          <p role="alert" className="m-0 flex items-start gap-2 text-error [overflow-wrap:anywhere]">
            <span aria-hidden="true">⚠</span>
            {t(errorKey(code))}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            {shared('cancel')}
          </Button>
          <Button type="submit" loading={pending} disabled={!online}>
            {shared(pending ? 'submitting' : 'submit')}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
