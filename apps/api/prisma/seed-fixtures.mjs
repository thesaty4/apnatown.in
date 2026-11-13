import { createHash } from 'node:crypto';

// Fixed fixture clock (data-model persistence rule 5): seeded identity,
// listing and review instants are stable across runs.
export const FIXTURE_CLOCK = new Date('2026-11-01T00:00:00.000Z');

// Padrauna areas copied verbatim from the prototype AREAS constant
// (docs/design-context/reference/prototype-source/js1.js); the sample JSON
// carries only the area keys.
export const AREAS = Object.freeze([
  {
    key: 'chauraha',
    en: 'Padrauna Chauraha',
    hi: 'पडरौना चौराहा',
    lat: 26.904,
    lng: 83.981,
  },
  {
    key: 'busstand',
    en: 'Bus Stand',
    hi: 'बस स्टैंड',
    lat: 26.9075,
    lng: 83.9755,
  },
  {
    key: 'station',
    en: 'Station Road',
    hi: 'स्टेशन रोड',
    lat: 26.901,
    lng: 83.9885,
  },
  { key: 'hata', en: 'Hata Road', hi: 'हाटा रोड', lat: 26.909, lng: 83.987 },
  {
    key: 'ramkola',
    en: 'Ramkola Road',
    hi: 'रामकोला रोड',
    lat: 26.897,
    lng: 83.9755,
  },
  {
    key: 'tehsil',
    en: 'Tehsil Road',
    hi: 'तहसील रोड',
    lat: 26.9115,
    lng: 83.979,
  },
  {
    key: 'collect',
    en: 'Collectorate Chauraha',
    hi: 'कलेक्ट्रेट चौराहा',
    lat: 26.914,
    lng: 83.984,
  },
]);

// Uttar Pradesh GST state code; the sample city has no state field.
const PADRAUNA = { key: 'padrauna', stateCode: '09' };
const GROUPS = [
  ['biz', 'shop', 'product'],
  ['svc', 'provider', 'service'],
];
const ROLE_FOR_KIND = { shop: 'vendor', provider: 'provider' };
const PROVIDER_FOR_TYPE = { yt: 'youtube', ig: 'instagram' };
const BUSINESS_STATUSES = new Set([
  'pending',
  'approved',
  'rejected',
  'changes_requested',
  'suspended',
  'inactive',
]);
const VIDEO_STATUSES = new Set(['pending', 'approved', 'rejected', 'removed']);
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function invalid() {
  throw new Error('SEED_DATA_INVALID');
}

/** Deterministic RFC 9562 UUIDv7: fixture instant + hashed stable alias. */
export function fixtureId(type, key, at = FIXTURE_CLOCK) {
  const bytes = createHash('sha256')
    .update(`apnatown:seed:${type}:${key}`)
    .digest()
    .subarray(0, 16);
  bytes.writeUIntBE(at.getTime(), 0, 6);
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

function hoursFor(hours) {
  if (hours === undefined) return [];
  if (!Array.isArray(hours) || hours.length !== 7) invalid();
  // Sample index follows JS getDay() (0 = Sunday), the same as PostgreSQL DOW.
  return hours.map((slot, day) => {
    if (slot === null) return { day, opens: null, closes: null, closed: true };
    const [opens, closes] = Array.isArray(slot) ? slot : [];
    if (!TIME.test(opens ?? '') || !TIME.test(closes ?? '') || opens === closes)
      invalid();
    return { day, opens, closes, closed: false };
  });
}

function videoFor(media, index, businessId, helpers) {
  let source;
  try {
    source = helpers.parseVideoSource(media.url);
  } catch {
    invalid();
  }
  const at = new Date(media.ts);
  if (
    source.provider !== PROVIDER_FOR_TYPE[media.t] ||
    !VIDEO_STATUSES.has(media.status) ||
    Number.isNaN(at.getTime())
  )
    invalid();
  return {
    key: media.id,
    id: fixtureId('video', media.id, at),
    businessId,
    source,
    caption: media.cap ?? '',
    hashtags: media.hashtags ?? [],
    gallery: media.gal === true,
    reels: media.reels === true,
    status: media.status,
    reason: media.reason ?? null,
    approvedAt: media.status === 'approved' ? at : null,
    sortOrder: index,
    views: media.views ?? 0,
    createdAt: at,
  };
}

function businessFor(entry, kind, categoryKind, helpers) {
  if (!BUSINESS_STATUSES.has(entry.status) || !entry.name?.en) invalid();
  const id = fixtureId('business', entry.id);
  return {
    key: entry.id,
    id,
    kind,
    categoryKind,
    status: entry.status,
    ownerKey: entry.id,
    slug: helpers.slug(entry.name.en),
    nameEn: entry.name.en,
    nameHi: entry.name.hi ?? null,
    description: entry.desc ?? null,
    address: entry.addr,
    areaKey: entry.area,
    lat: entry.lat,
    lng: entry.lng,
    phone: helpers.normalizePhone(entry.phone),
    whatsapp: entry.wa ? helpers.normalizePhone(entry.wa) : null,
    email: entry.email || null,
    verified: entry.verified === true,
    temporarilyClosed: entry.closedNow === true,
    categoryKey: entry.cat,
    hours: hoursFor(entry.hours),
    videos: (entry.media ?? []).map((media, index) =>
      videoFor(media, index, id, helpers),
    ),
  };
}

function assertUnique(values) {
  if (new Set(values).size !== values.length) invalid();
}

/**
 * Map the design-context sample data to seed rows. Only the shapes needed for
 * public listings and the Reels/Gallery feed are produced; social handles,
 * other customers, orders and engagement are intentionally not seeded (demo
 * personas live in seed-personas.mjs).
 */
export function buildFixtures(sample, helpers) {
  const city = sample.cities?.find((item) => item.id === PADRAUNA.key);
  if (!city) invalid();
  const areaKeys = new Set(AREAS.map((area) => area.key));
  const businesses = GROUPS.flatMap(([group, kind, categoryKind]) =>
    (sample[group] ?? []).map((entry) =>
      businessFor(entry, kind, categoryKind, helpers),
    ),
  );
  if (businesses.some((business) => !areaKeys.has(business.areaKey))) invalid();
  assertUnique(businesses.map((business) => business.slug));
  assertUnique(businesses.map((business) => business.phone));
  assertUnique(
    businesses.flatMap((business) => business.videos.map((video) => video.key)),
  );
  return {
    city: {
      id: fixtureId('city', PADRAUNA.key),
      slug: helpers.slug(city.en),
      nameEn: city.en,
      nameHi: city.hi,
      stateCode: PADRAUNA.stateCode,
    },
    areas: AREAS.map((area) => ({
      ...area,
      id: fixtureId('area', area.key),
      slug: helpers.slug(area.en),
    })),
    owners: businesses.map((business) => ({
      key: business.ownerKey,
      id: fixtureId('user', business.ownerKey),
      phone: business.phone,
      role: ROLE_FOR_KIND[business.kind],
    })),
    businesses,
  };
}
