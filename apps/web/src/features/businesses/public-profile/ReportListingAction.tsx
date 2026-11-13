'use client';

import { useId, useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  LISTING_REPORT_REASONS,
  ListingReportCreateSchema,
  type ListingReportReason,
} from '@apnatown/shared/admin';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { Button, buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { Radio } from '@apnatown/ui/primitives/Selection';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { useIdempotencyKey } from '../../../shared/api/idempotency';
import { ApiFailure, failureCode } from '../../../shared/api/result';
import { useSession } from '../../../shared/auth/SessionProvider';
import { useOnline } from '../../../shared/hooks/use-online';
import { NavIcon } from '../../../shared/ui/NavIcon';
import { reportListing } from './report-api';

const DETAILS_MAX = 500;
const errorKey: Record<string, string> = {
  COMMON_RATE_LIMITED: 'rateLimited',
  RATE_LIMITED: 'rateLimited',
  VALIDATION_ERROR: 'invalid',
  COMMON_NOT_FOUND: 'notFound',
};

/**
 * F-PF-007 "Report this listing" (prototype About tab, tertiary flag
 * button). Works for guests; the server rate-limits and de-duplicates.
 */
export function ReportListingAction({
  targetType,
  targetId,
  name,
}: {
  targetType: 'business' | 'provider';
  targetId: string;
  name: string;
}) {
  const t = useTranslations('business.publicProfile.report');
  const { api } = useSession();
  const online = useOnline();
  const keys = useIdempotencyKey();
  const formId = useId();
  const counterId = useId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ListingReportReason>();
  const [details, setDetails] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [sent, setSent] = useState(false);
  const send = useMutation({
    mutationFn: (input: Parameters<typeof reportListing>[1]) =>
      reportListing(api, input),
    retry: false,
    networkMode: 'always',
  });
  const code = send.isError
    ? send.error instanceof ApiFailure && send.error.status === 429
      ? 'RATE_LIMITED'
      : failureCode(send.error)
    : undefined;

  function openSheet() {
    if (sent) {
      // A new report after an acknowledgement starts from a clean form.
      setSent(false);
      setReason(undefined);
      setDetails('');
    }
    send.reset();
    setOpen(true);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = details.trim();
    const parsed = ListingReportCreateSchema.safeParse({
      targetType,
      targetId,
      reason,
      ...(text ? { details: text } : {}),
    });
    setInvalid(!parsed.success);
    if (!parsed.success || !online || send.isPending) return;
    send.reset();
    // One key per payload: retrying the same report replays, never duplicates.
    send.mutate(
      { report: parsed.data, key: keys.for(JSON.stringify(parsed.data)) },
      {
        onSuccess: () => {
          keys.clear();
          setSent(true);
        },
      },
    );
  }

  const footer = sent ? (
    <div className="flex justify-end">
      <Button onClick={() => setOpen(false)}>{t('done')}</Button>
    </div>
  ) : (
    <div className="flex flex-wrap justify-end gap-2">
      <Button
        variant="ghost"
        disabled={send.isPending}
        onClick={() => setOpen(false)}
      >
        {t('cancel')}
      </Button>
      <Button
        type="submit"
        form={formId}
        loading={send.isPending}
        disabled={!online}
      >
        {t('submit')}
      </Button>
    </div>
  );

  return (
    <>
      <button
        type="button"
        className={`${buttonVariantClassName('text')} min-w-0 justify-self-start`}
        aria-label={t('actionNamed', { name })}
        aria-haspopup="dialog"
        onClick={openSheet}
      >
        <NavIcon name="flag" className="size-4.5 shrink-0" />
        {t('action')}
      </button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={t('title')}
        {...(sent ? {} : { description: t('description', { name }) })}
        closeLabel={t('close')}
        busy={send.isPending}
        footer={footer}
      >
        {sent ? (
          <p
            role="status"
            className="m-0 flex gap-2 rounded-md bg-success-soft p-3"
          >
            <span aria-hidden="true">✓</span>
            <span className="min-w-0 [overflow-wrap:anywhere]">
              {t('sent')}
            </span>
          </p>
        ) : (
          <form id={formId} noValidate className="grid gap-4" onSubmit={submit}>
            <fieldset
              className="m-0 grid min-w-0 gap-2 border-0 p-0"
              aria-invalid={(invalid && !reason) || undefined}
            >
              <legend className="mb-2 font-semibold">{t('reasonLabel')}</legend>
              {LISTING_REPORT_REASONS.map((value) => (
                <Radio
                  key={value}
                  name={`${formId}-reason`}
                  value={value}
                  label={t(`reasons.${value}`)}
                  checked={reason === value}
                  disabled={send.isPending}
                  onChange={() => {
                    setReason(value);
                    setInvalid(false);
                  }}
                />
              ))}
              {invalid && !reason && (
                <p role="alert" className="m-0 text-small text-error">
                  {t('reasonRequired')}
                </p>
              )}
            </fieldset>
            <div className="grid gap-1">
              <TextArea
                label={t('detailsLabel')}
                value={details}
                maxLength={DETAILS_MAX}
                disabled={send.isPending}
                aria-describedby={counterId}
                onChange={(event) => setDetails(event.currentTarget.value)}
              />
              <p id={counterId} className="m-0 text-end text-small text-text-2">
                {t('counter', { count: details.length, max: DETAILS_MAX })}
              </p>
            </div>
            {!online && (
              <p role="alert" className="m-0 text-small text-error">
                {t('errors.offline')}
              </p>
            )}
            {code && (
              <p
                role="alert"
                className="m-0 text-small text-error [overflow-wrap:anywhere]"
              >
                {t(`errors.${errorKey[code] ?? 'failed'}`)}
              </p>
            )}
          </form>
        )}
      </Sheet>
    </>
  );
}
