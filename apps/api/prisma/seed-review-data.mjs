import { fixtureId } from './seed-fixtures.mjs';
import { findSeedUser, seedReference } from './seed-context.mjs';

// Local/test-only: the sample pack's reviews (docs/design-context/
// 10-sample-data.json `reviews`) and nothing invented. There are no Orders yet,
// so `eligibility_ref_id` is a synthetic fixture proof id (no FK) and
// `eligibility_policy_version` stays NULL (RV-Q1/RV-Q2 unresolved).
// TODO(verify): tags are stored as the sample's labels until Reviews ships a
// stable tag-key catalogue; review_reports (sample `reports`) is not built.
const STATUSES = new Set(['published', 'reported']);
const ACCOUNT_STATUSES = new Set(['active', 'suspended']);

function skip(counts, reason) {
  counts.reviews_skipped += 1;
  counts.skipReasons[reason] = (counts.skipReasons[reason] ?? 0) + 1;
  return null;
}

// Sample reviewer -> user id. The customer persona is reused; other sample
// users get a minimal insert-only synthetic account like the persona seed.
async function reviewer(client, context, uid, counts) {
  const { crypto, normalizePhone } = context.helpers;
  const entry = (context.sample.users ?? []).find((user) => user.id === uid);
  if (!entry?.phone || !ACCOUNT_STATUSES.has(entry.status))
    return skip(counts, 'reviewer_not_in_sample_users');
  const phone = normalizePhone(entry.phone);
  const customer = context.personas.users[0];
  if (phone === customer.phone) return seedReference(context.users, 'customer');
  const user = { id: fixtureId('user', uid), phone };
  const hash = Buffer.from(crypto.phoneHash(phone));
  const { rows } = await client.query(
    `SELECT id, phone_lookup_hash FROM users
     WHERE id = $1::uuid OR phone_lookup_hash = $2 FOR UPDATE`,
    [user.id, hash],
  );
  if (rows.length > 1 || rows.some((row) => !row.phone_lookup_hash?.equals(hash)))
    return skip(counts, 'reviewer_identity_conflict');
  if (rows[0]) return rows[0].id;
  const at = new Date(entry.joined);
  await client.query(
    `INSERT INTO users (id, phone_ciphertext, phone_lookup_hash, display_name,
       account_status, created_at, updated_at)
     VALUES ($1::uuid, $2, $3, $4, $5, $6, $6)`,
    [
      user.id,
      crypto.encrypt(phone, `user:${user.id}:phone`),
      hash,
      entry.name,
      entry.status,
      at,
    ],
  );
  await client.query(
    `INSERT INTO user_roles (user_id, role, created_at)
     VALUES ($1::uuid, 'customer', $2) ON CONFLICT DO NOTHING`,
    [user.id, at],
  );
  counts.review_users += 1;
  return user.id;
}

async function riderTarget(client, context, tid) {
  const rider = context.personas.users.find(
    (user) => user.roles.includes('rider') && user.id === fixtureId('user', tid),
  );
  if (!rider) return null;
  const id = await findSeedUser(client, context.helpers.crypto, rider);
  return id ? { targetType: 'rider', targetId: id, businessId: null } : null;
}

async function ownedTarget(client, table, targetType, targetId) {
  // Table names are fixed tooling constants, never sample input.
  const { rows } = await client.query(
    `SELECT business_id FROM ${table} WHERE id = $1::uuid AND deleted_at IS NULL`,
    [targetId],
  );
  return rows[0] ? { targetType, targetId, businessId: rows[0].business_id } : null;
}

// Sample `type`: b = business; p = product; s = service, whose `tid` may be a
// provider profile (svc business id), which is a Businesses target, not a
// Services ID (specs/reviews/be/reviews.md target identity); r = rider.
async function target(client, context, review) {
  const business = (key) => {
    const id = context.businesses.get(key);
    return id ? { targetType: 'business', targetId: id, businessId: id } : null;
  };
  switch (review.type) {
    case 'b':
      return business(review.tid);
    case 'p': {
      const id = context.products.get(review.tid);
      return id ? ownedTarget(client, 'products', 'product', id) : null;
    }
    case 's': {
      const id = context.services.get(review.tid);
      return id ? ownedTarget(client, 'services', 'service', id) : business(review.tid);
    }
    case 'r':
      return riderTarget(client, context, review.tid);
    default:
      return null;
  }
}

async function seedReview(client, context, review, counts) {
  if (
    !STATUSES.has(review.status) ||
    !Number.isInteger(review.rating) ||
    typeof review.text !== 'string' ||
    !Number.isFinite(review.ts)
  )
    return skip(counts, 'invalid_sample_review');
  const resolved = await target(client, context, review);
  if (!resolved) return skip(counts, 'target_not_seeded');
  const authorId = await reviewer(client, context, review.uid, counts);
  if (!authorId) return null;
  const at = new Date(review.ts);
  const reply = review.reply?.trim() || null;
  const inserted = await client.query(
    `INSERT INTO reviews (id, target_type, target_id, business_id, author_user_id,
       eligibility_ref_type, eligibility_ref_id, eligibility_policy_version,
       rating, text, tags, status, helpful_count, owner_reply, owner_replied_at,
       created_at, updated_at)
     VALUES ($1::uuid, $2, $3::uuid, $4::uuid, $5::uuid, 'order', $6::uuid, NULL,
       $7, $8, $9::text[], $10, $11, $12, $13, $14, $14)
     ON CONFLICT DO NOTHING`,
    [
      fixtureId('review', review.id),
      resolved.targetType,
      resolved.targetId,
      resolved.businessId,
      authorId,
      fixtureId('review-proof', review.id),
      review.rating,
      review.text,
      review.tags ?? [],
      review.status,
      review.helpful ?? 0,
      reply,
      // TODO(verify): the sample has no reply time; use the review instant.
      reply ? at : null,
      at,
    ],
  );
  counts.reviews += inserted.rowCount;
  return inserted.rowCount;
}

/**
 * Insert-only, idempotent sample reviews. Returns added-row counts per table
 * plus counted skip reasons (sample reviewers/targets that are not seeded).
 */
export async function seedReviewData(client, context) {
  const counts = { reviews: 0, review_users: 0, reviews_skipped: 0, skipReasons: {} };
  for (const review of context.sample.reviews ?? [])
    await seedReview(client, context, review, counts);
  return {
    tables: { reviews: counts.reviews, 'users (review authors)': counts.review_users },
    skipped: counts.skipReasons,
  };
}
