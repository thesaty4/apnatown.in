'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { BusinessKind, BusinessOwner } from '@apnatown/shared/businesses';
import { failureCode } from '../../../shared/api/result';
import { missingForSubmit, type FieldErrors } from '../form-model';
import { dashboardBase } from '../parts';
import {
  useOwnerContext,
  usePatchBusiness,
  useSubmitBusiness,
} from '../queries';
import { useProfileDraft } from '../use-profile-draft';
import { firstStepWith, stepFields, type Step } from './steps';

/** Step navigation, per-step validation, kind switch and submit for the
 * resumable draft wizard. The server still decides every capability. */
export function useDraftWizard(owner: BusinessOwner, onSubmitted: () => void) {
  const kind = owner.kind;
  const router = useRouter();
  const client = useQueryClient();
  const { scope } = useOwnerContext();
  // Resume where the draft needs attention (basics) rather than step 1.
  const [step, setStep] = useState<Step>(3);
  const draft = useProfileDraft(owner);
  const switchKind = usePatchBusiness(kind);
  const submit = useSubmitBusiness(kind);
  const current = draft.synced;
  const editable = current.capabilities.editProfile;
  const busy =
    draft.saving || submit.mutation.isPending || switchKind.mutation.isPending;
  const submitCode = submit.mutation.isError
    ? failureCode(submit.mutation.error)
    : undefined;
  const switchCode = switchKind.mutation.isError
    ? failureCode(switchKind.mutation.error)
    : undefined;

  function chooseKind(next: BusinessKind) {
    if (next === kind || !current.capabilities.changeKind) return;
    void switchKind.save(
      { expectedVersion: current.version, kind: next },
      async () => {
        // The draft now belongs to the other context; drop both kinds' reads.
        if (scope)
          await client.invalidateQueries({
            queryKey: ['private', scope, 'business'],
          });
        router.push(`${dashboardBase(next)}/onboarding`);
      },
    );
  }

  async function next() {
    if (step < 3) return setStep((step + 1) as Step);
    const fields = stepFields[step];
    if (fields) {
      const missing = missingForSubmit(draft.form);
      const relevant = Object.fromEntries(
        Object.entries(missing).filter(([field]) =>
          fields.includes(field as keyof FieldErrors),
        ),
      ) as FieldErrors;
      if (Object.keys(relevant).length) return draft.setErrors(relevant);
    }
    if (!editable) return setStep((step + 1) as Step);
    const saved = await draft.save();
    if (saved) setStep((step + 1) as Step);
  }

  async function finish() {
    const missing = missingForSubmit(draft.form);
    if (Object.keys(missing).length) {
      setStep(firstStepWith(missing));
      draft.setErrors(missing);
      return;
    }
    const saved = await draft.save();
    if (saved) void submit.run(saved.version, () => onSubmitted());
  }

  return {
    kind,
    step,
    setStep,
    draft,
    current,
    editable,
    busy,
    submitting: submit.mutation.isPending,
    errorCode: submitCode ?? switchCode,
    section: {
      form: draft.form,
      set: draft.set,
      errors: draft.errors,
      disabled: !editable || busy,
    },
    chooseKind,
    next,
    finish,
  };
}
