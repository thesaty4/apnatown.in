'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  CreateAddressSchema,
  UpdateAddressSchema,
  type Address,
} from '@apnatown/shared/users';
import { AddressCard } from '@apnatown/ui/geo/Address';
import { Sheet } from '@apnatown/ui/overlay/Sheet';
import { Button } from '@apnatown/ui/primitives/Button';
import { Input } from '@apnatown/ui/primitives/Input';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import { Toggle } from '@apnatown/ui/primitives/Selection';
import { ApiFailure, failureCode } from '../../shared/api/result';
import { useIdempotencyKey } from '../../shared/api/idempotency';
import { useSaveAddress } from './address-queries';
import {
  AddressFailure,
  InlineAlert,
  useAddressDetails,
} from './address-parts';
import { GeoFields, LocationField, type Draft } from './AddressFields';

export type Latest = Address | 'missing' | 'failed';
type Props = {
  onSaved: (saved: Address, created: boolean) => void;
  findLatest: (id: string) => Promise<Latest>;
};

const draftOf = (address?: Address): Draft => ({
  label: address?.label ?? '',
  addressText: address?.addressText ?? '',
  landmark: address?.landmark ?? '',
  pinCode: address?.pinCode ?? '',
  cityId: address?.cityId ?? '',
  areaId: address?.areaId ?? '',
  lat: address?.lat ?? null,
  lng: address?.lng ?? null,
  isDefault: address?.isDefault ?? false,
});

// Explicit allow-list. Line breaks become separators: the API stores one plain-text line.
const bodyOf = (draft: Draft) => ({
  label: draft.label.trim(),
  addressText: draft.addressText
    .replace(/\s*[\r\n]+\s*/gu, ', ')
    .replace(/\t/gu, ' ')
    .trim(),
  landmark: draft.landmark.trim() || null,
  pinCode: draft.pinCode.trim(),
  cityId: draft.cityId,
  areaId: draft.areaId || null,
  lat: draft.lat,
  lng: draft.lng,
  isDefault: draft.isDefault,
});

/** Always mounted so the native dialog restores focus; owns the pending save. */
export function AddressSheet({
  target,
  onClose,
  ...props
}: Props & { target: Address | 'new' | undefined; onClose: () => void }) {
  const t = useTranslations('account.addresses');
  const mutation = useSaveAddress();
  const keys = useIdempotencyKey();
  const address = target === 'new' ? undefined : target;
  const close = () => {
    mutation.reset();
    onClose();
  };
  return (
    <Sheet
      open={target !== undefined}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      title={t(address ? 'editTitle' : 'addNew')}
      closeLabel={t('close')}
      busy={mutation.isPending}
      wide
    >
      {target !== undefined && (
        <AddressForm
          key={address?.id ?? 'new'}
          address={address}
          mutation={mutation}
          keys={keys}
          onCancel={close}
          {...props}
        />
      )}
    </Sheet>
  );
}

function AddressForm({
  address,
  mutation,
  keys,
  onCancel,
  onSaved,
  findLatest,
}: Props & {
  address: Address | undefined;
  mutation: ReturnType<typeof useSaveAddress>;
  keys: ReturnType<typeof useIdempotencyKey>;
  onCancel: () => void;
}) {
  const t = useTranslations('account.addresses');
  const details = useAddressDetails();
  const [draft, setDraft] = useState(() => draftOf(address));
  const [baseVersion, setBaseVersion] = useState(address?.version ?? 0);
  const [fields, setFields] = useState<readonly string[]>([]);
  const [latest, setLatest] = useState<Latest>();
  const [reviewing, setReviewing] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const alert = useRef<HTMLDivElement>(null);
  const busy = mutation.isPending;
  const error = mutation.isError ? failureCode(mutation.error) : undefined;
  const serverFields =
    mutation.error instanceof ApiFailure ? mutation.error.fields : [];
  const invalid = new Set(
    [...fields, ...serverFields].map((field) =>
      field === 'lat' || field === 'lng' ? 'location' : field,
    ),
  );
  const update = (patch: Partial<Draft>) =>
    setDraft((current) => ({ ...current, ...patch }));
  const fieldError = (field: string, key: string) =>
    invalid.has(field) ? t(`form.${key}`) : undefined;

  useEffect(() => {
    if (!fields.length && !mutation.isError) return;
    (
      form.current?.querySelector<HTMLElement>(
        '[aria-invalid="true"], [data-invalid]',
      ) ?? alert.current
    )?.focus();
  }, [fields, mutation.isError]);

  async function save() {
    if (busy) return;
    mutation.reset();
    const body = bodyOf(draft);
    const parsed = address
      ? UpdateAddressSchema.safeParse({ ...body, expectedVersion: baseVersion })
      : CreateAddressSchema.safeParse(body);
    if (!parsed.success) {
      setFields(
        parsed.error.issues.map((issue) =>
          issue.path.length ? String(issue.path[0]) : 'location',
        ),
      );
      return;
    }
    setFields([]);
    setLatest(undefined);
    // Same payload (a retry) keeps its key; any edit is a new command.
    const input = address
      ? {
          kind: 'update' as const,
          id: address.id,
          body: { ...body, expectedVersion: baseVersion },
        }
      : { kind: 'create' as const, body };
    await mutation.run(
      { ...input, key: keys.for(JSON.stringify(input)) },
      (saved) => {
        keys.clear();
        mutation.reset();
        onSaved(saved, !address);
      },
    );
  }

  async function review() {
    if (!address || reviewing) return;
    setReviewing(true);
    const found = await findLatest(address.id);
    setReviewing(false);
    setLatest(found);
    if (typeof found !== 'object') return;
    // The draft stays untouched; saving again explicitly targets this version.
    setBaseVersion(found.version);
    mutation.reset();
  }

  return (
    <form
      ref={form}
      className="grid gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <Input
        label={t('form.label')}
        hint={t('form.labelHint')}
        value={draft.label}
        maxLength={60}
        required
        disabled={busy}
        onChange={(event) => update({ label: event.target.value })}
        error={fieldError('label', 'invalidLabel')}
      />
      <TextArea
        label={t('form.addressText')}
        hint={t('form.addressHint')}
        value={draft.addressText}
        maxLength={1000}
        rows={3}
        autoComplete="street-address"
        required
        disabled={busy}
        onChange={(event) => update({ addressText: event.target.value })}
        error={fieldError('addressText', 'invalidAddress')}
      />
      <Input
        label={t('form.landmark')}
        value={draft.landmark}
        maxLength={200}
        disabled={busy}
        onChange={(event) => update({ landmark: event.target.value })}
        error={fieldError('landmark', 'invalidLandmark')}
      />
      <Input
        label={t('form.pinCode')}
        value={draft.pinCode}
        inputMode="numeric"
        autoComplete="postal-code"
        maxLength={6}
        required
        disabled={busy}
        onChange={(event) =>
          update({ pinCode: event.target.value.replace(/\D/gu, '') })
        }
        error={fieldError('pinCode', 'invalidPin')}
      />
      <GeoFields
        draft={draft}
        update={update}
        busy={busy}
        cityError={fieldError('cityId', 'invalidCity')}
        areaError={fieldError('areaId', 'invalidArea')}
      />
      <LocationField
        draft={draft}
        update={update}
        busy={busy}
        error={fieldError('location', 'invalidLocation')}
      />
      <Toggle
        label={t('form.default')}
        description={t('form.defaultHint')}
        checked={draft.isDefault}
        disabled={busy}
        onChange={(event) => update({ isDefault: event.target.checked })}
      />
      <div ref={alert} tabIndex={-1} className="grid gap-2 outline-none">
        {error === 'ADDRESS_VERSION_CONFLICT' ? (
          <InlineAlert
            message={t('errors.draftConflict')}
            action={
              <Button
                type="button"
                variant="outline"
                loading={reviewing}
                onClick={() => void review()}
              >
                {t('errors.loadLatest')}
              </Button>
            }
          />
        ) : (
          error && (
            <AddressFailure
              code={error}
              busy={busy || reviewing}
              retry={() => void save()}
              refresh={() => void review()}
            />
          )
        )}
        {latest === 'missing' && <InlineAlert message={t('errors.gone')} />}
        {latest === 'failed' && (
          <InlineAlert
            message={t('refreshFailed')}
            action={
              <Button
                type="button"
                variant="outline"
                loading={reviewing}
                onClick={() => void review()}
              >
                {t('retry')}
              </Button>
            }
          />
        )}
        {typeof latest === 'object' && (
          <section className="grid gap-2" aria-label={t('errors.latestTitle')}>
            <p role="status">{t('errors.reviewing')}</p>
            <AddressCard
              headingLevel={3}
              label={latest.label}
              addressText={latest.addressText}
              details={details(latest)}
              defaultLabel={latest.isDefault ? t('default') : undefined}
            />
          </section>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={busy} className="min-w-0 flex-1">
          {t('form.save')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          className="min-w-0 flex-1"
          onClick={onCancel}
        >
          {t('cancel')}
        </Button>
      </div>
    </form>
  );
}
