import {
  BusinessProfilePatchSchema,
  type BusinessKind,
  type BusinessProfilePatch,
} from '@apnatown/shared/businesses';
import { parseRupees } from '@apnatown/shared';
import type { FieldErrors, FieldName, ProfileForm } from './form-model';

/** Profile form → allow-listed `PATCH /businesses/me` mappers and checks. */

const text = (value: string) => (value.trim() ? value.trim() : null);
const mobile = (value: string) => {
  const digits = value.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  return digits ? `+91${digits}` : null;
};

type Built = { value: unknown; error?: string };
const money = (value: string): Built => {
  if (!value.trim()) return { value: null };
  const paise = parseRupees(value.trim());
  return paise === null ? { value: null, error: 'money' } : { value: paise };
};
const km = (value: string): Built => {
  if (!value.trim()) return { value: null };
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) &&
    parsed >= 0 &&
    /^\d+(?:\.\d{1,2})?$/.test(value.trim())
    ? { value: parsed }
    : { value: null, error: 'radius' };
};

/** Wire values per form field group (excluding version). */
function wire(form: ProfileForm, kind: BusinessKind) {
  const errors: FieldErrors = {};
  const pick = (field: FieldName, built: Built) => {
    if (built.error) errors[field] = built.error;
    return built.value;
  };
  const settings: Record<string, unknown> = {
    temporarilyClosed: form.temporarilyClosed,
  };
  if (kind === 'shop') {
    settings.deliveryMethod = form.deliveryMethod || null;
    settings.deliveryRadiusKm = pick(
      'deliveryRadiusKm',
      km(form.deliveryRadiusKm),
    );
    settings.deliveryFeePaise =
      form.deliveryMethod === 'self'
        ? pick('deliveryFee', money(form.deliveryFee))
        : null;
    settings.minimumOrderPaise = pick('minimumOrder', money(form.minimumOrder));
    settings.pickupEnabled = form.pickupEnabled;
    settings.pickupInstructions = form.pickupEnabled
      ? text(form.pickupInstructions)
      : null;
  } else {
    settings.serviceArea = text(form.serviceArea);
    settings.serviceRadiusKm = pick(
      'serviceRadiusKm',
      km(form.serviceRadiusKm),
    );
  }
  const values = {
    nameEn: text(form.nameEn),
    nameHi: text(form.nameHi),
    description: text(form.description),
    categories: {
      categoryIds: form.categoryIds,
      primaryCategoryId: form.categoryIds.length
        ? form.primaryCategoryId || null
        : null,
    },
    areaId: form.areaId || null,
    addressText: text(form.addressText),
    location: form.location,
    businessPhoneE164: mobile(form.businessPhone),
    whatsappE164: mobile(form.whatsapp),
    email: text(form.email),
    instagramUrl: text(form.instagramUrl),
    youtubeUrl: text(form.youtubeUrl),
    facebookUrl: text(form.facebookUrl),
    hours: form.hours.map((day, dayOfWeek) => ({
      dayOfWeek,
      isClosed: !day.open,
      opensAt: day.open ? day.opensAt : null,
      closesAt: day.open ? day.closesAt : null,
    })),
    logoAssetId: form.logoAssetId,
    coverAssetId: form.coverAssetId,
    settings,
  };
  return { values, errors };
}

const issueField: Record<string, FieldName> = {
  nameEn: 'nameEn',
  nameHi: 'nameHi',
  description: 'description',
  categoryIds: 'categoryIds',
  primaryCategoryId: 'primaryCategoryId',
  areaId: 'areaId',
  addressText: 'addressText',
  businessPhoneE164: 'businessPhone',
  whatsappE164: 'whatsapp',
  email: 'email',
  instagramUrl: 'instagramUrl',
  youtubeUrl: 'youtubeUrl',
  facebookUrl: 'facebookUrl',
  hours: 'hours',
  deliveryMethod: 'deliveryMethod',
  deliveryRadiusKm: 'deliveryRadiusKm',
  deliveryFeePaise: 'deliveryFee',
  minimumOrderPaise: 'minimumOrder',
  pickupInstructions: 'pickupInstructions',
  serviceArea: 'serviceArea',
  serviceRadiusKm: 'serviceRadiusKm',
  logoAssetId: 'logoAssetId',
  coverAssetId: 'coverAssetId',
};

/** Maps an API `details.field` (e.g. `settings.serviceArea`) to a form field. */
export function fieldFromServer(field: string): FieldName | undefined {
  return issueField[field.split('.').pop() ?? ''];
}

/**
 * Builds the allow-listed patch of CHANGED groups only (an untouched default
 * schedule is never saved). Client checks reuse the shared Zod contract for
 * fast feedback; the server stays authoritative.
 */
export function buildPatch(
  form: ProfileForm,
  baseline: ProfileForm,
  kind: BusinessKind,
  expectedVersion: number,
): { patch: BusinessProfilePatch; changed: boolean } | { errors: FieldErrors } {
  const next = wire(form, kind);
  const before = wire(baseline, kind).values;
  const errors: FieldErrors = { ...next.errors };
  const patch: Record<string, unknown> = { expectedVersion };
  let changed = false;
  for (const [key, value] of Object.entries(next.values)) {
    const previous = before[key as keyof typeof before];
    if (JSON.stringify(value) === JSON.stringify(previous)) continue;
    changed = true;
    if (key === 'categories') Object.assign(patch, value);
    else if (key === 'settings') {
      const delta = Object.fromEntries(
        Object.entries(value as Record<string, unknown>).filter(
          ([name, member]) =>
            JSON.stringify(member) !==
            JSON.stringify((previous as Record<string, unknown>)[name]),
        ),
      );
      patch.settings = delta;
    } else patch[key] = value;
  }
  // The primary category always travels with its set (shared refine).
  if ('primaryCategoryId' in patch && !('categoryIds' in patch))
    patch.categoryIds = next.values.categories.categoryIds;
  if (next.values.categories.categoryIds.length && !form.primaryCategoryId)
    errors.primaryCategoryId = 'primary';
  // Business phone is required on the wire (never cleared).
  if (patch.businessPhoneE164 === null) errors.businessPhone = 'phone';
  if (form.hours.some((day) => day.open && day.opensAt === day.closesAt))
    errors.hours = 'hours';
  // Enabled delivery needs every checkout value (null is never zero).
  if (
    kind === 'shop' &&
    form.deliveryMethod &&
    (!form.deliveryRadiusKm.trim() ||
      !form.minimumOrder.trim() ||
      (form.deliveryMethod === 'self' && !form.deliveryFee.trim()))
  )
    errors.deliveryMethod = 'deliveryIncomplete';
  const parsed = BusinessProfilePatchSchema.safeParse(patch);
  if (!parsed.success)
    for (const issue of parsed.error.issues) {
      const name = [...issue.path]
        .reverse()
        .find(
          (part): part is string =>
            typeof part === 'string' && part in issueField,
        );
      const field = name ? issueField[name] : undefined;
      if (field && !errors[field]) errors[field] = field;
    }
  if (Object.keys(errors).length) return { errors };
  return {
    patch: parsed.success ? parsed.data : (patch as BusinessProfilePatch),
    changed,
  };
}

/** Requirements the server enforces at submit (UX pre-check only). */
export function missingForSubmit(form: ProfileForm): FieldErrors {
  const errors: FieldErrors = {};
  if (form.nameEn.trim().length < 2) errors.nameEn = 'required';
  if (!form.categoryIds.length) errors.categoryIds = 'required';
  else if (!form.primaryCategoryId) errors.primaryCategoryId = 'primary';
  if (!form.areaId) errors.areaId = 'required';
  if (form.addressText.trim().length < 5) errors.addressText = 'address';
  return errors;
}
