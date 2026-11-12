import { FIXTURE_CLOCK } from './seed-fixtures.mjs';

/** Reuse the migration's exact category identity, not a bare subcategory slug. */
async function categoryIdFor(client, taxonomy) {
  const { rows } = await client.query(
    `SELECT id FROM categories
     WHERE id = md5('apnatown:catalog:category:' || $1::text)::uuid
       AND kind = $2 AND slug = $3`,
    [taxonomy.categoryKey, taxonomy.kind, taxonomy.categorySlug],
  );
  if (!rows.length) throw new Error('SEED_DATA_INVALID');
  return rows[0].id;
}

async function subcategoryIdFor(client, categoryId, taxonomy) {
  const { rows } = await client.query(
    `SELECT id FROM subcategories WHERE category_id = $1::uuid AND slug = $2
       AND (($3::text = 'product' AND normalized_name = unaccent($4::text))
         OR ($3::text = 'service'
           AND id = md5('apnatown:catalog:subcategory:' || $5::text || ':' || $2::text)::uuid))`,
    [
      categoryId,
      taxonomy.subcategorySlug,
      taxonomy.kind,
      taxonomy.normalizedName,
      taxonomy.categoryKey,
    ],
  );
  if (!rows.length) throw new Error('SEED_DATA_INVALID');
  return rows[0].id;
}

export async function seedListingTaxonomy(client, taxonomies, counts) {
  const ids = new Map();
  const positions = new Map();
  for (const taxonomy of taxonomies) {
    const categoryId = await categoryIdFor(client, taxonomy);
    if (taxonomy.kind === 'product') {
      const position = positions.get(categoryId) ?? 0;
      const { rowCount } = await client.query(
        `INSERT INTO subcategories (id, category_id, slug, name_en, name_hi,
           normalized_name, sort_order, created_at, updated_at)
         VALUES ($1::uuid, $2::uuid, $3, $4, $4, unaccent($5::text), $6, $7, $7)
         ON CONFLICT DO NOTHING`,
        [
          taxonomy.subcategoryId,
          categoryId,
          taxonomy.subcategorySlug,
          taxonomy.name,
          taxonomy.normalizedName,
          position,
          FIXTURE_CLOCK,
        ],
      );
      counts.productSubcategories += rowCount;
      positions.set(categoryId, position + 1);
    }
    // Never recreate/activate edited or missing service taxonomy. A mismatch
    // aborts provisioning; inactive taxonomy remains inactive and hidden.
    ids.set(taxonomy.key, {
      categoryId,
      subcategoryId: await subcategoryIdFor(client, categoryId, taxonomy),
    });
  }
  return ids;
}

async function seedProduct(client, businessId, product, taxonomy, counts) {
  const { rowCount } = await client.query(
    `INSERT INTO products (id, business_id, category_id, subcategory_id, slug,
       name_en, name_hi, description, brand, sku, price_paise, mrp_paise, unit,
       tags, specs, featured_selected, published, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, $8, $9, $10,
       $11, $12, $13, $14::text[], $15::jsonb, $16, $17, $18, $18)
     ON CONFLICT DO NOTHING`,
    [
      product.id,
      businessId,
      taxonomy.categoryId,
      taxonomy.subcategoryId,
      product.slug,
      product.nameEn,
      product.nameHi,
      product.description,
      product.brand,
      product.sku,
      product.pricePaise,
      product.mrpPaise,
      product.unit,
      product.tags,
      JSON.stringify(product.specs),
      product.featuredSelected,
      product.published,
      FIXTURE_CLOCK,
    ],
  );
  counts.products += rowCount;
  if (!rowCount) {
    counts.listingsSkipped += 1;
    return;
  }
  // Only new products get inventory. Never restock an existing/edited product
  // or attach fixture inventory to a slug/SKU-conflicting unrelated product.
  const inventory = await client.query(
    `INSERT INTO inventory (product_id, on_hand, low_stock_threshold,
       available_for_sale, updated_at)
     VALUES ($1::uuid, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
    [
      product.id,
      product.onHand,
      product.lowStockThreshold,
      product.availableForSale,
      FIXTURE_CLOCK,
    ],
  );
  counts.inventory += inventory.rowCount;
}

async function seedService(client, businessId, service, taxonomy, counts) {
  const { rowCount } = await client.query(
    `INSERT INTO services (id, business_id, category_id, subcategory_id, slug,
       name_en, description, price_type, price_from_paise, price_to_paise, unit,
       included, excluded, service_area, gallery_visible, status, created_at, updated_at)
     SELECT $1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::text, $6::text, $7::text,
       $8::text, $9::bigint, $10::bigint, $11::text, $12::text[], $13::text[],
       $14::text, bs.gallery_media_default, $15::text, $16::timestamptz, $16::timestamptz
     FROM business_settings bs WHERE bs.business_id = $2::uuid
     ON CONFLICT DO NOTHING`,
    [
      service.id,
      businessId,
      taxonomy.categoryId,
      taxonomy.subcategoryId,
      service.slug,
      service.nameEn,
      service.description,
      service.priceType,
      service.priceFromPaise,
      service.priceToPaise,
      service.unit,
      service.included,
      service.excluded,
      service.serviceArea,
      service.status,
      FIXTURE_CLOCK,
    ],
  );
  counts.services += rowCount;
  if (!rowCount) counts.listingsSkipped += 1;
}

export async function seedBusinessListings(
  client,
  business,
  ownerId,
  ownerHash,
  listings,
  taxonomyIds,
  counts,
) {
  // Runs for both newly inserted AND existing fixture businesses. Never
  // adopt a business by slug alone or by a conflicting owner/kind identity.
  // Lock the matched business/owner while provisioning its missing listings.
  const { rowCount } = await client.query(
    `SELECT b.id FROM businesses b JOIN users u ON u.id = b.owner_user_id
     WHERE b.id = $1::uuid AND b.owner_user_id = $2::uuid
       AND b.kind = $3 AND b.slug = $4 AND u.phone_lookup_hash = $5
       AND b.deleted_at IS NULL AND u.deleted_at IS NULL
     FOR SHARE OF b, u`,
    [business.id, ownerId, business.kind, business.slug, ownerHash],
  );
  if (!rowCount) {
    counts.listingsSkipped +=
      listings.products.length + listings.services.length;
    return;
  }
  for (const product of listings.products)
    await seedProduct(
      client,
      business.id,
      product,
      taxonomyIds.get(product.taxonomy.key),
      counts,
    );
  for (const service of listings.services)
    await seedService(
      client,
      business.id,
      service,
      taxonomyIds.get(service.taxonomy.key),
      counts,
    );
}
