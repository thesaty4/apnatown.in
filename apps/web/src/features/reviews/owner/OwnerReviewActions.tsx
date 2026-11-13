'use client';

import { useId, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import type { BusinessKind } from '@apnatown/shared/businesses';
import {
  REVIEW_REPORT_REASONS,
  type OwnerReviewCard,
  type ReviewReport,
} from '@apnatown/shared/reviews';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { Radio } from '@apnatown/ui/primitives/Selection';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { failureCode } from '../../../shared/api/result';
import { errorKey } from '../../businesses/parts';
import { useOwnerReply, useReportReview } from './queries';

function ErrorLine({ error }: { error: unknown }) {
  const te = useTranslations('business.errors');
  return (
    <p role="alert" className="m-0 text-small text-error">
      {te(errorKey(failureCode(error)))}
    </p>
  );
}

/** Reply / Edit reply / Remove reply (plain text ≤1000, overwrite on edit). */
export function OwnerReplyEditor({
  kind,
  review,
}: {
  kind: BusinessKind;
  review: OwnerReviewCard;
}) {
  const t = useTranslations('reviews.owner');
  const mutation = useOwnerReply(kind);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(review.ownerReply ?? '');
  const [invalid, setInvalid] = useState(false);
  const busy = mutation.isPending;
  const save = (event: FormEvent) => {
    event.preventDefault();
    const value = text.trim();
    if (!value) return setInvalid(true);
    mutation.reset();
    void mutation.run({ reviewId: review.id, text: value }, () => setEditing(false));
  };
  if (!editing)
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          size="small"
          variant="outline"
          onClick={() => {
            setText(review.ownerReply ?? '');
            setEditing(true);
          }}
        >
          {t(review.ownerReply ? 'editReply' : 'reply')}
        </Button>
        {review.ownerReply && (
          <Button
            size="small"
            variant="ghost"
            loading={busy}
            onClick={() => void mutation.run({ reviewId: review.id, text: null })}
          >
            {t('removeReply')}
          </Button>
        )}
        {mutation.isError && <ErrorLine error={mutation.error} />}
      </div>
    );
  return (
    <form noValidate className="grid gap-2" onSubmit={save}>
      <TextArea
        label={t('replyLabel')}
        value={text}
        maxLength={1000}
        required
        disabled={busy}
        error={invalid ? t('replyRequired') : undefined}
        onChange={(event) => {
          setText(event.target.value);
          setInvalid(false);
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="small" loading={busy}>
          {t('saveReply')}
        </Button>
        <Button
          size="small"
          variant="ghost"
          disabled={busy}
          onClick={() => {
            mutation.reset();
            setEditing(false);
          }}
        >
          {t('cancel')}
        </Button>
      </div>
      {mutation.isError && <ErrorLine error={mutation.error} />}
    </form>
  );
}

/** "Report abusive": the review stays visible and moves to Reported. */
export function ReportReviewAction({
  kind,
  review,
}: {
  kind: BusinessKind;
  review: OwnerReviewCard;
}) {
  const t = useTranslations('reviews.owner');
  const formId = useId();
  const mutation = useReportReview(kind);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReviewReport['reason']>();
  const [invalid, setInvalid] = useState(false);
  const busy = mutation.isPending;
  if (review.reportedByMe)
    return <StatusBadge tone="warn" icon="⚑" label={t('reported')} />;
  const close = () => {
    if (busy) return;
    mutation.reset();
    setReason(undefined);
    setInvalid(false);
    setOpen(false);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!reason) return setInvalid(true);
    void mutation.run({ reviewId: review.id, report: { reason } }, () => setOpen(false));
  };
  return (
    <>
      <Button size="small" variant="ghost" onClick={() => setOpen(true)}>
        ⚑ {t('report')}
      </Button>
      <Sheet
        open={open}
        onOpenChange={(next) => {
          if (!next) close();
        }}
        title={t('reportTitle')}
        description={t('reportDescription')}
        closeLabel={t('cancel')}
        busy={busy}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" disabled={busy} onClick={close}>
              {t('cancel')}
            </Button>
            <Button type="submit" form={formId} variant="danger" loading={busy}>
              {t('reportConfirm')}
            </Button>
          </div>
        }
      >
        <form id={formId} noValidate className="grid gap-3" onSubmit={submit}>
          <fieldset className="m-0 grid min-w-0 gap-2 border-0 p-0">
            <legend className="mb-2 font-semibold">{t('reasonLabel')}</legend>
            {REVIEW_REPORT_REASONS.map((value) => (
              <Radio
                key={value}
                name={`${formId}-reason`}
                value={value}
                label={t(`reasons.${value}`)}
                checked={reason === value}
                disabled={busy}
                onChange={() => {
                  setReason(value);
                  setInvalid(false);
                }}
              />
            ))}
            {invalid && (
              <p role="alert" className="m-0 text-small text-error">
                {t('reasonRequired')}
              </p>
            )}
          </fieldset>
          {mutation.isError && <ErrorLine error={mutation.error} />}
        </form>
      </Sheet>
    </>
  );
}
