import {
  RiderDraftWriteSchema,
  type RiderDraftWrite,
  type RiderProfile,
  type RiderVehicleType,
} from '@apnatown/shared/delivery';

/** Prototype's five steps (final version): Profile → Vehicle → Documents → Payout → Review. */
export const RIDER_STEPS = [
  'profile',
  'vehicle',
  'documents',
  'payout',
  'review',
] as const;
export type RiderStep = 1 | 2 | 3 | 4 | 5;

/**
 * Local draft. Payout fields are write-only: they start empty, live only in
 * component memory and are never cached, persisted or sent to analytics.
 */
export type RiderForm = {
  fullName: string;
  cityId: string;
  areaId: string;
  vehicleType: RiderVehicleType | '';
  vehicleNumber: string;
  upi: string;
  bankAccount: string;
};
export type RiderField = keyof RiderForm;
/** Field → `rider.onboard.errors.<field>` key. */
export type RiderFieldErrors = Partial<Record<RiderField, RiderField>>;

export function formFrom(profile: RiderProfile): RiderForm {
  return {
    fullName: profile.profile.fullName ?? '',
    cityId: profile.profile.cityId ?? '',
    areaId: profile.profile.areaId ?? '',
    vehicleType: profile.vehicle?.type ?? '',
    vehicleNumber: profile.vehicle?.number ?? '',
    upi: '',
    bankAccount: '',
  };
}

export const hasSavedPayout = (profile: RiderProfile) =>
  Boolean(profile.payoutMasked?.upi);

/** Resume at the first step the saved draft has not covered yet. */
export function resumeStep(profile: RiderProfile): RiderStep {
  if (!profile.profile.fullName) return 1;
  if (!profile.vehicle) return 2;
  if (!hasSavedPayout(profile)) return 3;
  return 5;
}

/** Field order for "focus first invalid field". */
export const FIELD_ORDER: readonly RiderField[] = [
  'fullName',
  'cityId',
  'areaId',
  'vehicleType',
  'vehicleNumber',
  'upi',
  'bankAccount',
];
export const fieldId = (field: RiderField) =>
  field === 'cityId'
    ? 'rider-geo-city'
    : field === 'areaId'
      ? 'rider-geo-area'
      : `rider-${field}`;

const issueField: Record<string, RiderField> = {
  'profile.fullName': 'fullName',
  'profile.cityId': 'cityId',
  'profile.areaId': 'areaId',
  'vehicle.type': 'vehicleType',
  'vehicle.number': 'vehicleNumber',
  'payout.upi': 'upi',
  'payout.bankAccount': 'bankAccount',
};

/** Server field names (`details.field` / `fields`) → local fields. */
export function serverFields(names: readonly string[]): RiderFieldErrors {
  const errors: RiderFieldErrors = {};
  for (const name of names) {
    const field =
      issueField[name] ??
      FIELD_ORDER.find((candidate) => candidate === name) ??
      (name === 'area' ? 'areaId' : undefined);
    if (field) errors[field] = field;
  }
  return errors;
}

export const firstInvalid = (errors: RiderFieldErrors) =>
  FIELD_ORDER.find((field) => errors[field]);

export type StepBody =
  | { kind: 'save'; body: RiderDraftWrite }
  | { kind: 'skip' }
  | { kind: 'invalid'; errors: RiderFieldErrors };

/**
 * Body for the current step only (S-RIDE-01: save only the current step's
 * fields). Documents never write (upload is gated); a saved payout may be kept.
 */
export function stepBody(
  step: RiderStep,
  form: RiderForm,
  profile: RiderProfile,
): StepBody {
  const base = { expectedVersion: profile.version, step };
  let body: RiderDraftWrite;
  if (step === 1)
    body = {
      ...base,
      profile: {
        fullName: form.fullName.trim(),
        ...(form.cityId ? { cityId: form.cityId } : {}),
        ...(form.areaId ? { areaId: form.areaId } : {}),
      },
    };
  else if (step === 2) {
    if (!form.vehicleType)
      return { kind: 'invalid', errors: { vehicleType: 'vehicleType' } };
    const number = form.vehicleNumber.trim();
    body = {
      ...base,
      vehicle: { type: form.vehicleType, ...(number ? { number } : {}) },
    };
  } else if (step === 3) return { kind: 'skip' };
  else if (step === 4) {
    const upi = form.upi.trim();
    const bank = form.bankAccount.trim();
    if (!upi && !bank && hasSavedPayout(profile)) return { kind: 'skip' };
    body = {
      ...base,
      payout: { upi, ...(bank ? { bankAccount: bank } : {}) },
    };
  } else body = { ...base, submit: true };
  const parsed = RiderDraftWriteSchema.safeParse(body);
  if (parsed.success) return { kind: 'save', body: parsed.data };
  const errors: RiderFieldErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issueField[issue.path.join('.')];
    if (field) errors[field] ??= field;
  }
  return { kind: 'invalid', errors };
}
