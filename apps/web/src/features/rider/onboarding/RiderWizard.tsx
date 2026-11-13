'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { RiderProfile } from '@apnatown/shared/delivery';
import { Card } from '@apnatown/ui/cards/Card';
import { Button } from '@apnatown/ui/primitives/Button';
import { ApiFailure, failureCode } from '../../../shared/api/result';
import { Notice, useRiderError } from '../parts';
import { useRiderMe, useSaveRiderDraft } from '../queries';
import {
  RIDER_STEPS,
  fieldId,
  firstInvalid,
  formFrom,
  resumeStep,
  serverFields,
  stepBody,
  type RiderFieldErrors,
  type RiderForm,
  type RiderStep,
} from './form';
import {
  DocumentsStep,
  PayoutStep,
  ProfileStep,
  ReviewStep,
  VehicleStep,
  type StepProps,
} from './Steps';

const stepViews = [
  ProfileStep,
  VehicleStep,
  DocumentsStep,
  PayoutStep,
  ReviewStep,
];

function Progress({ step }: { step: RiderStep }) {
  const t = useTranslations('rider.onboard');
  const label = (key: (typeof RIDER_STEPS)[number]) => t(`steps.${key}`);
  const text = t('stepOf', {
    step,
    total: RIDER_STEPS.length,
    name: label(RIDER_STEPS[step - 1]!),
  });
  return (
    <div className="grid min-w-0 gap-2">
      <p className="m-0 text-small font-semibold text-text-2">{text}</p>
      <div
        role="progressbar"
        aria-label={t('progress')}
        aria-valuemin={1}
        aria-valuemax={RIDER_STEPS.length}
        aria-valuenow={step}
        aria-valuetext={text}
        className="h-2 overflow-hidden rounded-pill bg-surface-2"
      >
        <div
          className="h-full rounded-pill bg-primary transition-[width] motion-reduce:transition-none"
          style={{ width: `${(step / RIDER_STEPS.length) * 100}%` }}
        />
      </div>
      <ol className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0 text-caption">
        {RIDER_STEPS.map((key, index) => {
          const position = index + 1;
          const done = position < step;
          const current = position === step;
          return (
            <li
              key={key}
              aria-current={current ? 'step' : undefined}
              className={
                current
                  ? 'font-semibold text-primary'
                  : done
                    ? 'text-text-2'
                    : 'text-muted'
              }
            >
              <span aria-hidden="true">{done ? '✓' : position}</span>{' '}
              {label(key)}
              {done && <span className="sr-only"> ({t('stepDone')})</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * Five-step application (S-RIDE-01). Each step saves only its own fields with
 * the current version and a stable per-payload Idempotency-Key; reload resumes
 * at the first uncovered step. Submit surfaces the gated KYC requirement
 * (RIDER_REQUIREMENTS_UNAVAILABLE) as a localized message, never a success.
 */
export function RiderWizard({ profile }: { profile: RiderProfile }) {
  const t = useTranslations('rider.onboard');
  const message = useRiderError();
  const me = useRiderMe();
  const [step, setStep] = useState<RiderStep>(() => resumeStep(profile));
  const [form, setForm] = useState<RiderForm>(() => formFrom(profile));
  const [errors, setErrors] = useState<RiderFieldErrors>({});
  const { mutation, save } = useSaveRiderDraft();
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    heading.current?.focus();
  }, [step]);
  const busy = mutation.isPending;
  const code = mutation.isError ? failureCode(mutation.error) : undefined;
  // Server field errors (details.field/fields) join the local ones.
  const failure = mutation.error;
  const shown: RiderFieldErrors = {
    ...errors,
    ...(failure instanceof ApiFailure ? serverFields(failure.fields) : {}),
  };
  const invalidField = firstInvalid(shown);
  useEffect(() => {
    if (failure && invalidField)
      document.getElementById(fieldId(invalidField))?.focus();
  }, [failure, invalidField]);
  const disabled = busy || !profile.capabilities.canEdit;

  function focusInvalid(next: RiderFieldErrors) {
    const field = firstInvalid(next);
    if (field)
      requestAnimationFrame(() =>
        document.getElementById(fieldId(field))?.focus(),
      );
  }
  function set(patch: Partial<RiderForm>) {
    setForm((current) => ({ ...current, ...patch }));
  }
  function go(next: RiderStep) {
    mutation.reset();
    setErrors({});
    setStep(next);
  }
  function advance() {
    const result = stepBody(step, form, profile);
    if (result.kind === 'invalid') {
      setErrors(result.errors);
      focusInvalid(result.errors);
      return;
    }
    if (result.kind === 'skip') return go((step + 1) as RiderStep);
    setErrors({});
    void save(result.body, () => {
      // Payout is write-only: clear it once the server holds it.
      if (step === 4) set({ upi: '', bankAccount: '' });
      if (step < 5) go((step + 1) as RiderStep);
    });
  }
  const View: (props: StepProps) => ReactNode = stepViews[step - 1]!;
  return (
    <Card padded className="grid min-w-0 gap-4">
      <Progress step={step} />
      <h2
        ref={heading}
        tabIndex={-1}
        className="m-0 text-h3 focus:outline-none [overflow-wrap:anywhere]"
      >
        {t(`steps.${RIDER_STEPS[step - 1]!}`)}
      </h2>
      {!profile.capabilities.canEdit && (
        <Notice tone="info" role="status" title={t('readOnly')} />
      )}
      {step === 5 && profile.requirements.availability === 'unavailable' && (
        <Notice tone="warn" role="status" title={t('requirementsTitle')}>
          <p className="m-0">{t('requirementsBody')}</p>
        </Notice>
      )}
      <form
        noValidate
        className="grid min-w-0 gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!disabled) advance();
        }}
      >
        <View
          form={form}
          set={set}
          errors={shown}
          disabled={disabled}
          profile={profile}
        />
        {code && (
          <Notice
            tone={code === 'RIDER_REQUIREMENTS_UNAVAILABLE' ? 'warn' : 'bad'}
            role="alert"
            title={t(
              code === 'RIDER_REQUIREMENTS_UNAVAILABLE'
                ? 'gatedTitle'
                : 'saveFailed',
            )}
            action={
              code === 'DELIVERY_VERSION_CONFLICT' ? (
                <Button
                  size="small"
                  variant="outline"
                  disabled={me.isFetching}
                  onClick={() => {
                    mutation.reset();
                    void me.refetch();
                  }}
                >
                  {t('reload')}
                </Button>
              ) : undefined
            }
          >
            <p className="m-0">{message(mutation.error)}</p>
          </Notice>
        )}
        <div className="flex flex-wrap justify-between gap-2">
          <Button
            variant="ghost"
            disabled={busy || step === 1}
            onClick={() => go((step - 1) as RiderStep)}
          >
            {t('back')}
          </Button>
          <Button type="submit" loading={busy} disabled={disabled}>
            {t(
              step === 5 ? 'submit' : step === 3 ? 'continue' : 'saveContinue',
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
