import { createHash } from 'node:crypto';
import { FIXTURE_CLOCK, fixtureId } from './seed-fixtures.mjs';
import { seedReference } from './seed-context.mjs';

async function seedLike(client, userId, videoId, at, counts) {
  const counter = await client.query(
    `INSERT INTO video_engagement_counts (video_id, like_count, updated_at)
     SELECT $1::uuid, count(*), $2 FROM likes WHERE video_id = $1::uuid
     ON CONFLICT DO NOTHING`,
    [videoId, at],
  );
  counts.video_engagement_counts += counter.rowCount;
  await client.query(
    'SELECT video_id FROM video_engagement_counts WHERE video_id = $1::uuid FOR UPDATE',
    [videoId],
  );
  const inserted = await client.query(
    `INSERT INTO likes (user_id, video_id, created_at)
     VALUES ($1::uuid, $2::uuid, $3) ON CONFLICT DO NOTHING`,
    [userId, videoId, at],
  );
  counts.likes += inserted.rowCount;
  if (inserted.rowCount)
    await client.query(
      `UPDATE video_engagement_counts SET like_count = like_count + 1,
         version = version + 1, updated_at = GREATEST(updated_at, $2)
       WHERE video_id = $1::uuid`,
      [videoId, at],
    );
}

async function seedRelationships(client, context, business, video, at, counts) {
  const userId = seedReference(context.users, 'customer');
  const videoId = seedReference(context.videos, video.key);
  await seedLike(client, userId, videoId, at, counts);
  const heart = await client.query(
    `INSERT INTO hearts (user_id, target_type, target_id, media_kind, created_at)
     VALUES ($1::uuid, 'video', $2::uuid, $3, $4) ON CONFLICT DO NOTHING`,
    [
      userId,
      videoId,
      ['shorts', 'reel'].includes(video.source.kind) ? 'reel' : 'video',
      at,
    ],
  );
  counts.hearts += heart.rowCount;
  const follow = await client.query(
    `INSERT INTO follows (user_id, business_id, bell_on, created_at, last_followed_at)
     VALUES ($1::uuid, $2::uuid, false, $3, $3) ON CONFLICT DO NOTHING`,
    [userId, seedReference(context.businesses, business.key), at],
  );
  counts.follows += follow.rowCount;
}

async function seedComment(client, context, video, at, counts) {
  // A clean synthetic customer comment, not an invented moderation decision.
  const text = 'Is this available in Padrauna?';
  const id = fixtureId('video-comment', video.key);
  const inserted = await client.query(
    `INSERT INTO video_comments
       (id, video_id, author_user_id, text, status, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4, 'published', $5, $5)
     ON CONFLICT DO NOTHING`,
    [id, video.id, seedReference(context.users, 'customer'), text, at],
  );
  counts.video_comments += inserted.rowCount;
  if (inserted.rowCount)
    await client.query(
      `UPDATE videos SET comment_count =
         (SELECT count(*) FROM video_comments WHERE video_id = $1::uuid
           AND status = 'published')
       WHERE id = $1::uuid`,
      [video.id],
    );
}

async function seedLinks(client, context, business, video, counts) {
  const source = [...context.sample.biz, ...context.sample.svc]
    .find((entry) => entry.id === business.key)
    .media.find((entry) => entry.id === video.key);
  const own = context.listings.byBusiness.get(business.key);
  // Never append links to an owner-edited list. No video version is reset.
  const existing = await client.query(
    'SELECT 1 FROM video_links WHERE video_id = $1::uuid LIMIT 1',
    [video.id],
  );
  if (existing.rowCount) return;
  for (const [index, key] of source.tags.entries()) {
    const kind = context.products.has(key) ? 'product' : 'service';
    const id = context[kind === 'product' ? 'products' : 'services'].get(key);
    // Provider products with SERVICE taxonomy are excluded by the base seed.
    if (!id) {
      const product = context.sample.products.find((entry) => entry.id === key);
      if (
        product &&
        !context.sample.categories.some((entry) => entry.id === product.cat)
      )
        continue;
      throw new Error('SEED_REFERENCE_CONFLICT');
    }
    if (!own[kind === 'product' ? 'products' : 'services'].some((row) => row.id === id))
      throw new Error('SEED_REFERENCE_CONFLICT');
    const inserted = await client.query(
      `INSERT INTO video_links (video_id, target_type, target_id, sort_order)
       VALUES ($1::uuid, $2, $3::uuid, $4) ON CONFLICT DO NOTHING`,
      [video.id, kind, id, index],
    );
    counts.video_links += inserted.rowCount;
  }
}

async function seedReport(client, context, business, video, at, counts) {
  const inserted = await client.query(
    `INSERT INTO media_reports (id, target_kind, video_id, business_id,
       reporter_user_id, reporter_subject_hash, reason, details, created_at)
     VALUES ($1::uuid, 'video', $2::uuid, $3::uuid, $4::uuid, $5, 'other', $6, $7)
     ON CONFLICT DO NOTHING`,
    [
      fixtureId('media-report', video.key),
      video.id,
      business.id,
      seedReference(context.users, 'customer'),
      createHash('sha256').update('apnatown:seed:media-report:customer').digest(),
      'Synthetic demo report for the local moderation queue.',
      at,
    ],
  );
  counts.media_reports += inserted.rowCount;
}

export async function seedEngagementData(client, context) {
  const counts = Object.fromEntries(
    [
      'likes', 'hearts', 'follows', 'video_engagement_counts',
      'video_comments', 'video_links', 'media_reports', 'bookmarks',
      'media_manager_orders',
    ].map((table) => [table, 0]),
  );
  for (const business of context.fixtures.businesses) {
    const manager = await client.query(
      `INSERT INTO media_manager_orders (business_id, list_kind, updated_at)
       VALUES ($1::uuid, 'videos', $2), ($1::uuid, 'gallery', $2)
       ON CONFLICT DO NOTHING`,
      [seedReference(context.businesses, business.key), FIXTURE_CLOCK],
    );
    counts.media_manager_orders += manager.rowCount;
    for (const video of business.videos) {
      const publicVideo = await client.query(
        `SELECT id FROM media_public_videos
         WHERE id = $1::uuid AND (show_in_gallery OR show_in_reels)`,
        [seedReference(context.videos, video.key)],
      );
      if (!publicVideo.rowCount) continue;
      const at = new Date(Math.max(FIXTURE_CLOCK.getTime(), video.createdAt.getTime()));
      await seedLinks(client, context, business, video, counts);
      await seedRelationships(client, context, business, video, at, counts);
      await seedComment(client, context, video, at, counts);
      if (video.key === 'm4')
        await seedReport(client, context, business, video, at, counts);
    }
  }
  const serviceId = seedReference(context.services, 's5-sv1');
  const bookmark = await client.query(
    `INSERT INTO bookmarks (user_id, target_type, target_id, created_at)
     SELECT $1::uuid, 'service', id, $3 FROM services_public_discovery
     WHERE id = $2::uuid ON CONFLICT DO NOTHING`,
    [seedReference(context.users, 'customer'), serviceId, FIXTURE_CLOCK],
  );
  counts.bookmarks += bookmark.rowCount;
  return counts;
}
