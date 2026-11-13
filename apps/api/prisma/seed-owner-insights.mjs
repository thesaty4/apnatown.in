import { fixtureId } from './seed-fixtures.mjs';
import { seedReference } from './seed-context.mjs';
import {
  inAppTemplateVersion,
  insertTemplateNotice,
  notificationPreference,
} from './seed-notification-data.mjs';

// LOCAL/TEST only, grounded in docs/design-context/10-sample-data.json:
//  * reviews[].status = 'reported' (rv9, admin notice "Spam review on …")
//    -> one open owner report (reason spam) so Reported shows a real report;
//  * notifs.cust offer notice "Kushinagar Sweets: free delivery above ₹500."
//    -> the owner's offer announcement, the customer's bell-on follow and
//    the historical in-app follower notice. Insert-only/idempotent.
const ANNOUNCEMENTS = [
  { id: 'ng8y0w', bid: 'b5', kind: 'offer', messageEn: 'Free delivery above ₹500.' },
];

async function seedReviewReports(client, context, counts) {
  for (const review of context.sample.reviews ?? []) {
    if (review.status !== 'reported') continue;
    const { rows } = await client.query(
      `SELECT r.id::text AS id, b.owner_user_id::text AS owner
       FROM reviews r JOIN businesses b ON b.id = r.business_id
       WHERE r.id = $1::uuid AND r.status = 'reported'`,
      [fixtureId('review', review.id)],
    );
    if (!rows[0]) continue;
    const inserted = await client.query(
      `INSERT INTO review_reports (id, review_id, reporter_user_id, reporter_subject_hash,
         reason, status, created_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, 'spam', 'open', $5)
       ON CONFLICT DO NOTHING`,
      [
        fixtureId('review-report', review.id),
        rows[0].id,
        rows[0].owner,
        context.helpers.reviewReporterSubject(rows[0].owner),
        new Date(review.ts),
      ],
    );
    counts.review_reports += inserted.rowCount;
  }
}

async function seedAnnouncement(client, context, item, counts) {
  const businessId = context.businesses.get(item.bid);
  if (!businessId) return;
  const { rows } = await client.query(
    `SELECT name_en, name_hi FROM businesses
     WHERE id = $1::uuid AND status = 'approved' AND deleted_at IS NULL`,
    [businessId],
  );
  if (!rows[0]) return;
  const at = new Date((context.sample.notifs?.cust ?? []).find((n) => n.id === item.id)?.ts ?? Date.now());
  const id = fixtureId('follower-announcement', item.id);
  const inserted = await client.query(
    `INSERT INTO follower_announcements (id, business_id, kind, source, message_en, created_at)
     VALUES ($1::uuid, $2::uuid, $3, 'owner_announcement', $4, $5) ON CONFLICT DO NOTHING`,
    [id, businessId, item.kind, item.messageEn, at],
  );
  counts.follower_announcements += inserted.rowCount;
  const customer = seedReference(context.users, 'customer');
  await client.query(
    `INSERT INTO follows (user_id, business_id, bell_on, created_at, last_followed_at)
     VALUES ($1::uuid, $2::uuid, true, $3, $3)
     ON CONFLICT (user_id, business_id) DO UPDATE SET bell_on = true
       WHERE follows.unfollowed_at IS NULL AND NOT follows.bell_on`,
    [customer, businessId, new Date(at.getTime() - 24 * 60 * 60 * 1000)],
  );
  const params = { name: rows[0].name_en, message: item.messageEn };
  if (rows[0].name_hi) params.name_hi = rows[0].name_hi;
  await insertTemplateNotice(
    client,
    context,
    {
      key: `announcement:${item.id}`,
      deliveryKey: `announcement:${item.id}`,
      userId: customer,
      role: 'customer',
      templateKey: 'follower.announcement',
      templateVersion: await inAppTemplateVersion(client, 'follower.announcement'),
      params,
      link: item.kind === 'offer' ? '/offers' : '/videos',
      sourceType: 'engagement.announcement_created',
      sourceVersion: 1,
      at,
      read: true,
    },
    await notificationPreference(client, customer, counts),
    counts,
  );
}

export async function seedOwnerInsights(client, context) {
  const counts = {
    review_reports: 0,
    follower_announcements: 0,
    notification_preferences: 0,
    notifications: 0,
    notification_deliveries: 0,
  };
  await seedReviewReports(client, context, counts);
  for (const item of ANNOUNCEMENTS) await seedAnnouncement(client, context, item, counts);
  return counts;
}
