import { FIXTURE_CLOCK, fixtureId } from './seed-fixtures.mjs';
import { seedReference } from './seed-context.mjs';

async function preferences(client, userId, counts) {
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

async function seedApprovalNotice(client, context, business, preference, counts) {
  const { rows } = await client.query(
    `SELECT status, version FROM businesses WHERE id = $1::uuid`,
    [business.id],
  );
  if (rows[0]?.status !== 'approved') return;
  const templates = await client.query(
    `SELECT version FROM notification_templates WHERE key = 'approval.decided'
       AND channel = 'in_app' AND active
     GROUP BY version HAVING count(DISTINCT locale) = 2`,
  );
  if (templates.rows.length !== 1) throw new Error('SEED_NOTIFICATION_TEMPLATE_REQUIRED');
  const role = business.kind === 'shop' ? 'vendor' : 'provider';
  const id = fixtureId('notification', `approval:${business.key}`);
  const policy = context.helpers.notificationPolicy['approval.decided'];
  const inserted = await client.query(
    `INSERT INTO notifications (id, user_id, audience_role, category, topic,
       intent, template_key, template_version, content_version, params,
       link_path, in_app_published_at, source_event_id, source_type,
       source_version, created_at)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, 'approval.decided', $7,
       $8, '{"status":"approved"}'::jsonb, $9, $10,
       $11::uuid, 'business.application.decision_changed', $12, $13)
     ON CONFLICT DO NOTHING`,
    [
      id,
      seedReference(context.users, business.ownerKey),
      role,
      policy.category,
      policy.topic,
      policy.intent,
      templates.rows[0].version,
      context.helpers.notificationContentVersion,
      `/${role}/overview`,
      preference.inapp ? FIXTURE_CLOCK : null,
      fixtureId('notification-source', `approval:${business.key}`),
      rows[0].version,
      FIXTURE_CLOCK,
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
        fixtureId('notification-delivery', `${business.key}:${channel}`),
        id,
        channel,
        delivered ? 'delivered' : 'suppressed',
        reason,
        delivered ? FIXTURE_CLOCK : null,
        FIXTURE_CLOCK,
      ],
    );
    counts.notification_deliveries += delivery.rowCount;
  }
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
    byUser.set(userId, await preferences(client, userId, counts));
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
