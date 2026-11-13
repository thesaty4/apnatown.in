import { FIXTURE_CLOCK, fixtureId } from './seed-fixtures.mjs';
import { seedReference } from './seed-context.mjs';

export async function notificationPreference(client, userId, counts) {
  const inserted = await client.query(
    `INSERT INTO notification_preferences
       (user_id, inapp, email, wa_orders, wa_offers, wa_enq, updated_at)
     VALUES ($1::uuid, true, false, false, false, false, $2)
     ON CONFLICT DO NOTHING`,
    [userId, FIXTURE_CLOCK],
  );
  counts.notification_preferences += inserted.rowCount;
  const { rows } = await client.query(
    'SELECT inapp, email FROM notification_preferences WHERE user_id = $1::uuid FOR SHARE',
    [userId],
  );
  if (!rows.length) throw new Error('SEED_REFERENCE_CONFLICT');
  return rows[0];
}

/** Single active EN+HI in-app template version for `key` (seed precondition). */
export async function inAppTemplateVersion(client, key) {
  const templates = await client.query(
    `SELECT version FROM notification_templates WHERE key = $1
       AND channel = 'in_app' AND active
     GROUP BY version HAVING count(DISTINCT locale) = 2`,
    [key],
  );
  if (templates.rows.length !== 1) throw new Error('SEED_NOTIFICATION_TEMPLATE_REQUIRED');
  return templates.rows[0].version;
}

/**
 * Inserts one historical template notice plus its per-channel delivery
 * outcomes, exactly as the worker would have recorded them. Insert-only and
 * idempotent by fixture ID; `deliveryKey` keys the delivery fixture IDs.
 */
export async function insertTemplateNotice(client, context, notice, preference, counts) {
  const policy = context.helpers.notificationPolicy[notice.templateKey];
  const id = fixtureId('notification', notice.key);
  const inserted = await client.query(
    `INSERT INTO notifications (id, user_id, audience_role, category, topic,
       intent, template_key, template_version, content_version, params,
       link_path, in_app_published_at, read_at, source_event_id, source_type,
       source_version, created_at)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11,
       $12, $13, $14::uuid, $15, $16, $17)
     ON CONFLICT DO NOTHING`,
    [
      id,
      notice.userId,
      notice.role,
      policy.category,
      policy.topic,
      policy.intent,
      notice.templateKey,
      notice.templateVersion,
      context.helpers.notificationContentVersion,
      JSON.stringify(notice.params),
      notice.link,
      preference.inapp ? notice.at : null,
      preference.inapp && notice.read ? notice.at : null,
      fixtureId('notification-source', notice.key),
      notice.sourceType,
      notice.sourceVersion,
      notice.at,
    ],
  );
  counts.notifications += inserted.rowCount;
  if (!inserted.rowCount) return;
  for (const channel of policy.channels) {
    const delivered = channel === 'in_app' && preference.inapp;
    const reason = delivered
      ? null
      : channel === 'in_app' || !preference.email
        ? 'preference_off'
        : 'channel_disabled';
    const delivery = await client.query(
      `INSERT INTO notification_deliveries (id, notification_id, channel,
         status, suppression_reason, delivered_at, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $7)
       ON CONFLICT DO NOTHING`,
      [
        fixtureId('notification-delivery', `${notice.deliveryKey}:${channel}`),
        id,
        channel,
        delivered ? 'delivered' : 'suppressed',
        reason,
        delivered ? notice.at : null,
        notice.at,
      ],
    );
    counts.notification_deliveries += delivery.rowCount;
  }
}

async function seedApprovalNotice(client, context, business, preference, counts) {
  const { rows } = await client.query(
    `SELECT status, version FROM businesses WHERE id = $1::uuid`,
    [business.id],
  );
  if (rows[0]?.status !== 'approved') return;
  const role = business.kind === 'shop' ? 'vendor' : 'provider';
  await insertTemplateNotice(
    client,
    context,
    {
      key: `approval:${business.key}`,
      deliveryKey: business.key,
      userId: seedReference(context.users, business.ownerKey),
      role,
      templateKey: 'approval.decided',
      templateVersion: await inAppTemplateVersion(client, 'approval.decided'),
      params: { status: 'approved' },
      link: `/${role}/overview`,
      sourceType: 'business.application.decision_changed',
      sourceVersion: rows[0].version,
      at: FIXTURE_CLOCK,
      read: false,
    },
    preference,
    counts,
  );
}

/** Historical in-app outcomes only: no outbox records or sendable jobs. */
export async function seedNotificationData(client, context) {
  const counts = {
    notification_preferences: 0,
    notifications: 0,
    notification_deliveries: 0,
  };
  const byUser = new Map();
  for (const userId of new Set(context.users.values()))
    byUser.set(userId, await notificationPreference(client, userId, counts));
  for (const business of context.fixtures.businesses)
    await seedApprovalNotice(
      client,
      context,
      business,
      byUser.get(seedReference(context.users, business.ownerKey)),
      counts,
    );
  return counts;
}
