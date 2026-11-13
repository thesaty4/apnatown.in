import {
  inAppTemplateVersion,
  insertTemplateNotice,
  notificationPreference,
} from './seed-notification-data.mjs';

// LOCAL/TEST only: the in-app notices the worker would have published for
// each seeded sample order's history (orders BE + notifications BE matrix):
//   placed                      -> owner    `order.new`
//   accepted … delivered/picked -> customer `order.status`
//   reject                      -> customer `order.status` (rejected)
//   customer cancel             -> owner    `order.cancelled`
// Params are the order number and a status code only. Notices of finished
// orders are seeded as read so unread badges reflect active orders.
const CUSTOMER_STATUSES = new Set(['accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'picked_up']);
const FINISHED = new Set(['delivered', 'picked_up', 'cancelled']);
const TEMPLATE_KEYS = ['order.new', 'order.status', 'order.cancelled'];

function noticeFor(order, entry, index) {
  const owner = { userId: order.owner_user_id, role: order.kind === 'shop' ? 'vendor' : 'provider' };
  const customer = { userId: order.customer_user_id, role: 'customer' };
  const ownerLink = `/${owner.role}/orders/${order.id}`;
  const customerLink = `/orders/${order.id}`;
  const params = { orderNumber: order.order_number };
  if (index === 0)
    return { ...owner, templateKey: 'order.new', params, link: ownerLink, sourceType: 'order.created' };
  if (CUSTOMER_STATUSES.has(entry.to_status)) {
    const status = order.mode === 'pickup' && entry.to_status === 'ready' ? 'ready_for_pickup' : entry.to_status;
    return {
      ...customer, templateKey: 'order.status', params: { ...params, status },
      link: customerLink, sourceType: 'order.status_changed',
    };
  }
  if (entry.to_status !== 'cancelled') return null;
  if (entry.event_key.startsWith('reject'))
    return {
      ...customer, templateKey: 'order.status', params: { ...params, status: 'rejected' },
      link: customerLink, sourceType: 'order.cancelled',
    };
  return { ...owner, templateKey: 'order.cancelled', params, link: ownerLink, sourceType: 'order.cancelled' };
}

export async function seedOrderNotifications(client, context) {
  const counts = { notification_preferences: 0, notifications: 0, notification_deliveries: 0 };
  const numbers = (context.sample.orders ?? []).map((order) => order.id);
  if (!numbers.length) return counts;
  const versions = new Map();
  for (const key of TEMPLATE_KEYS) versions.set(key, await inAppTemplateVersion(client, key));
  const { rows: orders } = await client.query(
    `SELECT o.id::text AS id, o.order_number, o.mode, o.status, o.customer_user_id::text AS customer_user_id,
       b.owner_user_id::text AS owner_user_id, b.kind
     FROM orders o JOIN businesses b ON b.id = o.business_id
     WHERE o.order_number = ANY($1::text[])
     ORDER BY o.placed_at, o.id`,
    [numbers],
  );
  const preferences = new Map();
  const preferenceOf = async (userId) => {
    if (!preferences.has(userId)) preferences.set(userId, await notificationPreference(client, userId, counts));
    return preferences.get(userId);
  };
  for (const order of orders) {
    const { rows: history } = await client.query(
      `SELECT to_status, event_key, created_at FROM order_status_history
       WHERE order_id = $1::uuid ORDER BY created_at, id`,
      [order.id],
    );
    for (const [index, entry] of history.entries()) {
      const notice = noticeFor(order, entry, index);
      if (!notice) continue;
      const key = `order:${order.order_number}:${index}`;
      await insertTemplateNotice(
        client,
        context,
        {
          ...notice,
          key,
          deliveryKey: key,
          templateVersion: versions.get(notice.templateKey),
          sourceVersion: index + 1,
          at: entry.created_at,
          read: FINISHED.has(order.status),
        },
        await preferenceOf(notice.userId),
        counts,
      );
    }
  }
  return counts;
}
