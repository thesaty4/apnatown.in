'use client';

import { useState } from 'react';
import type { BusinessOwner } from '@apnatown/shared/businesses';
import { failureCode } from '../../shared/api/result';
import {
  buildPatch,
  fieldFromServer,
  fromOwner,
  type FieldErrors,
  type ProfileForm,
} from './form-model';
import { useBusinessMe, usePatchBusiness } from './queries';

export type DraftStatus = 'idle' | 'saved' | 'noChanges' | 'invalid';

const serverFields = (error: unknown): FieldErrors => {
  if (!error || typeof error !== 'object' || !('fields' in error)) return {};
  const fields = Array.isArray(error.fields) ? (error.fields as unknown[]) : [];
  const errors: FieldErrors = {};
  for (const name of fields) {
    const field = typeof name === 'string' ? fieldFromServer(name) : undefined;
    if (field) errors[field] = field;
  }
  return errors;
};

/** Moves keyboard focus to the first invalid control after a failed save. */
export function focusFirstInvalid() {
  requestAnimationFrame(() => {
    document
      .querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus({ preventScroll: false });
  });
}

/**
 * Owner profile draft shared by onboarding and the profile editor: local form
 * values, the server baseline they diff against, the `expectedVersion` guard
 * and version-conflict recovery that never drops the owner's typed values.
 */
export function useProfileDraft(owner: BusinessOwner) {
  const kind = owner.kind;
  const me = useBusinessMe(kind);
  const patch = usePatchBusiness(kind);
  const [synced, setSynced] = useState(owner);
  const [baseline, setBaseline] = useState(() => fromOwner(owner));
  const [form, setForm] = useState<ProfileForm>(baseline);
  const [localErrors, setLocalErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<DraftStatus>('idle');

  const code = patch.mutation.isError
    ? failureCode(patch.mutation.error)
    : undefined;
  const conflict = code === 'BUSINESS_VERSION_CONFLICT';
  const errors: FieldErrors = {
    // BUSINESS_MEDIA_INVALID names the rejected image in `details.field`.
    ...(code === 'VALIDATION_ERROR' ||
    code === 'COMMON_VALIDATION' ||
    code === 'BUSINESS_MEDIA_INVALID'
      ? serverFields(patch.mutation.error)
      : {}),
    ...localErrors,
  };
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);

  function set(next: Partial<ProfileForm>) {
    setForm((current) => ({ ...current, ...next }));
    setStatus('idle');
    setLocalErrors((current) => {
      const copy = { ...current };
      for (const key of Object.keys(next))
        delete copy[key as keyof ProfileForm];
      if ('hours' in next) delete copy.hours;
      return copy;
    });
  }

  function adopt(latest: BusinessOwner) {
    setSynced(latest);
    const values = fromOwner(latest);
    setBaseline(values);
    setForm(values);
  }

  /** Saves changed groups; resolves with the authoritative owner or null. */
  async function save(): Promise<BusinessOwner | null> {
    const built = buildPatch(form, baseline, kind, synced.version);
    if ('errors' in built) {
      setLocalErrors(built.errors);
      setStatus('invalid');
      focusFirstInvalid();
      return null;
    }
    setLocalErrors({});
    if (!built.changed) {
      setStatus('noChanges');
      return synced;
    }
    let saved: BusinessOwner | null = null;
    await patch.save(built.patch, (output) => {
      saved = output;
      adopt(output);
      setStatus('saved');
    });
    return saved;
  }

  /** Conflict recovery: rebase on the latest version, KEEP typed values. */
  async function reloadKeep() {
    const latest = await me.refetch();
    if (!latest.data) return;
    setSynced(latest.data);
    setBaseline(fromOwner(latest.data));
    patch.mutation.reset();
  }

  /** Conflict recovery: drop local edits for the latest server values. */
  async function discard() {
    const latest = await me.refetch();
    if (!latest.data) return;
    adopt(latest.data);
    setLocalErrors({});
    setStatus('idle');
    patch.mutation.reset();
  }

  return {
    form,
    set,
    /** Replace field errors (e.g. submit pre-check). */
    setErrors: (next: FieldErrors) => {
      setLocalErrors(next);
      if (Object.keys(next).length) focusFirstInvalid();
    },
    errors,
    status,
    synced,
    dirty,
    saving: patch.mutation.isPending,
    reloading: me.isFetching,
    code,
    conflict,
    save,
    reloadKeep,
    discard,
    adopt,
  };
}

export type ProfileDraft = ReturnType<typeof useProfileDraft>;
