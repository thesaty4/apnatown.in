'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { BusinessKind } from '@apnatown/shared/businesses';
import { Button } from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../../shared/api/result';
import { Alert, dashboardBase, errorKey } from '../parts';
import { useCreateApplication } from '../queries';
import { MobileStep } from './MobileStep';
import type { Step } from './steps';
import { TypeStep } from './TypeStep';
import { Nav, Progress, StepHeading } from './WizardChrome';

/** No application yet: steps 1–2, then create the draft (idempotent). */
export function StartWizard({ kind }: { kind: BusinessKind }) {
  const t = useTranslations('business.onboarding');
  const te = useTranslations('business.errors');
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const create = useCreateApplication(kind);
  const code = create.mutation.isError
    ? failureCode(create.mutation.error)
    : undefined;
  return (
    <>
      <Progress step={step} />
      <StepHeading step={step} />
      {step === 1 ? (
        <MobileStep />
      ) : (
        <TypeStep
          kind={kind}
          locked={false}
          onChoose={(next) => {
            if (next !== kind) router.push(`${dashboardBase(next)}/onboarding`);
          }}
        />
      )}
      {code && (
        <Alert tone="bad" role="alert">
          <p className="m-0">{te(errorKey(code))}</p>
        </Alert>
      )}
      <Nav
        step={step}
        busy={create.mutation.isPending}
        onBack={() => setStep(1)}
        next={
          <Button
            loading={create.mutation.isPending}
            onClick={() => {
              if (step === 1) setStep(2);
              // Success seeds the owner cache; the gate re-renders into Resume.
              else create.create();
            }}
          >
            {t('next')}
          </Button>
        }
      />
    </>
  );
}
