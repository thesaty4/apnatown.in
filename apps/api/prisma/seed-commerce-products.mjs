import { FIXTURE_CLOCK, fixtureId } from './seed-fixtures.mjs';
import { seedReference } from './seed-context.mjs';
import { assertReference, assertSeed, checked } from './seed-commerce-support.mjs';

async function seedVariants(client, context, sample, schemas) {
  const productId = seedReference(context.products, sample.id);
  const businessId = seedReference(context.businesses, sample.bid);
  const variants = checked(
    schemas.products.ProductCreateSchema.shape.variants,
    sample.variants.map((label) => ({ label })),
  );
  assertSeed(Array.isArray(variants));
  assertSeed(new Set(variants.map((row) => row.label)).size === variants.length);
  if (!variants.length) return 0;
  const eligible = await client.query(
    `SELECT p.id FROM products p WHERE p.id = $1::uuid
       AND p.business_id = $2::uuid AND p.version = 1
       AND p.created_at = $3 AND p.updated_at = $3 AND p.deleted_at IS NULL
       AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id)
       AND NOT EXISTS (SELECT 1 FROM cart_lines l WHERE l.product_id = p.id)`,
    [productId, businessId, FIXTURE_CLOCK],
  );
  // Do not change variant selection rules underneath existing carts, edited
  // products, or a deactivated variant set (including an intentional clear).
  if (!eligible.rowCount) return 0;
  const ids = variants.map((row) => fixtureId('product-variant', `${sample.id}:${row.label}`));
  const inserted = await client.query(
    `INSERT INTO product_variants (id, product_id, label, position, active)
     SELECT v.id, $1::uuid, v.label, (v.ordinality - 1)::int, true
     FROM unnest($2::uuid[], $3::text[]) WITH ORDINALITY AS v(id, label, ordinality)
     ON CONFLICT DO NOTHING`,
    [productId, ids, variants.map((row) => row.label)],
  );
  // A collision may not leave half a new selectable-label aggregate.
  assertReference(inserted.rowCount === variants.length);
  return inserted.rowCount;
}

async function seedPills(client, context, businessKey, schemas) {
  const businessId = seedReference(context.businesses, businessKey);
  const { rows } = await client.query(
    `SELECT DISTINCT s.id, s.sort_order, c.sort_order AS category_order
     FROM products p JOIN subcategories s ON s.id = p.subcategory_id AND s.active
     JOIN categories c ON c.id = s.category_id AND c.id = p.category_id
       AND c.kind = 'product' AND c.active
     WHERE p.business_id = $1::uuid AND p.deleted_at IS NULL
       AND EXISTS (SELECT 1 FROM businesses b WHERE b.id = $1::uuid
         AND b.xmin::text::numeric = mod(pg_current_xact_id()::text::numeric, 4294967296))
       AND NOT EXISTS (SELECT 1 FROM product_category_pills pp WHERE pp.business_id = $1::uuid)
     ORDER BY c.sort_order, s.sort_order, s.id`,
    [businessId],
  );
  // Sample pill configs are empty: persist catalog labels/visible defaults,
  // not invented renames or hidden categories. Read current taxonomy IDs.
  const input = checked(schemas.products.ProductPillsReplaceSchema, {
    items: rows.map((row, position) => ({
      subcategoryId: row.id, position, labelEn: null, labelHi: null, hidden: false,
    })),
  });
  if (!input.items.length) return 0;
  const result = await client.query(
    `INSERT INTO product_category_pills
       (business_id, subcategory_id, position, label_en, label_hi, hidden)
     SELECT $1::uuid, p.id, (p.ordinality - 1)::int, NULL, NULL, false
     FROM unnest($2::uuid[]) WITH ORDINALITY AS p(id, ordinality)
     ON CONFLICT DO NOTHING`,
    [businessId, input.items.map((row) => row.subcategoryId)],
  );
  assertReference(result.rowCount === input.items.length);
  return result.rowCount;
}

export async function seedCommerceProducts(client, context, schemas, counts) {
  // Pills have a destructive reset-to-default and no version/tombstone. Only
  // a business INSERTed by the parent in THIS transaction admits initial
  // preferences; an empty set on an older business might be operator intent.
  // Parent is insert-only, so xmin identifies insertion, not an UPDATE.
  // Compare the low 32 bits of xid8 with xmin's xid (including wraparound).
  // Product variants can safely extend untouched older products: edits bump
  // the product version, removals retain inactive rows, existing carts fence it.
  for (const [businessKey, listings] of context.listings.byBusiness) {
    const sampleBusiness = [...context.sample.biz, ...context.sample.svc]
      .find((row) => row.id === businessKey);
    assertSeed(sampleBusiness !== undefined);
    const pill = sampleBusiness.pill;
    // Don't silently discard future non-default sample preferences.
    assertSeed(pill && !pill.order.length && !pill.hidden.length && !Object.keys(pill.rename).length);
    for (const product of listings.products) {
      const sample = context.sample.products.find((row) => fixtureId('product', row.id) === product.id);
      assertSeed(sample !== undefined && Array.isArray(sample.variants));
      counts.product_variants += await seedVariants(
        client, context, sample, schemas,
      );
    }
    counts.product_category_pills += await seedPills(client, context, businessKey, schemas);
  }
}
