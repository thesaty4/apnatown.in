import { fixtureId } from './seed-fixtures.mjs';

// Sample enquiries carry no service id; map each to the provider's matching
// service by its message (inverter, fan, wiring, geyser, wedding decor).
const ENQUIRY_SERVICE = Object.freeze({
  e1: 's5-sv1',
  e2: 's5-sv2',
  e3: 's5-sv0',
  e4: 's5-sv2',
  e5: 's1-sv0',
});
const ENQUIRY_STATUSES = new Set(['new', 'contacted', 'converted', 'closed']);

function invalid() {
  throw new Error('SEED_DATA_INVALID');
}

function expertiseFor(entry, sample, helpers) {
  const known = (sample.serviceSubcategories[entry.cat] ?? []).map(([name]) =>
    helpers.slug(name),
  );
  const slugs = entry.ssubs ?? [];
  if (!Array.isArray(slugs) || slugs.some((slug) => !known.includes(slug)))
    invalid();
  return {
    businessId: fixtureId('business', entry.id),
    categoryKey: entry.cat,
    slugs: [...new Set(slugs)],
  };
}

function enquiryFor(entry, sample, helpers) {
  const serviceKey = ENQUIRY_SERVICE[entry.id];
  const owner = sample.svc.find((business) => business.id === entry.sid);
  if (
    !serviceKey ||
    !owner?.services.some((service) => service.id === serviceKey) ||
    !ENQUIRY_STATUSES.has(entry.status) ||
    !Number.isSafeInteger(entry.ts)
  )
    invalid();
  const createdAt = new Date(entry.ts);
  const id = fixtureId('enquiry', entry.id, createdAt);
  return {
    id,
    serviceId: fixtureId('service', serviceKey),
    businessId: fixtureId('business', entry.sid),
    name: entry.name,
    phone: helpers.normalizePhone(entry.phone),
    message: entry.msg,
    status: entry.status,
    createdAt,
  };
}

/** Provider expertise (`svc[].ssubs`) and the sample service enquiries. */
export function buildProviderFixtures(sample, helpers) {
  return {
    expertise: sample.svc.map((entry) => expertiseFor(entry, sample, helpers)),
    enquiries: sample.enq.map((entry) => enquiryFor(entry, sample, helpers)),
  };
}

// Insert-only: a provider whose expertise set already exists (seeded or
// owner-saved) is left untouched.
async function seedExpertise(client, entry, at, counts) {
  const { rowCount } = await client.query(
    `INSERT INTO provider_expertise_versions (business_id, version, updated_at)
     SELECT id, 1, $2 FROM businesses
     WHERE id = $1::uuid AND kind = 'provider' AND deleted_at IS NULL
     ON CONFLICT DO NOTHING`,
    [entry.businessId, at],
  );
  if (!rowCount) return;
  const inserted = await client.query(
    `INSERT INTO provider_expertise (business_id, subcategory_id, created_at)
     SELECT $1::uuid, s.id, $4 FROM subcategories s
     WHERE s.id = ANY(ARRAY(SELECT md5('apnatown:catalog:subcategory:' || $2::text
       || ':' || slug)::uuid FROM unnest($3::text[]) AS slug))
     ON CONFLICT DO NOTHING`,
    [entry.businessId, entry.categoryKey, entry.slugs, at],
  );
  counts.expertise += inserted.rowCount;
}

async function seedEnquiry(client, crypto, entry, counts) {
  const { rowCount } = await client.query(
    `INSERT INTO enquiries (id, service_id, business_id, name, phone_ciphertext,
       message, status, converted_at, created_at, updated_at)
     SELECT $1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7,
       CASE WHEN $7 = 'converted' THEN $8::timestamptz END, $8, $8
     WHERE EXISTS (SELECT 1 FROM services
       WHERE id = $2::uuid AND business_id = $3::uuid)
     ON CONFLICT DO NOTHING`,
    [
      entry.id,
      entry.serviceId,
      entry.businessId,
      entry.name,
      crypto.encrypt(entry.phone, `enquiry:${entry.id}:phone`),
      entry.message,
      entry.status,
      entry.createdAt,
    ],
  );
  counts.enquiries += rowCount;
}

export async function seedProviderData(client, helpers, fixtures, at, counts) {
  for (const entry of fixtures.expertise)
    await seedExpertise(client, entry, at, counts);
  for (const entry of fixtures.enquiries)
    await seedEnquiry(client, helpers.crypto, entry, counts);
}
