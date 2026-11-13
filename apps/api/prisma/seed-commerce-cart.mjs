import { FIXTURE_CLOCK, fixtureId } from './seed-fixtures.mjs';
import { seedReference } from './seed-context.mjs';
import { assertReference, assertSeed, checked } from './seed-commerce-support.mjs';

// Product identities/labels come from the sample; quantities are a bounded
// local demo selection, not sample orders. No prices, stock or fees are frozen.
const SELECTION = [
  { key: 'p1', label: '5 kg', quantity: 1, saved: false },
  { key: 'p2', label: null, quantity: 2, saved: false },
  { key: 'p17', label: null, quantity: 1, saved: false },
  { key: 'p13', label: 'White', quantity: 1, saved: true },
  // Saved history may now be unavailable; keep the read contract's honest
  // OUT_OF_STOCK state without changing the source's zero stock.
  { key: 'p6', label: null, quantity: 1, saved: true },
];

async function selectedLine(client, context, schemas, selection) {
  const productId = seedReference(context.products, selection.key);
  const source = context.sample.products.find((row) => row.id === selection.key);
  assertSeed(source !== undefined);
  const businessId = seedReference(context.businesses, source.bid);
  const { rows } = await client.query(
    `SELECT p.id, v.id AS variant_id
     FROM products_public_discovery p
     JOIN inventory i ON i.product_id = p.id
     LEFT JOIN product_variants v ON v.product_id = p.id AND v.active AND v.label = $3
     WHERE p.id = $1::uuid AND p.business_id = $2::uuid
       AND (($3::text IS NOT NULL AND v.id IS NOT NULL)
         OR ($3::text IS NULL AND NOT EXISTS
           (SELECT 1 FROM product_variants active WHERE active.product_id = p.id AND active.active)))
       AND ($5::boolean OR (i.available_for_sale AND i.on_hand >= $4::int))`,
    [productId, businessId, selection.label, selection.quantity, selection.saved],
  );
  if (!rows.length) return null; // Respect current visibility/labels/stock.
  assertReference(rows.length === 1);
  const input = checked(schemas.cart.AddCartLineSchema, {
    productId, variantId: rows[0].variant_id ?? null,
    quantity: selection.quantity, expectedCartVersion: 0,
  });
  return { ...input, key: selection.key, saved: selection.saved };
}

async function insertLine(client, cartId, line) {
  const result = await client.query(
    `INSERT INTO cart_lines
       (id, cart_id, product_id, product_variant_id, quantity,
        saved_for_later, version, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, 1, $7, $7)
     ON CONFLICT DO NOTHING`,
    [
      fixtureId('cart-line', `customer:${line.key}`), cartId,
      line.productId, line.variantId, line.quantity, line.saved, FIXTURE_CLOCK,
    ],
  );
  // The cart was inserted this run, so any child-ID conflict is foreign.
  assertReference(result.rowCount === 1);
  return result.rowCount;
}

export async function seedCommerceCart(client, context, schemas, counts) {
  const userId = seedReference(context.users, 'customer');
  const cartId = fixtureId('cart', 'customer');
  const existing = await client.query(
    'SELECT id, user_id FROM carts WHERE id = $1::uuid OR user_id = $2::uuid',
    [cartId, userId],
  );
  assertReference(existing.rows.every((row) => row.user_id === userId));
  if (existing.rowCount) return; // Never reset/refill even an empty user cart.
  const lines = [];
  for (const selection of SELECTION) {
    const line = await selectedLine(client, context, schemas, selection);
    if (line) lines.push(line);
  }
  if (!lines.length) return; // No empty persisted cart masquerading as intent.
  const cart = await client.query(
    `INSERT INTO carts (id, user_id, version, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, 1, $3, $3)
     ON CONFLICT DO NOTHING RETURNING id`,
    [cartId, userId, FIXTURE_CLOCK],
  );
  if (!cart.rowCount) return;
  counts.carts += cart.rowCount;
  for (const line of lines)
    counts.cart_lines += await insertLine(client, cartId, line);
  // Authenticated customer only: no guest token/capability, checkout attempt,
  // stock reservation, payment attempt or completed-order claim.
}
