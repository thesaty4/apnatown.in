import { fixtureId } from './seed-fixtures.mjs';
import { findSeedUser, seedReference } from './seed-context.mjs';
import { seedOrderRows } from './seed-order-rows.mjs';
import { seedOrderSettings } from './seed-order-settings.mjs';

// LOCAL/TEST only: the sample pack's `orders` (docs/design-context/
// 10-sample-data.json) for customers, businesses and products that exist in
// this seed. Insert-only and idempotent by fixture ID; anything unresolvable
// is skipped and counted, never invented. Sample orders predate checkout, so
// each gets a historical quote/attempt pair purely to satisfy the FK chain
// (expired, never placeable). Seeds emit no outbox events.
const STATUS = Object.freeze({
  placed: 'placed', accepted: 'accepted', preparing: 'preparing', ready: 'ready',
  out: 'out_for_delivery', delivered: 'delivered', pickedup: 'picked_up', cancelled: 'cancelled',
});
const PAY_METHOD = Object.freeze({ COD: 'cash', UPI: 'upi' });
const ACCOUNT_STATUSES = new Set(['active']);

function skip(counts, reason) {
  counts.orders_skipped += 1;
  counts.skipReasons[reason] = (counts.skipReasons[reason] ?? 0) + 1;
  return null;
}

// Customer persona for u1; other sample customers get the same minimal
// insert-only synthetic account the review seed uses (sample name/phone only).
async function customer(client, context, uid, counts) {
  const { crypto, normalizePhone } = context.helpers;
  const entry = (context.sample.users ?? []).find((user) => user.id === uid);
  if (!entry?.phone || !ACCOUNT_STATUSES.has(entry.status)) return skip(counts, 'customer_not_in_sample_users');
  const phone = normalizePhone(entry.phone);
  if (phone === context.personas.users[0].phone) return seedReference(context.users, 'customer');
  const user = { id: fixtureId('user', uid), phone };
  const existing = await findSeedUser(client, crypto, user).catch(() => 'conflict');
  if (existing === 'conflict') return skip(counts, 'customer_identity_conflict');
  if (existing) return existing;
  const at = new Date(entry.joined);
  await client.query(
    `INSERT INTO users (id, phone_ciphertext, phone_lookup_hash, display_name, account_status, created_at, updated_at)
     VALUES ($1::uuid, $2, $3, $4, 'active', $5, $5)`,
    [user.id, crypto.encrypt(phone, `user:${user.id}:phone`), Buffer.from(crypto.phoneHash(phone)), entry.name, at],
  );
  await client.query(
    `INSERT INTO user_roles (user_id, role, created_at) VALUES ($1::uuid, 'customer', $2) ON CONFLICT DO NOTHING`,
    [user.id, at],
  );
  counts.order_customers += 1;
  return user.id;
}

async function cartFor(client, userId, at) {
  const { rows } = await client.query('SELECT id FROM carts WHERE user_id = $1::uuid', [userId]);
  if (rows[0]) return rows[0].id;
  // An empty account cart row is the FK anchor for the historical quote only.
  const id = fixtureId('cart', `order-anchor:${userId}`);
  await client.query(
    `INSERT INTO carts (id, user_id, version, created_at, updated_at) VALUES ($1::uuid, $2::uuid, 1, $3, $3)
     ON CONFLICT DO NOTHING`,
    [id, userId, at],
  );
  return id;
}

async function resolveItems(client, context, order, counts) {
  const items = [];
  for (const item of order.items) {
    const productId = context.products.get(item.pid);
    if (!productId) return skip(counts, 'product_not_seeded');
    const label = item.variant || null;
    const { rows } = await client.query(
      `SELECT p.business_id::text AS business_id, v.id::text AS variant_id,
         EXISTS (SELECT 1 FROM product_variants a WHERE a.product_id = p.id AND a.active) AS labelled
       FROM products p
       LEFT JOIN product_variants v ON v.product_id = p.id AND v.active AND v.label = $2
       WHERE p.id = $1::uuid`,
      [productId, label],
    );
    const row = rows[0];
    if (!row || row.business_id !== context.businesses.get(order.bid)) return skip(counts, 'product_business_mismatch');
    if ((label !== null) !== row.labelled || (label !== null && !row.variant_id)) return skip(counts, 'variant_unresolved');
    if (!Number.isInteger(item.price) || !Number.isInteger(item.qty) || item.qty < 1) return skip(counts, 'item_invalid');
    items.push({
      id: fixtureId('order-item', `${order.id}:${item.pid}:${label ?? ''}`),
      productId, variantId: row.variant_id ?? null, variantLabel: label,
      nameEn: item.name.en, nameHi: item.name.hi ?? null, quantity: item.qty, unitPricePaise: item.price * 100,
    });
  }
  return items;
}

/** Largest-remainder allocation of the order discount over line nets (BR-19 style). */
function allocateDiscount(items, discountPaise) {
  const gross = items.map((i) => i.unitPricePaise * i.quantity);
  const total = gross.reduce((a, b) => a + b, 0);
  const shares = gross.map((g) => (total ? Math.floor((discountPaise * g) / total) : 0));
  let rest = discountPaise - shares.reduce((a, b) => a + b, 0);
  const order = gross.map((g, i) => [g, i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (const [, i] of order) if (rest > 0 && shares[i] < gross[i]) { shares[i] += 1; rest -= 1; }
  return items.map((item, i) => ({ ...item, discountPaise: shares[i] }));
}

function plan(context, order, business) {
  const statuses = order.history.map((h) => STATUS[h.s]);
  if (statuses.some((s) => !s) || STATUS[order.status] !== statuses.at(-1) || statuses[0] !== 'placed') return null;
  const method = PAY_METHOD[order.pay?.method];
  if (!method) return null;
  const rider = order.riderId ? 'apna_town_rider' : null;
  const sampleMode = (context.sample.biz ?? []).concat(context.sample.svc ?? []).find((b) => b.id === order.bid)?.del?.mode;
  const deliveryMethod = order.mode === 'pickup' ? null : rider ?? (sampleMode === 'self' ? 'self' : 'apna_town_rider');
  return { statuses, method, deliveryMethod, business };
}

async function businessRow(client, businessId) {
  const { rows } = await client.query(
    `SELECT b.id::text AS id, b.kind, b.name_en, b.name_hi, b.slug, b.city_id::text AS city_id,
       b.area_id::text AS area_id, b.owner_user_id::text AS owner_user_id, b.address_text, b.version, a.name_en AS area_en, a.name_hi AS area_hi,
       s.pickup_instructions
     FROM businesses b JOIN areas a ON a.id = b.area_id
     LEFT JOIN business_settings s ON s.business_id = b.id
     WHERE b.id = $1::uuid AND b.status = 'approved' AND b.deleted_at IS NULL`,
    [businessId],
  );
  return rows[0] ?? null;
}

export async function seedOrderData(client, context) {
  const counts = {
    orders: 0, order_items: 0, order_status_history: 0, order_stock_allocations: 0,
    order_stock_operations: 0, payment_attempts: 0, checkout_quotes: 0, checkout_attempts: 0,
    delivery_codes: 0, order_customers: 0, orders_existing: 0, orders_skipped: 0, skipReasons: {},
  };
  Object.assign(counts, await seedOrderSettings(client, context));
  for (const order of context.sample.orders ?? []) {
    const orderId = fixtureId('order', order.id, new Date(order.ts));
    const existing = await client.query('SELECT id FROM orders WHERE id = $1::uuid OR order_number = $2', [orderId, order.id]);
    if (existing.rowCount) {
      if (existing.rows.some((row) => row.id !== orderId)) skip(counts, 'order_number_conflict');
      else counts.orders_existing += 1;
      continue;
    }
    const businessId = context.businesses.get(order.bid);
    if (!businessId) { skip(counts, 'business_not_seeded'); continue; }
    const business = await businessRow(client, businessId);
    if (!business) { skip(counts, 'business_not_approved'); continue; }
    const shape = plan(context, order, business);
    if (!shape) { skip(counts, 'order_shape_invalid'); continue; }
    const userId = await customer(client, context, order.uid, counts);
    if (!userId) continue;
    const items = await resolveItems(client, context, order, counts);
    if (!items) continue;
    const discount = (order.discount ?? 0) * 100;
    const lines = allocateDiscount(items, discount);
    const subtotal = lines.reduce((sum, l) => sum + l.unitPricePaise * l.quantity, 0);
    if (subtotal !== order.subtotal * 100) { skip(counts, 'subtotal_mismatch'); continue; }
    const cartId = await cartFor(client, userId, new Date(order.ts));
    const inserted = await seedOrderRows(client, context, {
      sample: order, orderId, userId, cartId, business, lines, subtotal, discount, ...shape,
    }, counts);
    if (inserted) counts.orders += 1;
  }
  return counts;
}
