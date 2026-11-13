import { createRequire } from 'node:module';
import { FIXTURE_CLOCK, fixtureId } from './seed-fixtures.mjs';
import { seedReference } from './seed-context.mjs';

const require = createRequire(import.meta.url);
const users = require('@apnatown/shared/users');
const geo = require('@apnatown/shared/geo');
const { CreateSupportMessageSchema } = require('@apnatown/shared/settings');
const { ListingReportCreateSchema } = require('@apnatown/shared/admin');

function checked(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) throw new Error('SEED_DATA_INVALID');
  return result.data;
}

// Queries also find natural-key collisions, but never adopt those rows.
// Mutable fields are deliberately not compared: operator edits survive reruns.
async function preserved(client, sql, parameters) {
  const { rows } = await client.query(sql, parameters);
  if (rows.length > 1 || rows.some((row) => !row.matches))
    throw new Error('SEED_REFERENCE_CONFLICT');
  return rows.length === 1;
}

async function seedAddress(client, context, userId) {
  const id = fixtureId('address', 'customer-local-example');
  if (await preserved(client,
    `SELECT user_id = $2::uuid AND created_at = $3::timestamptz AS matches
     FROM addresses WHERE id = $1::uuid`, [id, userId, FIXTURE_CLOCK])) return 0;
  const area = context.fixtures.areas.find((entry) => entry.key === 'hata');
  if (!area) throw new Error('SEED_DATA_INVALID');
  const address = checked(users.CreateAddressSchema, {
    label: 'LOCAL sample address',
    addressText: 'Synthetic development address, Hata Road, Padrauna',
    landmark: 'LOCAL/TEST example only',
    // PIN appears in the sample order address; no area PIN backfill is made.
    pinCode: '274304',
    cityId: context.cityId,
    areaId: seedReference(context.areaIds, area.key),
    lat: area.lat,
    lng: area.lng,
    isDefault: false,
  });
  const aad = `user:${userId}:address:${id}`;
  const { crypto } = context.helpers;
  const result = await client.query(
    `INSERT INTO addresses (id, user_id, label, address_text, landmark,
       pin_code, city_id, area_id, location, is_default, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7::uuid, $8::uuid,
       ST_SetSRID(ST_MakePoint($9::float8, $10::float8), 4326)::geography,
       FALSE, $11, $11)`,
    [id, userId, address.label,
      crypto.encrypt(address.addressText, `${aad}:addressText`),
      crypto.encrypt(address.landmark, `${aad}:landmark`),
      address.pinCode, address.cityId, address.areaId,
      address.lng, address.lat, FIXTURE_CLOCK],
  );
  return result.rowCount;
}

async function seedOptOuts(client, userId) {
  let count = 0;
  for (const { purpose, channel } of users.CONSENT_PAIRS) {
    const id = fixtureId('consent', `customer:${purpose}:${channel}:opt-out`);
    if (await preserved(client,
      `SELECT user_id = $2::uuid AND purpose = $3 AND channel = $4
         AND NOT granted AND source = 'account'
         AND recorded_at = $5::timestamptz AS matches
       FROM consents WHERE id = $1::uuid`,
      [id, userId, purpose, channel, FIXTURE_CLOCK])) continue;
    // Never append evidence over an existing operator/customer choice,
    // including an older choice. No notices, grants or outbound events.
    const result = await client.query(
      `INSERT INTO consents (id, user_id, purpose, channel, granted,
         notice_version, recorded_at, source)
       SELECT $1::uuid, $2::uuid, $3, $4, FALSE, NULL, $5, 'account'
       WHERE NOT EXISTS (SELECT 1 FROM consents
         WHERE user_id = $2::uuid AND purpose = $3 AND channel = $4)`,
      [id, userId, purpose, channel, FIXTURE_CLOCK],
    );
    count += result.rowCount;
  }
  return count;
}

function zoneInput(sample) {
  if (!Array.isArray(sample.poly) || sample.poly.length < 3)
    throw new Error('SEED_DATA_INVALID');
  // Prototype poly is Leaflet [lat,lng], unclosed; storage is GeoJSON.
  const ring = sample.poly.map(([lat, lng]) => [lng, lat]);
  if (ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1])
    ring.push([...ring[0]]);
  return checked(geo.CreateZoneSchema, {
    name: sample.name,
    polygon: { type: 'Polygon', coordinates: [ring] },
    feeSlabs: sample.slabs.map(({ upto, fee }) => {
      // This source contains integer rupees only; reject changed fractional
      // inputs instead of silently rounding a commercial value.
      if (!Number.isSafeInteger(fee) || fee < 0)
        throw new Error('SEED_DATA_INVALID');
      return { upperDistanceKm: upto, feePaise: fee * 100 };
    }),
    // The two sample rectangles overlap. Preserve their geometry but do not
    // activate either or invent a hole/boundary to imply serviceability.
    status: 'paused',
  });
}

async function seedZones(client, context, counts) {
  for (const sample of context.sample.zones) {
    if (sample.city !== 'padrauna') throw new Error('SEED_REFERENCE_CONFLICT');
    const id = fixtureId('zone', sample.id);
    const zone = zoneInput(sample);
    if (await preserved(client,
      `SELECT id = $1::uuid AND city_id = $2::uuid
         AND created_at = $4::timestamptz AS matches
       FROM zones WHERE id = $1::uuid OR (city_id = $2::uuid AND name = $3)`,
      [id, context.cityId, zone.name, FIXTURE_CLOCK])) continue;
    const result = await client.query(
      `INSERT INTO zones (id, city_id, name, polygon, status, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3,
         ST_SetSRID(ST_GeomFromGeoJSON($4::text), 4326), 'paused', $5, $5)`,
      [id, context.cityId, zone.name, JSON.stringify(zone.polygon), FIXTURE_CLOCK],
    );
    counts.zones += result.rowCount;
    // Slabs are an aggregate: never restore deleted/operator-edited children.
    for (const [index, slab] of zone.feeSlabs.entries()) {
      const inserted = await client.query(
        `INSERT INTO zone_fee_slabs (zone_id, sequence, upper_distance_km,
           fee_paise, created_at, updated_at)
         VALUES ($1::uuid, $2, $3, $4::bigint, $5, $5)`,
        [id, index + 1, slab.upperDistanceKm, slab.feePaise, FIXTURE_CLOCK],
      );
      counts.zone_fee_slabs += inserted.rowCount;
    }
  }
}

async function seedWaitlist(client, context) {
  const id = fixtureId('service-area-waitlist', 'customer-local-example');
  const customer = context.personas.users.find((entry) =>
    entry.roles.length === 1 && entry.roles[0] === 'customer');
  if (!customer) throw new Error('SEED_REFERENCE_CONFLICT');
  const { crypto, normalizePhone } = context.helpers;
  const input = checked(geo.WaitlistRequestSchema, {
    cityId: context.cityId, phone: normalizePhone(customer.phone),
  });
  const hash = Buffer.from(crypto.phoneHash(input.phone));
  if (await preserved(client,
    `SELECT id = $1::uuid AND city_id = $2::uuid AND phone_lookup_hash = $3
       AND requested_at = $4::timestamptz AS matches
     FROM service_area_waitlist WHERE id = $1::uuid
       OR (city_id = $2::uuid AND phone_lookup_hash = $3)`,
    [id, input.cityId, hash, FIXTURE_CLOCK])) return 0;
  const result = await client.query(
    `INSERT INTO service_area_waitlist
       (id, city_id, phone_ciphertext, phone_lookup_hash, requested_at)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5)`,
    [id, input.cityId, crypto.encrypt(input.phone, `geo:waitlist:${id}:phone`),
      hash, FIXTURE_CLOCK],
  );
  return result.rowCount;
}

async function seedSupport(client, userId) {
  const id = fixtureId('support-message', 'customer-local-example');
  if (await preserved(client,
    `SELECT user_id = $2::uuid AND source = 'web' AND source_key IS NULL
       AND created_at = $3::timestamptz AS matches
     FROM support_messages WHERE id = $1::uuid`,
    [id, userId, FIXTURE_CLOCK])) return 0;
  const input = checked(CreateSupportMessageSchema, {
    message: 'LOCAL/TEST synthetic support example: how can I change my saved address? No reply or external contact is requested.',
  });
  // Web intake is unscoped in SupportService; an address is not admin scope.
  const result = await client.query(
    `INSERT INTO support_messages (id, user_id, message, source, created_at)
     VALUES ($1::uuid, $2::uuid, $3, 'web', $4)`,
    [id, userId, input.message, FIXTURE_CLOCK],
  );
  return result.rowCount;
}

async function seedListingReports(client, context, userId) {
  // Parent helper must mirror ListingReportIntakeService exactly:
  // HMAC-SHA256(HMAC-SHA256(CURSOR_SIGNING_KEY string,
  //   'apnatown:listing-report-subject:v1'), `user:${userId}`).
  // A phone hash or unkeyed synthetic hash would break live deduplication.
  const hash = Buffer.from(context.helpers.listingReportSubjectHash(userId));
  if (hash.length !== 32) throw new Error('SEED_DATA_INVALID');
  let count = 0;
  for (const key of ['b1', 's1']) {
    const targetId = seedReference(context.businesses, key);
    const id = fixtureId('listing-report', `customer:${key}:local-example`);
    if (await preserved(client,
      `SELECT id = $1::uuid AND target_id = $2::uuid
         AND reporter_user_id = $3::uuid AND reporter_subject_hash = $4
         AND created_at = $5::timestamptz AS matches
       FROM listing_reports WHERE id = $1::uuid OR
         (target_id = $2::uuid AND reporter_subject_hash = $4 AND status = 'open')`,
      [id, targetId, userId, hash, FIXTURE_CLOCK])) continue;
    // Use the stricter discovery projection too: never create a demonstration
    // report against an inactive/deleted owner, hidden listing or disabled city.
    const { rows } = await client.query(
      `SELECT id, kind, city_id, area_id FROM businesses_public_context
       WHERE id = $1::uuid AND area_id IS NOT NULL`, [targetId],
    );
    if (rows.length !== 1) throw new Error('SEED_REFERENCE_CONFLICT');
    const target = rows[0];
    const input = checked(ListingReportCreateSchema, {
      targetId,
      targetType: target.kind === 'shop' ? 'business' : 'provider',
      reason: 'wrong',
      details: 'LOCAL/TEST synthetic report for moderation queue demonstration only; not a real allegation.',
    });
    const result = await client.query(
      `INSERT INTO listing_reports (id, target_type, target_id, reporter_user_id,
         reporter_subject_hash, reason, details, city_id, area_id, status,
         created_at, updated_at)
       VALUES ($1::uuid, $2, $3::uuid, $4::uuid, $5, $6, $7,
         $8::uuid, $9::uuid, 'open', $10, $10)`,
      [id, input.targetType, targetId, userId, hash, input.reason,
        input.details, target.city_id, target.area_id, FIXTURE_CLOCK],
    );
    count += result.rowCount;
  }
  return count;
}

async function seedAudit(client, counts) {
  if (!Object.values(counts).some((count) => count > 0)) return 0;
  const id = fixtureId('audit-log', 'account-data-local-seed');
  if (await preserved(client,
    `SELECT actor_role = 'system' AND actor_user_id IS NULL
       AND action = 'seed.account_data.created' AND entity_type = 'seed_batch'
       AND correlation_id = 'seed-account-data-local'
       AND occurred_at = $2::timestamptz AS matches
     FROM audit_logs WHERE id = $1::uuid`, [id, FIXTURE_CLOCK])) return 0;
  // Actual counts from this transaction, not sample.audit's pretend approvals,
  // sends or payments. Fixed fixture time is explicitly synthetic.
  const result = await client.query(
    `INSERT INTO audit_logs (id, occurred_at, actor_role, actor_label, action,
       entity_type, summary, before, after, correlation_id)
     VALUES ($1::uuid, $2, 'system', 'LOCAL/TEST synthetic seed',
       'seed.account_data.created', 'seed_batch', $3, NULL, $4::jsonb,
       'seed-account-data-local')`,
    [id, FIXTURE_CLOCK,
      'LOCAL/TEST account fixtures inserted; synthetic fixture timestamp, no real user actions or external sends.',
      JSON.stringify({ synthetic: true, insertedRows: counts })],
  );
  return result.rowCount;
}

/**
 * Caller owns LOCAL/TEST target checks, the transaction and seed serialization.
 * No runtime entry point, service calls, queues, provider assets or grants.
 * Legal pages remain absent: no reviewed bilingual copy is supplied or seeded
 * by the settings migration (Q-12). Existing legal publications are untouched.
 */
export async function seedAccountData(client, context) {
  const counts = { addresses: 0, consents: 0, zones: 0, zone_fee_slabs: 0,
    service_area_waitlist: 0, support_messages: 0, legal_pages: 0,
    listing_reports: 0, audit_logs: 0 };
  try {
    if (typeof context.helpers.listingReportSubjectHash !== 'function')
      throw new Error('SEED_HELPERS_REQUIRED');
    const userId = seedReference(context.users, 'customer');
    counts.addresses = await seedAddress(client, context, userId);
    counts.consents = await seedOptOuts(client, userId);
    await seedZones(client, context, counts);
    counts.service_area_waitlist = await seedWaitlist(client, context);
    counts.support_messages = await seedSupport(client, userId);
    counts.listing_reports = await seedListingReports(client, context, userId);
    counts.audit_logs = await seedAudit(client, counts);
    return counts;
  } catch (error) {
    if (error.code === '23505') throw new Error('SEED_REFERENCE_CONFLICT');
    throw error;
  }
}
