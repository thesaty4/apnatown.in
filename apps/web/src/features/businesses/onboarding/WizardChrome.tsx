'use client';

import Link from 'next/link';
import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { BusinessKind } from '@apnatown/shared/businesses';
import { Button, buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { STEPS, type Step } from './steps';

export function Frame({
  kind,
  children,
}: {
  kind: BusinessKind;
  children: ReactNode;
}) {
  const t = useTranslations('business.onboarding');
  return (
    <div className="mx-auto grid w-full max-w-sheet min-w-0 gap-4 px-4 py-4">
      <div>
        <Link
          href="/account"
          className={buttonVariantClassName('text', 'small')}
        >
          <span aria-hidden="true">✕</span> {t('exit')}
        </Link>
      </div>
      <h1 className="m-0 text-h1">
        {t(kind === 'shop' ? 'titleShop' : 'titleProvider')}
      </h1>
      {children}
    </div>
  );
}

/** Accessible progress: "Step n of 7", progressbar and an ordered stepper. */
export function Progress({ step }: { step: Step }) {
  const t = useTranslations('business.onboarding');
  const name = t(`steps.${STEPS[step - 1]}`);
  return (
    <div className="grid min-w-0 gap-2">
      <p className="m-0 text-small font-semibold text-text-2">
        {t('stepOf', { step, total: STEPS.length, name })}
      </p>
      <div
        role="progressbar"
        aria-label={t('progress')}
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={step}
        aria-valuetext={t('stepOf', { step, total: STEPS.length, name })}
        className="h-2 overflow-hidden rounded-pill bg-surface-2"
      >
        <div
          className="h-full rounded-pill bg-primary transition-[width] motion-reduce:transition-none"
          style={{ width: `${(step / STEPS.length) * 100}%` }}
        />
      </div>
      <ol className="m-0 hidden list-none flex-wrap gap-x-3 gap-y-1 p-0 text-caption tablet:flex">
        {STEPS.map((key, index) => {
          const position = index + 1;
          const state =
            position < step ? 'done' : position === step ? 'current' : 'todo';
          return (
            <li
              key={key}
              aria-current={state === 'current' ? 'step' : undefined}
              className={
                state === 'current'
                  ? 'font-semibold text-primary'
                  : state === 'done'
                    ? 'text-text-2'
                    : 'text-muted'
              }
            >
              <span aria-hidden="true">
                {state === 'done' ? '✓' : position}
              </span>{' '}
              {t(`steps.${key}`)}
              {state === 'done' && (
                <span className="sr-only"> ({t('stepDone')})</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Step heading that receives focus whenever the step changes. */
export function StepHeading({ step }: { step: Step }) {
  const t = useTranslations('business.onboarding');
  const ref = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    ref.current?.focus();
  }, [step]);
  return (
    <h2 ref={ref} tabIndex={-1} className="m-0 text-h3 focus:outline-none">
      {t(`steps.${STEPS[step - 1]}`)}
    </h2>
  );
}

export function Nav({
  step,
  onBack,
  next,
  saveDraft,
  busy,
  status,
}: {
  step: Step;
  onBack: () => void;
  next: ReactNode;
  saveDraft?: (() => void) | undefined;
  busy: boolean;
  status?: ReactNode;
}) {
  const t = useTranslations('business.onboarding');
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" disabled={step === 1 || busy} onClick={onBack}>
          {t('back')}
        </Button>
        <span className="flex-1" />
        {saveDraft && (
          <Button variant="outline" disabled={busy} onClick={saveDraft}>
            {t('saveDraft')}
          </Button>
        )}
        {next}
      </div>
      {status}
    </div>
  );
}
