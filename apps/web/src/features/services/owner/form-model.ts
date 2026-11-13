import { parseRupees } from '@apnatown/shared/formatters';
import {
  SERVICE_LIST_ITEMS_MAX,
  servicePriceViolation,
  ServiceTitleSchema,
  type ServiceOwner,
  type ServiceOwnerCreate,
  type ServiceOwnerPatch,
  type ServicePriceType,
  type ServiceStatus,
  type ServiceUnit,
} from '@apnatown/shared/services';
import type { OwnerMediaItem } from '../../media/owner-images';

/** Editable string form; amounts are typed rupees, converted to paise once. */
export type ServiceForm = {
  nameEn: string;
  nameHi: string;
  categoryId: string;
  subcategoryId: string;
  description: string;
  priceType: ServicePriceType;
  priceFrom: string;
  priceTo: string;
  unit: ServiceUnit | '';
  included: string;
  excluded: string;
  serviceArea: string;
  media: OwnerMediaItem[];
  galleryVisible: boolean;
  featuredSelected: boolean;
  status: ServiceStatus;
};

export type ServiceField =
  | 'nameEn'
  | 'nameHi'
  | 'categoryId'
  | 'subcategoryId'
  | 'description'
  | 'priceFromPaise'
  | 'priceToPaise'
  | 'unit'
  | 'included'
  | 'excluded'
  | 'serviceArea'
  | 'media'
  | 'featuredSelected';

export type ServiceIssues = Partial<Record<ServiceField, string>>;

/** Paise → plain rupee text for the input (`49900` → `499`, `150` → `1.50`). */
export function rupeeText(paise: number | null) {
  if (paise === null) return '';
  const fraction = paise % 100;
  const whole = Math.floor(paise / 100);
  return fraction
    ? `${whole}.${String(fraction).padStart(2, '0')}`
    : `${whole}`;
}

export function emptyServiceForm(galleryDefault: boolean): ServiceForm {
  return {
    nameEn: '',
    nameHi: '',
    categoryId: '',
    subcategoryId: '',
    description: '',
    priceType: 'from',
    priceFrom: '',
    priceTo: '',
    unit: '',
    included: '',
    excluded: '',
    serviceArea: '',
    media: [],
    galleryVisible: galleryDefault,
    featuredSelected: false,
    status: 'active',
  };
}

export function toServiceForm(service: ServiceOwner): ServiceForm {
  return {
    nameEn: service.nameEn,
    nameHi: service.nameHi ?? '',
    categoryId: service.categoryId,
    subcategoryId: service.subcategoryId,
    description: service.description ?? '',
    priceType: service.priceType,
    priceFrom: rupeeText(service.priceFromPaise),
    priceTo: rupeeText(service.priceToPaise),
    unit: service.unit ?? '',
    included: service.included.join('\n'),
    excluded: service.excluded.join('\n'),
    serviceArea: service.serviceArea ?? '',
    media: service.media.map(({ assetId, showInGallery }) => ({
      assetId,
      showInGallery,
    })),
    galleryVisible: service.galleryVisible,
    featuredSelected: service.featuredSelected,
    status: service.status,
  };
}

/** One line per item; blank lines are ignored. */
const lines = (text: string) =>
  text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);

const LINE = /^[^\t<>]{1,120}$/u;
const NO_ANGLE = /[<>]/u;

type Wire = Omit<
  ServiceOwnerCreate,
  'media' | 'priceFromPaise' | 'priceToPaise'
> & {
  media: OwnerMediaItem[];
  priceFromPaise: number | null;
  priceToPaise: number | null;
};

/**
 * Client pre-check mirroring the shared schema (server stays authoritative).
 * Returns localized-key issues or the normalized wire values.
 */
export function readServiceForm(
  form: ServiceForm,
): { ok: true; wire: Wire } | { ok: false; issues: ServiceIssues } {
  const issues: ServiceIssues = {};
  const nameEn = form.nameEn.trim();
  const nameHi = form.nameHi.trim();
  if (!ServiceTitleSchema.safeParse(nameEn).success) issues.nameEn = 'title';
  if (nameHi && !ServiceTitleSchema.safeParse(nameHi).success)
    issues.nameHi = 'title';
  if (!form.categoryId) issues.categoryId = 'category';
  else if (!form.subcategoryId) issues.subcategoryId = 'subcategory';
  const description = form.description.trim();
  if (NO_ANGLE.test(description)) issues.description = 'plainText';
  const enquiry = form.priceType === 'enquiry';
  const range = form.priceType === 'range';
  const from = enquiry ? null : parseRupees(form.priceFrom.trim());
  const to = range ? parseRupees(form.priceTo.trim()) : null;
  if (!enquiry && from === null) issues.priceFromPaise = 'amount';
  if (range && to === null) issues.priceToPaise = 'amount';
  if (!issues.priceFromPaise && !issues.priceToPaise) {
    const violation = servicePriceViolation({
      priceType: form.priceType,
      priceFromPaise: from,
      priceToPaise: to,
    });
    if (violation) issues[violation] = range ? 'rangeOrder' : 'amount';
  }
  const included = lines(form.included);
  const excluded = lines(form.excluded);
  for (const [field, list] of [
    ['included', included],
    ['excluded', excluded],
  ] as const) {
    if (list.length > SERVICE_LIST_ITEMS_MAX) issues[field] = 'tooManyLines';
    else if (!list.every((line) => LINE.test(line))) issues[field] = 'line';
  }
  const serviceArea = form.serviceArea.trim();
  if (serviceArea && !LINE.test(serviceArea)) issues.serviceArea = 'line';
  if (Object.keys(issues).length) return { ok: false, issues };
  return {
    ok: true,
    wire: {
      nameEn,
      ...(nameHi && { nameHi }),
      categoryId: form.categoryId,
      subcategoryId: form.subcategoryId,
      ...(description && { description }),
      priceType: form.priceType,
      priceFromPaise: from,
      priceToPaise: to,
      ...(form.unit && !enquiry && { unit: form.unit }),
      included,
      excluded,
      ...(serviceArea && { serviceArea }),
      media: form.media,
      galleryVisible: form.galleryVisible,
      featuredSelected: form.featuredSelected,
      status: form.status,
    },
  };
}

/** Create body: absent optionals stay absent; Gallery choices are explicit
 * per image (the server never infers them from the default). */
export function createBody(wire: Wire): ServiceOwnerCreate {
  const { priceFromPaise, priceToPaise, media, ...rest } = wire;
  return {
    ...rest,
    ...(priceFromPaise !== null && { priceFromPaise }),
    ...(priceToPaise !== null && { priceToPaise }),
    ...(media.length && { media }),
  };
}

const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

/** Patch body: only changed fields, `null` clears; `undefined` = no change. */
export function patchBody(
  service: ServiceOwner,
  wire: Wire,
): ServiceOwnerPatch | null {
  const next: Record<string, unknown> = {
    nameEn: wire.nameEn,
    nameHi: wire.nameHi ?? null,
    categoryId: wire.categoryId,
    subcategoryId: wire.subcategoryId,
    description: wire.description ?? null,
    priceType: wire.priceType,
    priceFromPaise: wire.priceFromPaise,
    priceToPaise: wire.priceToPaise,
    unit: wire.unit ?? null,
    included: wire.included,
    excluded: wire.excluded,
    serviceArea: wire.serviceArea ?? null,
    media: wire.media,
    galleryVisible: wire.galleryVisible,
    featuredSelected: wire.featuredSelected,
    status: wire.status,
  };
  const current = service as unknown as Record<string, unknown>;
  const changes = Object.fromEntries(
    Object.entries(next).filter(([key, value]) => !same(current[key], value)),
  );
  if (!Object.keys(changes).length) return null;
  return { ...changes, expectedVersion: service.version } as ServiceOwnerPatch;
}

const FIELDS = new Set<string>([
  'nameEn',
  'nameHi',
  'categoryId',
  'subcategoryId',
  'description',
  'priceFromPaise',
  'priceToPaise',
  'unit',
  'included',
  'excluded',
  'serviceArea',
  'media',
  'featuredSelected',
]);

/** Map a server `details.field(s)` to a form field (first known one). */
export function serverField(fields: readonly string[]): ServiceField | null {
  const field = fields
    .map((name) => name.split('.')[0]!)
    .find((name) => FIELDS.has(name));
  return (field as ServiceField | undefined) ?? null;
}
