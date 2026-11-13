import { FIXTURE_CLOCK, fixtureId } from './seed-fixtures.mjs';
import { seedReference } from './seed-context.mjs';
import {
  DAY_MS, DEMO_VALID_TO, assertReference, assertSeed, checked,
} from './seed-commerce-support.mjs';

function offerPeriod(offer) {
  assertSeed(Number.isSafeInteger(offer.from) && Number.isSafeInteger(offer.to));
  assertSeed(offer.from < offer.to);
  if (offer.status !== 'ended')
    return { from: FIXTURE_CLOCK, to: DEMO_VALID_TO };
  // Preserve the historical example's duration, ending one day before the
  // fixture clock. Never shift an ended offer into the live demo window.
  const to = new Date(FIXTURE_CLOCK.getTime() - DAY_MS);
  return { from: new Date(to.getTime() - (offer.to - offer.from)), to };
}

function discount(offer, helpers) {
  const type = offer.type === 'freedel' ? 'free_delivery' : offer.type;
  assertSeed(['percent', 'flat', 'free_delivery'].includes(type));
  assertSeed(Number.isSafeInteger(offer.value) && offer.value >= 0);
  if (type === 'percent') assertSeed(offer.value >= 1 && offer.value <= 100);
  if (type === 'free_delivery') assertSeed(offer.value === 0);
  return {
    type,
    percent: type === 'percent' ? offer.value : null,
    paise: type === 'flat'
      ? checked(helpers.paiseSchema, Number(BigInt(offer.value) * 100n))
      : null,
  };
}

function targetsFor(offer, context) {
  const listings = seedReference(context.listings.byBusiness, offer.bid);
  assertSeed(Array.isArray(offer.pids) && Array.isArray(offer.sids));
  const targets = [
    ...offer.pids.map((key) => ({
      key, kind: 'product', id: seedReference(context.products, key),
    })),
    ...offer.sids.map((key) => ({
      key, kind: 'service', id: seedReference(context.services, key),
    })),
  ];
  assertSeed(new Set(targets.map((row) => `${row.kind}:${row.key}`)).size === targets.length);
  for (const target of targets) {
    const owned = target.kind === 'product' ? listings.products : listings.services;
    assertReference(owned.some((row) => row.id === target.id));
  }
  return targets;
}

async function reviewerId(client, context) {
  const id = seedReference(context.users, 'super_admin');
  const result = await client.query(
    `SELECT u.id FROM users u JOIN user_roles r ON r.user_id = u.id
     WHERE u.id = $1::uuid AND r.role = 'super_admin'
       AND u.account_status = 'active' AND u.deleted_at IS NULL`,
    [id],
  );
  assertReference(result.rowCount === 1);
  return id;
}

async function seedTargets(client, offerId, targets) {
  let count = 0;
  for (const target of targets) {
    const result = await client.query(
      `INSERT INTO offer_targets (id, offer_id, target_kind, product_id, service_id)
       VALUES ($1::uuid, $2::uuid, $3, $4::uuid, $5::uuid)
       ON CONFLICT DO NOTHING`,
      [
        fixtureId('offer-target', `${offerId}:${target.kind}:${target.key}`),
        offerId, target.kind,
        target.kind === 'product' ? target.id : null,
        target.kind === 'service' ? target.id : null,
      ],
    );
    // Only called for a newly inserted offer: conflict cannot be an innocent
    // rerun. Abort rather than leave a targetless/partially targeted offer.
    assertReference(result.rowCount === 1);
    count += result.rowCount;
  }
  return count;
}

async function seedOffer(client, context, offer, reviewer, counts) {
  const id = fixtureId('offer', offer.id);
  const businessId = seedReference(context.businesses, offer.bid);
  const existing = await client.query(
    'SELECT business_id FROM offers WHERE id = $1::uuid', [id],
  );
  assertReference(existing.rows.every((row) => row.business_id === businessId));
  if (existing.rowCount) return; // Never restore edited/removed targets.
  assertSeed(['pending', 'active', 'paused', 'ended'].includes(offer.status));
  assertSeed(typeof offer.title === 'string' && offer.title.trim().length > 0);
  assertSeed(offer.terms === undefined || typeof offer.terms === 'string');
  assertSeed(typeof offer.featured === 'boolean');
  const targets = targetsFor(offer, context);
  const value = discount(offer, context.helpers);
  const period = offerPeriod(offer);
  const approved = offer.status !== 'pending';
  const result = await client.query(
    `INSERT INTO offers
       (id, business_id, title_en, terms_en, discount_type, discount_percent,
        discount_paise, scope, valid_from, valid_to, status, review_decision,
        reviewed_by, reviewed_at, first_approved_at, featured, views_count,
        uses_count, version, created_at, updated_at)
     SELECT $1::uuid, b.id, $3, $4, $5, $6::smallint, $7::bigint,
       $8, $9::timestamptz, $10::timestamptz, $11, $12, $13::uuid,
       $14::timestamptz, $14::timestamptz, $15::boolean, 0, 0, 1,
       $9::timestamptz, $16::timestamptz
     FROM businesses_public_context b WHERE b.id = $2::uuid
     ON CONFLICT DO NOTHING`,
    [
      id, businessId, offer.title, offer.terms ?? null, value.type,
      value.percent, value.paise, targets.length ? 'targets' : 'business',
      period.from, period.to, offer.status, approved ? 'approved' : null,
      approved ? reviewer : null, approved ? period.from : null,
      offer.featured, offer.status === 'ended' ? period.to : FIXTURE_CLOCK,
    ],
  );
  if (!result.rowCount) return; // An operator may have hidden the business.
  counts.offers += result.rowCount;
  counts.offer_targets += await seedTargets(client, id, targets);
}

async function seedPlacement(client, context, business, reviewer, position) {
  const id = fixtureId('promotion-placement', `featured-business:${business.id}`);
  const businessId = seedReference(context.businesses, business.id);
  const existing = await client.query(
    'SELECT business_id, source FROM promotion_placements WHERE id = $1::uuid', [id],
  );
  assertReference(existing.rows.every((row) =>
    row.business_id === businessId && row.source === 'admin'));
  if (existing.rowCount) return 0;
  // Non-banner manual placement. The actual read projection targets business_id;
  // destination/asset/purchase/configuration references remain NULL. No
  // fabricated DestinationDTO, URL, creative or premium subscription.
  const result = await client.query(
    `INSERT INTO promotion_placements
       (id, kind, surface, source, business_id, scope_kind, city_id, position,
        status, starts_at, ends_at, created_by, updated_by, created_at, updated_at)
     SELECT $1::uuid, 'featured_business', 'featured_business', 'admin', b.id,
       'city', $3::uuid, $4::int, 'active', $5::timestamptz, $6::timestamptz,
       $7::uuid, $7::uuid, $5::timestamptz, $5::timestamptz
     FROM businesses_public_context b WHERE b.id = $2::uuid AND b.city_id = $3::uuid
     ON CONFLICT DO NOTHING`,
    [id, businessId, context.cityId, position, FIXTURE_CLOCK, DEMO_VALID_TO, reviewer],
  );
  return result.rowCount;
}

async function seedHomepageBanner(client, context, reviewer, banner, position) {
  const id = fixtureId('promotion-placement', `hero-banner:${banner.id}`);
  const existing = await client.query(
    'SELECT kind, surface, source FROM promotion_placements WHERE id = $1::uuid', [id],
  );
  assertReference(existing.rows.every((row) =>
    row.kind === 'homepage_banner' && row.surface === 'hero_banner' && row.source === 'admin'));
  if (existing.rowCount) return 0;
  assertSeed(banner.on === true);
  assertSeed(typeof banner.t === 'string' && banner.t.trim().length > 0);
  assertSeed(typeof banner.s === 'string' && banner.s.trim().length > 0);
  // Only internal, already-public targets: a business, Explore or an active
  // Catalog category. No invented URL, image or paid purchase reference.
  let destination;
  if (banner.link.startsWith('biz-')) {
    destination = {
      kind: 'business',
      targetId: seedReference(context.businesses, banner.link.slice(4)),
    };
  } else if (banner.link === 'explore') {
    destination = { kind: 'explore' };
  } else if (banner.link.startsWith('cat-')) {
    // Sample keys are Catalog ids, not slugs (`wedding` -> `wedding-events`);
    // resolve the same deterministic category identity Catalog seeds use.
    const key = banner.link.slice(4);
    const { rows } = await client.query(
      `SELECT id FROM categories
       WHERE id = md5('apnatown:catalog:category:' || $1::text)::uuid AND active
       LIMIT 1`,
      [key],
    );
    assertReference(rows.length === 1);
    destination = { kind: 'category', targetId: rows[0].id };
  } else {
    throw new Error('SEED_REFERENCE_CONFLICT');
  }
  const result = await client.query(
    `INSERT INTO promotion_placements
       (id, kind, surface, source, scope_kind, title_en, subtitle_en,
        destination, position, status, starts_at, ends_at,
        created_by, updated_by, created_at, updated_at)
     VALUES ($1::uuid, 'homepage_banner', 'hero_banner', 'admin', 'platform',
       $2, $3, $4::jsonb, $5::int, 'active', $6::timestamptz, $7::timestamptz,
       $8::uuid, $8::uuid, $6::timestamptz, $6::timestamptz)
     ON CONFLICT DO NOTHING`,
    [id, banner.t, banner.s, JSON.stringify(destination), position,
      FIXTURE_CLOCK, DEMO_VALID_TO, reviewer],
  );
  return result.rowCount;
}

export async function seedCommerceOffers(client, context, counts) {
  const reviewer = await reviewerId(client, context);
  for (const [position, banner] of (context.sample.banners ?? []).entries())
    counts.promotion_placements += await seedHomepageBanner(
      client, context, reviewer, banner, position,
    );
  for (const offer of context.sample.offers) {
    // of2 promises free delivery only above Rs 500. Offers has no minimum
    // field; seeding it business-wide would waive fees below that threshold.
    // Do not silently turn an unsupported rule into an unconditional offer.
    if (offer.id === 'of2') continue;
    await seedOffer(client, context, offer, reviewer, counts);
  }
  const featured = [...context.sample.biz, ...context.sample.svc]
    .filter((business) => business.featured === true);
  for (const [position, business] of featured.entries())
    counts.promotion_placements += await seedPlacement(
      client, context, business, reviewer, position,
    );
  // of7 remains an informational service offer, not a payable service/booking.
  // Sample views/uses are omitted: no invented orders, redemptions or sends.
  // Coupons and their usage tables are unimplemented and not in this slice.
}
