'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import {
  CreateVideoReportSchema,
  MediaReportReasonSchema,
  type CreateVideoReport,
} from '@apnatown/shared';
import { Button } from '@apnatown/ui/primitives/Button';
import { Select } from '@apnatown/ui/primitives/Select';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { failureCode } from '../../shared/api/result';
import { useReportVideo } from './queries';

/** Report form for one public video; guests may report (server rate-limits). */
export function VideoReportSheet({
  videoId,
  open,
  onOpenChange,
  onReported,
}: {
  videoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReported: () => void;
}) {
  const t = useTranslations('reels.viewer.report');
  const report = useReportVideo(videoId);
  const [reason, setReason] =
    useState<CreateVideoReport['reason']>('inappropriate');
  const [details, setDetails] = useState('');
  const [invalid, setInvalid] = useState(false);
  const code = report.mutation.isError
    ? failureCode(report.mutation.error)
    : undefined;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = CreateVideoReportSchema.safeParse({ reason, details });
    if (!parsed.success) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    report.submit(parsed.data, () => {
      onOpenChange(false);
      setDetails('');
      onReported();
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('title')}
      description={t('description')}
      closeLabel={t('cancel')}
      busy={report.mutation.isPending}
    >
      <form onSubmit={submit} className="grid gap-4">
        <Select
          label={t('reasonLabel')}
          value={reason}
          onChange={(event) => {
            const parsed = MediaReportReasonSchema.safeParse(
              event.currentTarget.value,
            );
            if (parsed.success) setReason(parsed.data);
          }}
          options={[
            { value: 'inappropriate', label: t('reasons.inappropriate') },
            { value: 'misleading', label: t('reasons.misleading') },
            { value: 'spam', label: t('reasons.spam') },
            { value: 'copyright', label: t('reasons.copyright') },
            { value: 'other', label: t('reasons.other') },
          ]}
        />
        <TextArea
          label={t('detailsLabel')}
          value={details}
          maxLength={500}
          onChange={(event) => setDetails(event.currentTarget.value)}
        />
        {invalid && (
          <p role="alert" className="m-0 text-error [overflow-wrap:anywhere]">
            {t('validation')}
          </p>
        )}
        {code && (
          <p role="alert" className="m-0 text-error [overflow-wrap:anywhere]">
            {t(code === 'COMMON_RATE_LIMITED' ? 'rateLimited' : 'failed')}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={report.mutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            {t('cancel')}
          </Button>
          <Button type="submit" loading={report.mutation.isPending}>
            {t(report.mutation.isPending ? 'submitting' : 'submit')}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
