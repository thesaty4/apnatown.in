import { fixtureId } from './seed-fixtures.mjs';

const ACTIVE = new Set(['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery']);
const FULFILLED = new Set(['delivered', 'picked_up']);
const REJECT_REASONS = Object.freeze({ 'Item out of stock': 'item_out_of_stock' });
const CODE_TTL_MS = 24 * 60 * 60 * 1000; // Same local default as the API (TODO(verify) G-16).
const CODE_COOLDOWN_MS = 60 * 1000;

function event(to, input) {
  if (to === 'accepted') return 'accept';
  if (to === 'preparing') return 'start_preparing';
  if (to === 'ready') return 'mark_ready';
  if (to === 'picked_up') return 'delivery.pickup_completed';
  const self = input.deliveryMethod === 'self';
  if (to === 'out_for_delivery') return self ? 'delivery.self_dispatched' : 'delivery.picked_up';
  if (to === 'delivered') return self ? 'delivery.self_delivered' : 'delivery.delivered';
  return input.sample.cancel?.by === 'vendor' ? 'reject' : 'cancel';
}

function actor(name, input) {
  if (name === 'cancel') return input.userId;
  if (name === 'delivery.picked_up' || name === 'delivery.delivered') return null; // platform rider
  return input.business.owner_user_id;
}

/** Locks and checks stock for still-active orders; null when short. */
async function reservable(client, input) {
  if (!ACTIVE.has(input.statuses.at(-1))) return [];
  const totals = new Map();
  for (const line of input.lines) totals.set(line.productId, (totals.get(line.productId) ?? 0) + line.quantity);
  const ids = [...totals.keys()].sort();
  const { rows } = await client.query(
    `SELECT product_id::text AS id, on_hand, available_for_sale FROM inventory
     WHERE product_id = ANY($1::uuid[]) ORDER BY product_id FOR UPDATE`,
    [ids],
  );
  if (rows.length !== ids.length || rows.some((r) => !r.available_for_sale || r.on_hand < totals.get(r.id))) return null;
  return ids.map((id) => ({ productId: id, quantity: totals.get(id) }));
}

function address(input) {
  if (input.sample.mode !== 'delivery') return null;
  const raw = String(input.sample.addr ?? '').trim();
  // Some sample addresses carry no PIN; keep it null rather than guessing one.
  const pin = /(\d{6})\s*$/.exec(raw)?.[1] ?? null;
  if (!raw) return undefined;
  const text = raw.replace(/^[A-Za-z]+:\s*/, '');
  const pos = input.sample.addrPos;
  const plain = { addressText: text, landmark: null, location: pos ? { lat: pos.lat, lng: pos.lng } : null };
  return {
    addressId: null, addressVersion: null, cityId: input.business.city_id, areaId: null, pinCode: pin,
    ciphertext: input.crypto.encrypt(JSON.stringify(plain), `order:${input.orderId}:delivery-address`),
  };
}

function payment(input, total, at) {
  const status = input.sample.pay.status;
  const cash = input.method === 'cash';
  const last = input.statuses.at(-1);
  if (cash && FULFILLED.has(last))
    return { status: 'collected', funded: total, returned: 0, collected: at.fulfilled, closed: null };
  if (cash) return { status: 'pending', funded: 0, returned: 0, collected: null, closed: at.cancelled };
  if (status === 'refunded') return { status: 'refunded', funded: total, returned: total, collected: null, closed: null };
  return { status: status === 'paid' ? 'paid' : 'pending', funded: status === 'paid' ? total : 0, returned: 0, collected: null, closed: null };
}

async function insertCheckout(client, input, ids, placedAt, total) {
  const q = await client.query(
    `INSERT INTO checkout_quotes (id, cart_id, user_id, cart_version, input_hash, pricing_revision, snapshot,
       created_at, expires_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, 1, 'seed:sample-order', 'seed:sample-pack', $4::jsonb, $5::timestamptz, $5::timestamptz + interval '15 minutes')
     ON CONFLICT DO NOTHING`,
    [ids.quote, input.cartId, input.userId, JSON.stringify({ source: 'sample_pack', orderNumber: input.sample.id }), placedAt],
  );
  const a = await client.query(
    `INSERT INTO checkout_attempts (id, user_id, cart_id, quote_id, idempotency_key, request_hash, status,
       payment_method, expires_at, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, 'seed', 'placed', $6, $7::timestamptz + interval '15 minutes', $7::timestamptz, $7::timestamptz)
     ON CONFLICT DO NOTHING`,
    [ids.attempt, input.userId, input.cartId, ids.quote, `seed:${input.sample.id}`, input.method, placedAt],
  );
  return q.rowCount + a.rowCount === 2 && total >= 0;
}

export async function seedOrderRows(client, context, input, counts) {
  const crypto = context.helpers.crypto;
  const history = input.sample.history.map((h, i) => ({ status: input.statuses[i], at: new Date(h.ts) }));
  const placedAt = history[0].at;
  const at = {
    ready: history.find((h) => h.status === 'ready')?.at ?? null,
    fulfilled: history.find((h) => FULFILLED.has(h.status))?.at ?? null,
    cancelled: history.find((h) => h.status === 'cancelled')?.at ?? null,
  };
  const reserve = await reservable(client, input);
  if (reserve === null) { counts.orders_skipped += 1; counts.skipReasons.insufficient_stock = (counts.skipReasons.insufficient_stock ?? 0) + 1; return false; }
  const snapshot = address({ ...input, crypto });
  if (snapshot === undefined) { counts.orders_skipped += 1; counts.skipReasons.address_invalid = (counts.skipReasons.address_invalid ?? 0) + 1; return false; }
  const fee = (input.sample.fee ?? 0) * 100;
  const delivery = (input.sample.delivery ?? 0) * 100;
  const total = input.subtotal - input.discount + delivery + fee;
  const ids = {
    quote: fixtureId('checkout-quote', input.sample.id, placedAt),
    attempt: fixtureId('checkout-attempt', input.sample.id, placedAt),
    payment: fixtureId('payment-attempt', input.sample.id, placedAt),
  };
  if (!(await insertCheckout(client, input, ids, placedAt, total))) return false;
  counts.checkout_quotes += 1;
  counts.checkout_attempts += 1;
  const pay = payment(input, total, at);
  const handover = pay.status === 'collected' ? fixtureId('handover', input.sample.id, at.fulfilled) : null;
  await client.query(
    `INSERT INTO payment_attempts (id, checkout_attempt_id, quote_id, payment_round, business_id, initiated_by,
       purpose, amount_paise, current_payable_paise, funded_paise, returned_paise, method, status,
       idempotency_key, request_hash, closed_at, collection_key, verified_handover_id, collected_by,
       collected_at, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, 1, $4::uuid, $5::uuid, 'order', $6, $6, $7, $8, $9, $10,
       $11, 'seed', $12, $13, $14::uuid, $15::uuid, $16, $17, $17)`,
    [ids.payment, ids.attempt, ids.quote, input.business.id, input.userId, total, pay.funded, pay.returned,
      input.method, pay.status, `seed:${input.sample.id}`, pay.closed, handover && `seed:${input.sample.id}`,
      handover, handover && input.business.owner_user_id, pay.collected, placedAt],
  );
  counts.payment_attempts += 1;
  const business = {
    id: input.business.id, kind: input.business.kind, nameEn: input.business.name_en, nameHi: input.business.name_hi,
    slug: input.business.slug, areaNameEn: input.business.area_en, areaNameHi: input.business.area_hi,
    addressText: input.business.address_text, pickupInstructions: input.business.pickup_instructions,
    version: input.business.version,
  };
  const last = history.at(-1);
  await client.query(
    `INSERT INTO orders (id, order_number, checkout_attempt_id, customer_user_id, business_id, city_id, area_id,
       mode, delivery_method, status, payment_attempt_id, ordered_items_subtotal_paise, ordered_discount_paise,
       ordered_delivery_fee_paise, ordered_platform_fee_paise, ordered_total_paise, fulfilled_items_subtotal_paise,
       fulfilled_discount_paise, fulfilled_delivery_fee_paise, fulfilled_platform_fee_paise, fulfilled_total_paise,
       version, business_snapshot, delivery_address_snapshot, ready_at, fulfilled_at, cancelled_at, placed_at,
       created_at, updated_at)
     VALUES ($1::uuid, $2, $3::uuid, $4::uuid, $5::uuid, $6::uuid, $7::uuid, $8, $9, $10, $11::uuid,
       $12, $13, $14, $15, $16, $12, $13, $14, $15, $16, $17, $18::jsonb, $19::jsonb, $20, $21, $22, $23, $23, $24)`,
    [input.orderId, input.sample.id, ids.attempt, input.userId, input.business.id, input.business.city_id,
      input.business.area_id, input.sample.mode, input.deliveryMethod, last.status, ids.payment, input.subtotal,
      input.discount, delivery, fee, total, history.length, JSON.stringify(business),
      snapshot && JSON.stringify(snapshot), at.ready, at.fulfilled, at.cancelled, placedAt, last.at],
  );
  await client.query('UPDATE payment_attempts SET order_id = $1::uuid WHERE id = $2::uuid', [input.orderId, ids.payment]);
  const lineRows = await insertLines(client, input, placedAt, ids, last.status, at);
  counts.order_items += lineRows;
  counts.order_stock_allocations += lineRows;
  counts.order_status_history += await insertHistory(client, input, history);
  if (reserve.length) counts.order_stock_operations += await applyReserve(client, ids.attempt, input, reserve, placedAt);
  counts.delivery_codes += await insertCode(client, context, input, last.status);
  return true;
}

async function insertLines(client, input, placedAt, ids, status, at) {
  let rows = 0;
  const disposition = ACTIVE.has(status) ? 'reserved' : FULFILLED.has(status) ? 'fulfilled' : 'released';
  for (const line of input.lines) {
    const net = line.unitPricePaise * line.quantity - line.discountPaise;
    await client.query(
      `INSERT INTO order_items (id, order_id, product_id, product_variant_id, product_name_en, product_name_hi,
         variant_label, ordered_quantity, fulfilled_quantity, unit_price_paise, ordered_discount_paise,
         ordered_line_total_paise, fulfilled_discount_paise, fulfilled_line_total_paise, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, $8, $8, $9, $10, $11, $10, $11, $12, $12)`,
      [line.id, input.orderId, line.productId, line.variantId, line.nameEn, line.nameHi, line.variantLabel,
        line.quantity, line.unitPricePaise, line.discountPaise, net, placedAt],
    );
    await client.query(
      `INSERT INTO order_stock_allocations (order_item_id, order_id, reservation_id, product_id, variant_id,
         reserved_quantity, released_quantity, disposition, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6, $7, $8, $9, $10)`,
      [line.id, input.orderId, ids.attempt, line.productId, line.variantId, line.quantity,
        disposition === 'released' ? line.quantity : 0, disposition, placedAt, at.cancelled ?? at.fulfilled ?? placedAt],
    );
    rows += 1;
  }
  return rows;
}

async function insertHistory(client, input, history) {
  let rows = 0;
  for (const [i, entry] of history.entries()) {
    const name = i === 0 ? 'placed' : event(entry.status, input);
    const reason = name === 'reject' ? (REJECT_REASONS[input.sample.cancel?.reason] ?? 'other') : name === 'cancel' ? 'other' : null;
    await client.query(
      `INSERT INTO order_status_history (id, order_id, from_status, to_status, event_key, actor_user_id, reason_key, created_at)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6::uuid, $7, $8)`,
      [fixtureId('order-history', `${input.sample.id}:${i}`, entry.at), input.orderId, i ? history[i - 1].status : null,
        entry.status, i === 0 ? 'placed' : `${name}:v${i}`, i === 0 ? input.userId : actor(name, input), reason, entry.at],
    );
    rows += 1;
  }
  return rows;
}

// Active sample orders hold real reservations: decrement exactly once with
// the same durable operation record the API writes.
async function applyReserve(client, reservationId, input, totals, at) {
  const stocks = [];
  for (const line of totals) {
    const { rows } = await client.query(
      `UPDATE inventory SET on_hand = on_hand - $2, version = version + 1, updated_at = now()
       WHERE product_id = $1::uuid RETURNING version, on_hand`,
      [line.productId, line.quantity],
    );
    stocks.push({ productId: line.productId, version: rows[0].version, onHand: rows[0].on_hand });
  }
  const lines = input.lines.map((l) => ({ orderItemId: l.id, productId: l.productId, quantity: l.quantity }));
  const { rowCount } = await client.query(
    `INSERT INTO order_stock_operations (id, reservation_id, kind, source_key, payload_hash, lines, result, applied_at)
     VALUES ($1::uuid, $2::uuid, 'reserve', $3, 'seed', $4::jsonb, $5::jsonb, $6)`,
    [fixtureId('stock-op', `reserve:${input.sample.id}`, at), reservationId, `reserve:${reservationId}`,
      JSON.stringify(lines), JSON.stringify({ stocks }), at],
  );
  return rowCount;
}

// Live customer code from the sample (pickup ready / self out_for_delivery).
// Issued "now" so it is usable locally; HMAC + AES-GCM like the API.
async function insertCode(client, context, input, status) {
  const pickup = input.sample.mode === 'pickup' && status === 'ready';
  const self = input.deliveryMethod === 'self' && status === 'out_for_delivery';
  if (!pickup && !self) return 0;
  const code = pickup ? input.sample.pickupCode : input.sample.otp;
  if (!/^\d{4}$/.test(code ?? '')) return 0;
  const ref = { orderId: input.orderId, kind: pickup ? 'pickup_code' : 'delivery_otp', generation: 1 };
  const now = new Date();
  const { rowCount } = await client.query(
    `INSERT INTO delivery_codes (id, order_id, kind, generation, code_hash, code_ciphertext, hash_key_version,
       encryption_key_version, issued_at, expires_at, reissue_available_at)
     VALUES ($1::uuid, $2::uuid, $3, 1, $4, $5, 'otp-hmac-v1', 'pii-aesgcm-v1', $6, $7, $8)
     ON CONFLICT DO NOTHING`,
    [fixtureId('delivery-code', `${input.sample.id}:1`), input.orderId, ref.kind,
      context.helpers.deliveryCodes.hash(ref, code), context.helpers.deliveryCodes.encrypt(ref, code), now,
      new Date(now.getTime() + CODE_TTL_MS), new Date(now.getTime() + CODE_COOLDOWN_MS)],
  );
  return rowCount;
}
