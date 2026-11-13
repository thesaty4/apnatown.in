import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { withDatabase } from './database.mjs';
import { buildFixtures, FIXTURE_CLOCK } from './seed-fixtures.mjs';
import { buildListingFixtures } from './seed-listing-fixtures.mjs';
import { seedBusinessListings, seedListingTaxonomy } from './seed-listings.mjs';
import { buildPersonaFixtures, seedPersonas } from './seed-personas.mjs';
import { buildProviderFixtures, seedProviderData } from './seed-provider-data.mjs';
import { seedLocalSettings } from './seed-settings.mjs';
import { localTargets } from './targets.mjs';
import { buildSeedContext, findSeedUser } from './seed-context.mjs';
import { seedAccountData } from './seed-account-data.mjs';
import { seedCatalogData } from './seed-catalog-data.mjs';
import { seedCommerceData } from './seed-commerce-data.mjs';
import { seedEngagementData } from './seed-engagement-data.mjs';
import { seedNotificationData } from './seed-notification-data.mjs';
import { seedReviewData } from './seed-review-data.mjs';

const require = createRequire(import.meta.url);
const SAMPLE_DATA = new URL(
  '../../../docs/design-context/10-sample-data.json',
  import.meta.url,
);
const KEY = /^[a-f0-9]{64}$/;

// Reuse the compiled app code so phone hashing/encryption, slugs and video
// parsing stay identical to the API; `pnpm build` must have run first.
function loadHelpers(env) {
  if (
    !KEY.test(env.PII_ENCRYPTION_KEY ?? '') ||
    !KEY.test(env.PHONE_LOOKUP_HASH_KEY ?? '') ||
    !KEY.test(env.CURSOR_SIGNING_KEY ?? '')
  )
    throw new Error('SEED_KEYS_REQUIRED');
  let modules;
  try {
    modules = {
      crypto: require('../dist/shared/auth/crypto.js'),
      videos: require('../dist/modules/media-videos/domain/video-source.js'),
      personas: require('../dist/modules/auth/domain/demo-personas.js'),
      adminProjection: require('../dist/modules/admin/application/admin-projection.js'),
      admin: require('@apnatown/shared/admin'),
      catalog: require('@apnatown/shared/catalog'),
      users: require('@apnatown/shared/users'),
      wire: require('@apnatown/shared/wire'),
      search: require('@apnatown/shared/search'),
      notification: require('../dist/modules/notifications/application/notification-policy.js'),
      listingReports: require('../dist/modules/admin/domain/listing-report.js'),
    };
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND')
      throw new Error('API_BUILD_REQUIRED', { cause: error });
    throw error;
  }
  const subjectKey = modules.listingReports.listingReportSubjectKey(
    env.CURSOR_SIGNING_KEY,
  );
  return {
    crypto: new modules.crypto.NodeIdentityCrypto(
      env.PII_ENCRYPTION_KEY,
      env.PHONE_LOOKUP_HASH_KEY,
    ),
    slug: modules.catalog.catalogSlug,
    slugSchema: modules.catalog.CatalogSlugSchema,
    normalizeCatalogText: modules.catalog.normalizeCatalogText,
    paiseSchema: modules.wire.PaiseSchema,
    servicePriceTypeSchema: modules.search.ExploreCardSchema.shape.priceType,
    normalizePhone: modules.users.normalizePhone,
    parseVideoSource: modules.videos.parseVideoSource,
    demoPersonas: modules.personas.DEMO_PERSONAS,
    adminEmailContext: modules.adminProjection.adminEmailContext,
    permissionInputSchema: modules.admin.PermissionInputSchema,
    communicationScopeSchema: modules.admin.CommunicationScopeSchema,
    notificationPolicy: modules.notification.TEMPLATE_POLICY,
    notificationContentVersion: modules.notification.TEMPLATE_CONTENT_VERSION,
    // Same keyed subject hash as ListingReportIntakeService (live dedupe).
    listingReportSubjectHash: (userId) =>
      modules.listingReports.listingReportSubjectHash(subjectKey, `user:${userId}`),
  };
}

async function seedCity(client, city) {
  await client.query(
    `INSERT INTO cities (id, slug, name_en, name_hi, state_code, status)
     VALUES ($1::uuid, $2, $3, $4, $5, 'enabled') ON CONFLICT DO NOTHING`,
    [city.id, city.slug, city.nameEn, city.nameHi, city.stateCode],
  );
  const { rows } = await client.query('SELECT id FROM cities WHERE slug = $1', [
    city.slug,
  ]);
  if (!rows.length) throw new Error('SEED_DATA_INVALID');
  return rows[0].id;
}

async function seedAreas(client, cityId, areas) {
  const ids = new Map();
  for (const area of areas) {
    await client.query(
      `INSERT INTO areas (id, city_id, slug, name_en, name_hi, centroid)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5,
         ST_SetSRID(ST_MakePoint($6::float8, $7::float8), 4326)::geography)
       ON CONFLICT DO NOTHING`,
      [area.id, cityId, area.slug, area.en, area.hi, area.lng, area.lat],
    );
    const { rows } = await client.query(
      'SELECT id FROM areas WHERE city_id = $1::uuid AND slug = $2',
      [cityId, area.slug],
    );
    if (rows.length) ids.set(area.key, rows[0].id);
  }
  return ids;
}

// Reuses an account that already signed in with the fixture phone.
async function seedOwner(client, crypto, owner) {
  const hash = Buffer.from(crypto.phoneHash(owner.phone));
  let id = await findSeedUser(client, crypto, owner);
  if (!id) {
    await client.query(
      `INSERT INTO users (id, phone_ciphertext, phone_lookup_hash, created_at, updated_at)
       VALUES ($1::uuid, $2, $3, $4, $4)`,
      [
        owner.id,
        crypto.encrypt(owner.phone, `user:${owner.id}:phone`),
        hash,
        FIXTURE_CLOCK,
      ],
    );
    id = owner.id;
  }
  await client.query(
    `INSERT INTO user_roles (user_id, role, created_at)
     VALUES ($1::uuid, 'customer', $3::timestamptz),
       ($1::uuid, $2::text, $3::timestamptz)
     ON CONFLICT DO NOTHING`,
    [id, owner.role, FIXTURE_CLOCK],
  );
  return id;
}

async function insertBusiness(client, business, ownerId, cityId, areaId) {
  const { rowCount } = await client.query(
    `INSERT INTO businesses (id, owner_user_id, kind, status, name_en, name_hi,
       slug, description, city_id, area_id, address_text, location, phone_e164,
       whatsapp_e164, email, verified_at, submitted_at, reviewed_at,
       created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9::uuid, $10::uuid,
       $11, ST_SetSRID(ST_MakePoint($12::float8, $13::float8), 4326)::geography,
       $14, $15, $16, $17, $18, $18, $18, $18)
     ON CONFLICT DO NOTHING`,
    [
      business.id,
      ownerId,
      business.kind,
      business.status,
      business.nameEn,
      business.nameHi,
      business.slug,
      business.description,
      cityId,
      areaId,
      business.address,
      business.lng,
      business.lat,
      business.phone,
      business.whatsapp,
      business.email,
      business.verified ? FIXTURE_CLOCK : null,
      FIXTURE_CLOCK,
    ],
  );
  return rowCount === 1;
}

async function seedBusinessDetails(client, business) {
  await client.query(
    `INSERT INTO business_settings (business_id, temporarily_closed, created_at, updated_at)
     VALUES ($1::uuid, $2, $3, $3)`,
    [business.id, business.temporarilyClosed, FIXTURE_CLOCK],
  );
  // Category IDs follow the catalog reference seed's md5 key convention.
  await client.query(
    `INSERT INTO business_categories (business_id, category_id, is_primary, created_at)
     SELECT $1::uuid, c.id, TRUE, $4::timestamptz FROM categories c
     WHERE c.id = md5('apnatown:catalog:category:' || $2::text)::uuid
       AND c.kind = $3::text`,
    [business.id, business.categoryKey, business.categoryKind, FIXTURE_CLOCK],
  );
  if (!business.hours.length) return;
  await client.query(
    `INSERT INTO business_hours (business_id, day_of_week, opens_at, closes_at, is_closed)
     SELECT $1::uuid, h.day, h.opens::time, h.closes::time, h.closed
     FROM unnest($2::smallint[], $3::text[], $4::text[], $5::boolean[])
       AS h(day, opens, closes, closed)`,
    [
      business.id,
      business.hours.map((slot) => slot.day),
      business.hours.map((slot) => slot.opens),
      business.hours.map((slot) => slot.closes),
      business.hours.map((slot) => slot.closed),
    ],
  );
}

// Engagement fixtures add relationship-backed counts later in this transaction.
async function seedVideo(client, video) {
  const { rowCount } = await client.query(
    `INSERT INTO videos (id, business_id, source, provider_kind,
       provider_video_id, caption, hashtags, show_in_gallery, show_in_reels,
       status, decision_reason, approved_at, sort_order, view_count,
       created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7::text[], $8, $9, $10, $11,
       $12, $13, $14, $15, $15)
     ON CONFLICT DO NOTHING`,
    [
      video.id,
      video.businessId,
      video.source.provider,
      video.source.kind,
      video.source.providerId,
      video.caption,
      video.hashtags,
      video.gallery,
      video.reels,
      video.status,
      video.reason,
      video.approvedAt,
      video.sortOrder,
      video.views,
      video.createdAt,
    ],
  );
  return rowCount;
}

async function seedBusiness(client, business, ownerId, cityId, areaId) {
  if (
    !areaId ||
    !(await insertBusiness(client, business, ownerId, cityId, areaId))
  )
    return null;
  await seedBusinessDetails(client, business);
  let videos = 0;
  for (const video of business.videos) videos += await seedVideo(client, video);
  return videos;
}

async function apply(client, fixtures, listings, personas, providers, helpers, sample) {
  const { crypto } = helpers;
  const counts = {
    businesses: 0,
    videos: 0,
    existing: 0,
    conflicts: 0,
    productSubcategories: 0,
    products: 0,
    inventory: 0,
    services: 0,
    listingsSkipped: 0,
    personas: 0,
    adminAccounts: 0,
    personaConflicts: 0,
    riders: 0,
    expertise: 0,
    enquiries: 0,
    settings: 0,
  };
  const taxonomyIds = await seedListingTaxonomy(
    client,
    listings.taxonomy,
    counts,
  );
  const cityId = await seedCity(client, fixtures.city);
  const areaIds = await seedAreas(client, cityId, fixtures.areas);
  const owners = new Map(fixtures.owners.map((owner) => [owner.key, owner]));
  for (const business of fixtures.businesses) {
    const owner = owners.get(business.ownerKey);
    const ownerId = await seedOwner(client, crypto, owner);
    const areaId = areaIds.get(business.areaKey);
    const videos = await seedBusiness(
      client,
      business,
      ownerId,
      cityId,
      areaId,
    );
    if (videos !== null) {
      counts.businesses += 1;
      counts.videos += videos;
    } else {
      const { rowCount } = await client.query(
        'SELECT 1 FROM businesses WHERE id = $1::uuid',
        [business.id],
      );
      counts[rowCount ? 'existing' : 'conflicts'] += 1;
    }
    await seedBusinessListings(
      client,
      business,
      ownerId,
      Buffer.from(crypto.phoneHash(owner.phone)),
      listings.byBusiness.get(business.key),
      taxonomyIds,
      counts,
    );
  }
  await seedPersonas(client, helpers, personas, { cityId, areaIds }, counts);
  await seedProviderData(client, helpers, providers, FIXTURE_CLOCK, counts);
  await seedLocalSettings(client, FIXTURE_CLOCK, counts);
  const context = await buildSeedContext(client, {
    sample, helpers, fixtures, listings, personas, cityId, areaIds,
  });
  counts.extended = {
    ...await seedAccountData(client, context),
    ...await seedCatalogData(client, context),
    ...await seedCommerceData(client, context),
    ...await seedEngagementData(client, context),
    ...await seedNotificationData(client, context),
  };
  const reviews = await seedReviewData(client, context);
  Object.assign(counts.extended, reviews.tables);
  counts.reviewSkips = reviews.skipped;
  return counts;
}

async function inTransaction(client, work) {
  await client.query('BEGIN');
  try {
    // Serialises concurrent seed runs against the same local database.
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('apnatown:db-seed'))",
    );
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  }
}

/**
 * Local/test-only synthetic demo data from the design-context sample file,
 * Explicit provisioning through the validated migration target: runtime has
 * SELECT-only listing grants, which must not be widened for this command.
 * Stable insert-only rows; existing businesses/videos remain untouched while
 * matching fixture businesses can receive missing listings. Counts-only output.
 */
export async function seed(env) {
  const targets = localTargets(env);
  const helpers = loadHelpers(env);
  const sample = JSON.parse(await readFile(SAMPLE_DATA, 'utf8'));
  const fixtures = buildFixtures(sample, helpers);
  const listings = buildListingFixtures(sample, helpers);
  const personas = buildPersonaFixtures(sample, helpers, fixtures);
  const providers = buildProviderFixtures(sample, helpers);
  const counts = await withDatabase(targets.migration, (client) =>
    inTransaction(client, (tx) =>
      apply(tx, fixtures, listings, personas, providers, helpers, sample),
    ),
  );
  process.stdout.write(
    `Demo seed: ${counts.businesses} businesses and ${counts.videos} videos added; ` +
      `${counts.existing} businesses already present; ${counts.conflicts} business conflicts; ` +
      `${counts.productSubcategories} product subcategories, ${counts.products} products, ` +
      `${counts.inventory} inventory rows and ${counts.services} services added; ` +
      `${counts.listingsSkipped} listings skipped (existing, conflicting or missing settings); ` +
      `${counts.personas} demo persona users and ${counts.adminAccounts} admin accounts added; ` +
      `${counts.personaConflicts} persona role conflicts; ` +
      `${counts.riders} demo rider profiles added; ` +
      `${counts.expertise} provider expertise rows and ${counts.enquiries} enquiries added; ` +
      `${counts.settings} local settings added\n`,
  );
  for (const [table, inserted] of Object.entries(counts.extended))
    process.stdout.write(`Demo seed: ${table}: ${inserted} rows added\n`);
  for (const [reason, skipped] of Object.entries(counts.reviewSkips))
    process.stdout.write(`Demo seed: sample reviews skipped (${reason}): ${skipped}\n`);
}
