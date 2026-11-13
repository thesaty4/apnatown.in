import type {
  BusinessOwner,
  DeliveryMethod,
} from '@apnatown/shared/businesses';
import { nationalMobile } from './parts';

export type DayForm = { open: boolean; opensAt: string; closesAt: string };

/** Editable owner profile as typed text; the wire shape is built on save. */
export type ProfileForm = {
  nameEn: string;
  nameHi: string;
  description: string;
  categoryIds: string[];
  primaryCategoryId: string;
  cityId: string;
  areaId: string;
  addressText: string;
  location: { lat: number; lng: number } | null;
  businessPhone: string;
  whatsapp: string;
  email: string;
  instagramUrl: string;
  youtubeUrl: string;
  facebookUrl: string;
  /** Index = IST `dayOfWeek` (0 = Sunday). */
  hours: DayForm[];
  temporarilyClosed: boolean;
  deliveryMethod: '' | DeliveryMethod;
  deliveryRadiusKm: string;
  deliveryFee: string;
  minimumOrder: string;
  pickupEnabled: boolean;
  pickupInstructions: string;
  serviceArea: string;
  serviceRadiusKm: string;
  /** Server-issued Media asset IDs (owner image uploader); null = none. */
  logoAssetId: string | null;
  coverAssetId: string | null;
};

export type FieldName = keyof ProfileForm | 'hours';
/** Field → localized `business.fields.errors.*` key. */
export type FieldErrors = Partial<Record<FieldName, string>>;

/** Shown (and only saved if the owner edits them) when no hours exist yet. */
const defaultDay = (day: number): DayForm => ({
  open: day !== 0,
  opensAt: '09:00',
  closesAt: '21:00',
});

const rupees = (paise: number | null) => {
  if (paise === null) return '';
  const whole = Math.floor(paise / 100);
  const fraction = paise % 100;
  return fraction
    ? `${whole}.${String(fraction).padStart(2, '0')}`
    : `${whole}`;
};

export function fromOwner(owner: BusinessOwner): ProfileForm {
  const hours = Array.from({ length: 7 }, (_, day) => {
    const entry = owner.hours.find((item) => item.dayOfWeek === day);
    return entry
      ? {
          open: !entry.isClosed,
          opensAt: entry.opensAt ?? '09:00',
          closesAt: entry.closesAt ?? '21:00',
        }
      : defaultDay(day);
  });
  const s = owner.settings;
  return {
    nameEn: owner.nameEn ?? '',
    nameHi: owner.nameHi ?? '',
    description: owner.description ?? '',
    categoryIds: [...owner.categoryIds],
    primaryCategoryId: owner.primaryCategoryId ?? '',
    cityId: owner.cityId ?? '',
    areaId: owner.areaId ?? '',
    addressText: owner.addressText ?? '',
    location: owner.location,
    businessPhone: nationalMobile(owner.businessPhoneE164),
    whatsapp: nationalMobile(owner.whatsappE164),
    email: owner.email ?? '',
    instagramUrl: owner.instagramUrl ?? '',
    youtubeUrl: owner.youtubeUrl ?? '',
    facebookUrl: owner.facebookUrl ?? '',
    hours,
    temporarilyClosed: s.temporarilyClosed,
    deliveryMethod: s.deliveryMethod ?? '',
    deliveryRadiusKm:
      s.deliveryRadiusKm === null ? '' : String(s.deliveryRadiusKm),
    deliveryFee: rupees(s.deliveryFeePaise),
    minimumOrder: rupees(s.minimumOrderPaise),
    pickupEnabled: s.pickupEnabled,
    pickupInstructions: s.pickupInstructions ?? '',
    serviceArea: s.serviceArea ?? '',
    serviceRadiusKm:
      s.serviceRadiusKm === null ? '' : String(s.serviceRadiusKm),
    logoAssetId: owner.logoAssetId,
    coverAssetId: owner.coverAssetId,
  };
}

// Wire mappers live in form-patch.ts; re-exported so imports stay stable.
export { buildPatch, fieldFromServer, missingForSubmit } from './form-patch';
