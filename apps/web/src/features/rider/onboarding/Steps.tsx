'use client';

import { useTranslations } from 'next-intl';
import {
  RIDER_VEHICLE_TYPES,
  type RiderProfile,
  type RiderVehicleType,
} from '@apnatown/shared/delivery';
import { Input } from '@apnatown/ui/primitives/Input';
import { Select } from '@apnatown/ui/primitives/Select';
import { CityAreaFields } from '../../geo';
import { Notice } from '../parts';
import {
  fieldId,
  hasSavedPayout,
  type RiderField,
  type RiderFieldErrors,
  type RiderForm,
} from './form';

export type StepProps = {
  form: RiderForm;
  set: (patch: Partial<RiderForm>) => void;
  errors: RiderFieldErrors;
  disabled: boolean;
  profile: RiderProfile;
};

function useError(errors: RiderFieldErrors) {
  const t = useTranslations('rider.onboard.errors');
  return (field: RiderField) => {
    const key = errors[field];
    return key ? t(key) : undefined;
  };
}

/** Step 1: name + validated Geo city/area (area required only at submit). */
export function ProfileStep({ form, set, errors, disabled }: StepProps) {
  const t = useTranslations('rider.onboard.fields');
  const error = useError(errors);
  return (
    <>
      <Input
        id={fieldId('fullName')}
        label={t('fullName')}
        required
        minLength={2}
        maxLength={60}
        autoComplete="name"
        value={form.fullName}
        disabled={disabled}
        error={error('fullName')}
        onChange={(event) => set({ fullName: event.target.value })}
      />
      <p className="m-0 text-small text-text-2">{t('areaHint')}</p>
      <CityAreaFields
        idPrefix="rider-geo"
        cityId={form.cityId}
        areaId={form.areaId}
        onChange={set}
        disabled={disabled}
        cityError={error('cityId')}
        areaError={error('areaId')}
        labels={{
          city: t('city'),
          chooseCity: t('chooseCity'),
          area: t('area'),
          chooseArea: t('chooseArea'),
          cityFirst: t('cityFirst'),
          loadingOptions: t('loadingOptions'),
          moreOptions: t('moreOptions'),
          failed: t('locationsFailed'),
          retry: t('retry'),
        }}
      />
    </>
  );
}

export function VehicleStep({ form, set, errors, disabled }: StepProps) {
  const t = useTranslations('rider.onboard.fields');
  const vehicles = useTranslations('rider.vehicle');
  const error = useError(errors);
  return (
    <>
      <Select
        id={fieldId('vehicleType')}
        label={t('vehicleType')}
        required
        value={form.vehicleType}
        disabled={disabled}
        error={error('vehicleType')}
        onChange={(event) =>
          set({ vehicleType: event.target.value as RiderVehicleType | '' })
        }
        options={[
          { value: '', label: t('chooseVehicle') },
          ...RIDER_VEHICLE_TYPES.map((type) => ({
            value: type,
            label: vehicles(type),
          })),
        ]}
      />
      <Input
        id={fieldId('vehicleNumber')}
        label={t('vehicleNumber')}
        hint={t('vehicleNumberHint')}
        maxLength={20}
        autoCapitalize="characters"
        value={form.vehicleNumber}
        disabled={disabled}
        error={error('vehicleNumber')}
        onChange={(event) => set({ vehicleNumber: event.target.value })}
      />
    </>
  );
}

/** Step 3: KYC upload is gated server-side; no uploader is offered. */
export function DocumentsStep() {
  const t = useTranslations('rider.onboard.documents');
  return (
    <Notice tone="info" role="status" icon="📄" title={t('unavailableTitle')}>
      <p className="m-0">{t('unavailableBody')}</p>
    </Notice>
  );
}

/** Step 4: write-only UPI (+ optional bank); only masked text is ever shown. */
export function PayoutStep({
  form,
  set,
  errors,
  disabled,
  profile,
}: StepProps) {
  const t = useTranslations('rider.onboard.fields');
  const error = useError(errors);
  const saved = hasSavedPayout(profile);
  return (
    <>
      {saved && (
        <Notice tone="ok" role="status" title={t('payoutSaved')}>
          <p className="m-0">
            <bdi>{profile.payoutMasked?.upi}</bdi>
            {profile.payoutMasked?.bank && (
              <>
                {' · '}
                <bdi>{profile.payoutMasked.bank}</bdi>
              </>
            )}
          </p>
          <p className="m-0 text-small text-text-2">{t('payoutKeep')}</p>
        </Notice>
      )}
      <Input
        id={fieldId('upi')}
        label={t('upi')}
        hint={t('upiHint')}
        required={!saved}
        maxLength={100}
        autoComplete="off"
        spellCheck={false}
        value={form.upi}
        disabled={disabled}
        error={error('upi')}
        onChange={(event) => set({ upi: event.target.value })}
      />
      <Input
        id={fieldId('bankAccount')}
        label={t('bankAccount')}
        hint={t('bankAccountHint')}
        inputMode="numeric"
        maxLength={18}
        autoComplete="off"
        value={form.bankAccount}
        disabled={disabled}
        error={error('bankAccount')}
        onChange={(event) => set({ bankAccount: event.target.value })}
      />
    </>
  );
}

/** Step 5: summary of the saved application (server values, masked payout). */
export function ReviewStep({ profile }: StepProps) {
  const t = useTranslations('rider.onboard.review');
  const vehicles = useTranslations('rider.vehicle');
  const missing = t('missing');
  const rows: [string, string][] = [
    [t('fullName'), profile.profile.fullName ?? missing],
    [
      t('area'),
      [profile.profile.areaName, profile.profile.cityName]
        .filter(Boolean)
        .join(', ') || missing,
    ],
    [
      t('vehicle'),
      profile.vehicle
        ? [vehicles(profile.vehicle.type), profile.vehicle.number]
            .filter(Boolean)
            .join(' · ')
        : missing,
    ],
    [t('payout'), profile.payoutMasked?.upi ?? missing],
    [
      t('documents'),
      profile.documents.length > 0
        ? t('documentsCount', { count: profile.documents.length })
        : t('documentsUnavailable'),
    ],
  ];
  return (
    <dl className="m-0 grid gap-2">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="grid min-w-0 gap-1 rounded-md border border-border p-3"
        >
          <dt className="text-small text-muted">{label}</dt>
          <dd className="m-0 font-semibold [overflow-wrap:anywhere]">
            {value === missing ? (
              <span className="text-warning">
                <span aria-hidden="true">⚠️ </span>
                {value}
              </span>
            ) : (
              <bdi>{value}</bdi>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
