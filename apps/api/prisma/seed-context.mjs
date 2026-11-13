import { fixtureId } from './seed-fixtures.mjs';

export function seedReference(map, key) {
  const id = map.get(key);
  if (!id) throw new Error('SEED_REFERENCE_CONFLICT');
  return id;
}

// An earlier local login may own the phone under a different UUID. A fixture
// UUID collision must never grant roles or attach demo data to another user.
export async function findSeedUser(client, crypto, user) {
  const hash = Buffer.from(crypto.phoneHash(user.phone));
  const { rows } = await client.query(
    `SELECT id, phone_lookup_hash, account_status, deleted_at FROM users
     WHERE id = $1::uuid OR phone_lookup_hash = $2 FOR UPDATE`,
    [user.id, hash],
  );
  if (
    rows.length > 1 ||
    rows.some(
      (row) =>
        !row.phone_lookup_hash?.equals(hash) ||
        row.account_status !== 'active' ||
        row.deleted_at !== null,
    )
  )
    throw new Error('SEED_USER_IDENTITY_CONFLICT');
  return rows[0]?.id;
}

async function userReferences(client, input) {
  const users = new Map();
  for (const user of input.fixtures.owners) {
    const id = await findSeedUser(client, input.helpers.crypto, user);
    if (!id) throw new Error('SEED_REFERENCE_CONFLICT');
    users.set(user.key, id);
  }
  for (const [index, key] of ['customer', 'admin', 'super_admin'].entries()) {
    const id = await findSeedUser(
      client,
      input.helpers.crypto,
      input.personas.users[index],
    );
    if (!id) throw new Error('SEED_REFERENCE_CONFLICT');
    const roles = await client.query(
      `SELECT role FROM user_roles WHERE user_id = $1::uuid
       AND role = ANY($2::text[])`,
      [id, input.personas.users[index].roles],
    );
    if (roles.rowCount !== input.personas.users[index].roles.length)
      throw new Error('SEED_REFERENCE_CONFLICT');
    users.set(key, id);
  }
  return users;
}

async function businessReferences(client, input, users) {
  const businesses = new Map();
  for (const business of input.fixtures.businesses) {
    const { rowCount } = await client.query(
      `SELECT id FROM businesses
       WHERE id = $1::uuid AND owner_user_id = $2::uuid AND slug = $3
         AND kind = $4 AND city_id = $5::uuid AND area_id = $6::uuid
         AND deleted_at IS NULL FOR UPDATE`,
      [
        business.id,
        seedReference(users, business.ownerKey),
        business.slug,
        business.kind,
        input.cityId,
        seedReference(input.areaIds, business.areaKey),
      ],
    );
    if (!rowCount) throw new Error('SEED_BUSINESS_IDENTITY_CONFLICT');
    businesses.set(business.key, business.id);
  }
  return businesses;
}

async function listingReferences(client, input, businesses) {
  const products = new Map();
  const services = new Map();
  // Table names are fixed tooling constants, never sample/request input.
  for (const [table, map, kind] of [
    ['products', products, 'product'],
    ['services', services, 'service'],
  ]) {
    for (const [businessKey, listings] of input.listings.byBusiness) {
      for (const listing of listings[table]) {
        const { rowCount } = await client.query(
          `SELECT id FROM ${table}
           WHERE id = $1::uuid AND business_id = $2::uuid AND slug = $3
             AND deleted_at IS NULL FOR UPDATE`,
          [listing.id, seedReference(businesses, businessKey), listing.slug],
        );
        if (!rowCount) throw new Error('SEED_LISTING_IDENTITY_CONFLICT');
        const source =
          kind === 'product'
            ? input.sample.products
            : [...input.sample.biz, ...input.sample.svc].flatMap(
                (business) => business.services,
              );
        const entry = source.find(
          (item) => fixtureId(kind, item.id) === listing.id,
        );
        if (!entry) throw new Error('SEED_DATA_INVALID');
        map.set(entry.id, listing.id);
      }
    }
  }
  return { products, services };
}

async function videoReferences(client, input, businesses) {
  const videos = new Map();
  for (const business of input.fixtures.businesses) {
    for (const video of business.videos) {
      const { rowCount } = await client.query(
        `SELECT id FROM videos
         WHERE id = $1::uuid AND business_id = $2::uuid AND source = $3
           AND provider_kind = $4 AND provider_video_id = $5
           AND owner_deleted_at IS NULL FOR UPDATE`,
        [
          video.id,
          seedReference(businesses, business.key),
          video.source.provider,
          video.source.kind,
          video.source.providerId,
        ],
      );
      if (!rowCount) throw new Error('SEED_VIDEO_IDENTITY_CONFLICT');
      videos.set(video.key, video.id);
    }
  }
  return videos;
}

export async function buildSeedContext(client, input) {
  const users = await userReferences(client, input);
  const businesses = await businessReferences(client, input, users);
  const listings = await listingReferences(client, input, businesses);
  const videos = await videoReferences(client, input, businesses);
  return { ...input, users, businesses, ...listings, videos };
}
