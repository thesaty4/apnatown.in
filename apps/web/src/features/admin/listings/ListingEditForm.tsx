'use client';

import { useId, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import {
  AdminListingEditSchema,
  type AdminListingDetail,
  type AdminListingEdit,
} from '@apnatown/shared/admin';
import type { BusinessDecisionAction } from '@apnatown/shared/businesses';
import { Input } from '@apnatown/ui/primitives/Input';
import { Select } from '@apnatown/ui/primitives/Select';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { ACTION_ORDER, REASON_REQUIRED } from '../approvals/decision-actions';
import { actionKey } from '../approvals/parts';

/** Values the admin typed; unchanged fields are omitted from the PATCH. */
type Draft = {
  nameEn: string;
  nameHi: string;
  phone: string;
  statusAction: BusinessDecisionAction | '';
  note: string;
};
type FieldError = 'nameEn' | 'nameHi' | 'phone' | 'note' | 'noChange';

/** Builds the minimal edit or reports which field is invalid. */
function toEdit(
  draft: Draft,
  listing: AdminListingDetail['listing'],
): AdminListingEdit | FieldError {
  const nameEn = draft.nameEn.trim();
  const nameHi = draft.nameHi.trim();
  const phone = draft.phone.trim();
  const note = draft.note.trim();
  const edit: Record<string, unknown> = { expectedVersion: listing.version };
  if (nameEn !== (listing.nameEn ?? '')) edit.nameEn = nameEn;
  if (nameHi !== (listing.nameHi ?? '')) edit.nameHi = nameHi || null;
  if (phone !== listing.phoneE164) edit.phoneE164 = phone;
  if (draft.statusAction) edit.statusAction = draft.statusAction;
  if (note) edit.note = note;
  const parsed = AdminListingEditSchema.safeParse(edit);
  if (parsed.success) return parsed.data;
  const path = String(parsed.error.issues[0]?.path[0] ?? '');
  if (path === 'nameEn' || path === 'nameHi' || path === 'note') return path;
  if (path === 'phoneE164') return 'phone';
  return 'noChange';
}

/**
 * Prototype entEdit: Name, Phone, Status, Note (shown in audit log). Fields
 * the caller may not change stay read-only; `allowedActions` from the server
 * decides, and the server re-checks every command.
 */
export function ListingEditForm({
  formId,
  detail,
  busy,
  onSubmit,
}: {
  formId: string;
  detail: AdminListingDetail;
  busy: boolean;
  onSubmit: (edit: AdminListingEdit) => void;
}) {
  const t = useTranslations('admin.listings.edit');
  const ta = useTranslations('admin.approvals.actions');
  const { listing, allowedActions } = detail;
  const canEdit = allowedActions.includes('edit');
  const decisions = ACTION_ORDER.filter((action) =>
    allowedActions.includes(action),
  );
  const [draft, setDraft] = useState<Draft>({
    nameEn: listing.nameEn ?? '',
    nameHi: listing.nameHi ?? '',
    phone: listing.phoneE164,
    statusAction: '',
    note: '',
  });
  const [error, setError] = useState<FieldError>();
  const errorId = useId();
  const noteRequired = Boolean(
    draft.statusAction && REASON_REQUIRED.has(draft.statusAction),
  );
  const set = (patch: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setError(undefined);
  };
  const fieldError = (field: FieldError) =>
    error === field ? t(`errors.${field}`) : undefined;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = toEdit(draft, listing);
    if (typeof result === 'string') setError(result);
    else onSubmit(result);
  }

  return (
    <form
      id={formId}
      noValidate
      aria-describedby={error === 'noChange' ? errorId : undefined}
      className="grid gap-3"
      onSubmit={submit}
    >
      <fieldset disabled={busy} className="m-0 grid min-w-0 gap-3 border-0 p-0">
        <Input
          label={t('nameEn')}
          value={draft.nameEn}
          maxLength={80}
          readOnly={!canEdit}
          required
          error={fieldError('nameEn')}
          aria-invalid={error === 'nameEn' || undefined}
          onChange={(event) => set({ nameEn: event.target.value })}
        />
        <Input
          label={t('nameHi')}
          lang="hi"
          value={draft.nameHi}
          maxLength={80}
          readOnly={!canEdit}
          error={fieldError('nameHi')}
          aria-invalid={error === 'nameHi' || undefined}
          onChange={(event) => set({ nameHi: event.target.value })}
        />
        <Input
          type="tel"
          label={t('phone')}
          hint={t('phoneHint')}
          value={draft.phone}
          autoComplete="off"
          inputMode="tel"
          readOnly={!canEdit}
          error={fieldError('phone')}
          aria-invalid={error === 'phone' || undefined}
          onChange={(event) => set({ phone: event.target.value })}
        />
        {decisions.length > 0 && (
          <Select
            label={t('status')}
            hint={t('statusHint')}
            value={draft.statusAction}
            options={[
              { value: '', label: t('noStatusChange') },
              ...decisions.map((action) => ({
                value: action,
                label: ta(`${actionKey[action]}.label`),
              })),
            ]}
            onChange={(event) =>
              set({
                statusAction: event.target.value as Draft['statusAction'],
              })
            }
          />
        )}
        {(canEdit || decisions.length > 0) && (
          <TextArea
            label={noteRequired ? t('noteRequired') : t('note')}
            hint={t('noteHint')}
            value={draft.note}
            maxLength={500}
            required={noteRequired}
            error={fieldError('note')}
            aria-invalid={error === 'note' || undefined}
            onChange={(event) => set({ note: event.target.value })}
          />
        )}
        {error === 'noChange' && (
          <p id={errorId} role="alert" className="m-0 text-small text-error">
            {t('errors.noChange')}
          </p>
        )}
      </fieldset>
    </form>
  );
}
