import { createRequire } from 'node:module';
import { FIXTURE_CLOCK, fixtureId } from './seed-fixtures.mjs';
import { seedReference } from './seed-context.mjs';

const require = createRequire(import.meta.url);
const catalog = require('@apnatown/shared/catalog');

function checked(schema, input) {
  const result = schema.safeParse(input);
  if (!result.success) throw new Error('SEED_DATA_INVALID');
  return result.data;
}

async function preserved(client, sql, parameters) {
  const { rows } = await client.query(sql, parameters);
  if (rows.length > 1 || rows.some((row) => !row.matches))
    throw new Error('SEED_REFERENCE_CONFLICT');
  return rows.length === 1;
}

async function categoryReferences(client, sample) {
  const ids = new Map();
  for (const [kind, entries] of [
    ['product', sample.categories], ['service', sample.serviceCategories],
  ]) {
    for (const entry of entries) {
      const slug = catalog.catalogSlug(entry.en);
      const { rows } = await client.query(
        `SELECT id, id = md5('apnatown:catalog:category:' || $1::text)::uuid
           AND slug = $2 AND kind = $3 AS matches
         FROM categories WHERE slug = $2
           OR id = md5('apnatown:catalog:category:' || $1::text)::uuid`,
        [entry.id, slug, kind],
      );
      if (rows.length !== 1 || !rows[0].matches)
        throw new Error('SEED_REFERENCE_CONFLICT');
      ids.set(entry.id, rows[0].id);
    }
  }
  return ids;
}

async function activeCategories(client, ids, kind) {
  const { rows } = await client.query(
    `SELECT id FROM categories WHERE id = ANY($1::uuid[])
       AND active AND kind = $2`, [ids, kind],
  );
  if (rows.length !== new Set(ids).size)
    throw new Error('SEED_REFERENCE_CONFLICT');
}

async function seedHomeSections(client, context, categories, counts) {
  const creator = seedReference(context.users, 'super_admin');
  const categoryId = seedReference(categories, 'wedding');
  const pills = ['electrician', 'plumber', 'mechanic'].map((key, position) => ({
    categoryId: seedReference(categories, key), position,
  }));
  const examples = [
    { key: 'wedding-local-example', kind: 'single_category',
      contentKind: 'service', categoryId, position: 9000 },
    { key: 'services-local-example', kind: 'curated_categories',
      contentKind: 'service', headingEn: 'LOCAL sample services',
      headingHi: 'स्थानीय नमूना सेवाएँ', categories: pills,
      initialCategoryId: pills[0].categoryId, position: 9001 },
  ];
  for (const { key, ...input } of examples) {
    const id = fixtureId('catalog-home-section', key);
    const section = checked(catalog.CreateHomeSectionSchema, input);
    if (await preserved(client,
      `SELECT id = $1::uuid AND kind = $2 AND content_kind = $3
         AND created_by = $4::uuid AND created_at = $5::timestamptz AS matches
       FROM catalog_home_sections WHERE id = $1::uuid OR
         (kind = 'single_category' AND category_id = $6::uuid AND removed_at IS NULL)`,
      [id, section.kind, section.contentKind, creator, FIXTURE_CLOCK,
        section.categoryId ?? null])) continue;
    await activeCategories(client, section.categories?.map((item) =>
      item.categoryId) ?? [section.categoryId], section.contentKind);
    const result = await client.query(
      `INSERT INTO catalog_home_sections (id, kind, content_kind, category_id,
         heading_en, heading_hi, initial_category_id, position, active,
         created_by, updated_by, created_at, updated_at)
       VALUES ($1::uuid, $2, $3, $4::uuid, $5, $6, $7::uuid, $8,
         FALSE, $9::uuid, $9::uuid, $10, $10)`,
      [id, section.kind, section.contentKind, section.categoryId ?? null,
        section.headingEn ?? null, section.headingHi ?? null,
        section.initialCategoryId ?? null, section.position, creator, FIXTURE_CLOCK],
    );
    counts.catalog_home_sections += result.rowCount;
    // Drafts, not invented publication decisions. Never refill an edited or
    // removed aggregate's pills, and never attach pills to a dedicated section.
    for (const pill of section.categories ?? []) {
      const inserted = await client.query(
        `INSERT INTO catalog_home_section_categories (section_id, category_id, position)
         VALUES ($1::uuid, $2::uuid, $3)`, [id, pill.categoryId, pill.position],
      );
      counts.catalog_home_section_categories += inserted.rowCount;
    }
  }
}

async function seedSuggestions(client, context, categories) {
  const dairy = context.sample.subs.find((entry) => entry.id === 'sb2');
  if (!dairy || dairy.status !== 'pending' || dairy.bid !== 'b1')
    throw new Error('SEED_DATA_INVALID');
  const examples = [
    { key: dairy.id, businessKey: dairy.bid, categoryKey: dairy.main,
      nameEn: dairy.en, nameHi: dairy.hi,
      reason: 'LOCAL/TEST sample suggestion; no approval is implied.' },
    // sb3 already exists in the reference taxonomy (Inverter & Battery).
    // Use a plainly synthetic pending proposal, not a duplicate or fake review.
    { key: 'solar-inverter-local-example', businessKey: 's5',
      categoryKey: 'electrician', nameEn: 'Solar Inverter Servicing',
      nameHi: 'सोलर इन्वर्टर सर्विसिंग',
      reason: 'LOCAL/TEST synthetic suggestion for the pending review queue.' },
  ];
  let count = 0;
  for (const example of examples) {
    const id = fixtureId('subcategory-suggestion', example.key);
    const businessId = seedReference(context.businesses, example.businessKey);
    const submitter = seedReference(context.users, example.businessKey);
    const categoryId = seedReference(categories, example.categoryKey);
    const input = checked(catalog.SuggestSubcategorySchema, {
      categoryId, nameEn: example.nameEn, nameHi: example.nameHi,
      reason: example.reason, allowSimilar: true,
    });
    const normalized = catalog.normalizeCatalogText(input.nameEn);
    if (await preserved(client,
      `SELECT id = $1::uuid AND business_id = $2::uuid
         AND submitter_user_id = $3::uuid AND category_id = $4::uuid
         AND created_at = $6::timestamptz AS matches
       FROM subcategory_suggestions WHERE id = $1::uuid OR
         (category_id = $4::uuid AND normalized_name = unaccent($5::text)
           AND status = 'pending')`,
      [id, businessId, submitter, categoryId, normalized, FIXTURE_CLOCK])) continue;
    const { rows } = await client.query(
      `WITH names AS (
         SELECT unaccent(value) AS name FROM unnest($4::text[]) AS n(value)
       )
       SELECT b.city_id, b.area_id FROM businesses b
       JOIN categories c ON c.id = $3::uuid AND c.active
         AND c.kind = CASE WHEN b.kind = 'shop' THEN 'product' ELSE 'service' END
       WHERE b.id = $1::uuid AND b.owner_user_id = $2::uuid
         AND b.deleted_at IS NULL AND b.city_id IS NOT NULL AND b.area_id IS NOT NULL
         AND b.status IN ('draft', 'pending', 'approved', 'rejected', 'changes_requested')
         AND NOT EXISTS (SELECT 1 FROM subcategories s
           WHERE s.category_id = c.id AND (
             s.normalized_name IN (SELECT name FROM names)
             OR unaccent(regexp_replace(btrim(lower(normalize(s.name_hi, NFKC))),
               '\\s+', ' ', 'g')) IN (SELECT name FROM names)
             OR s.slug = $5))`,
      [businessId, submitter, categoryId,
        [input.nameEn, input.nameHi].filter(Boolean).map(catalog.normalizeCatalogText),
        catalog.catalogSlug(input.nameEn)],
    );
    if (rows.length !== 1) throw new Error('SEED_REFERENCE_CONFLICT');
    const result = await client.query(
      `INSERT INTO subcategory_suggestions (id, business_id, submitter_user_id,
         city_id, area_id, category_id, name_en, name_hi, normalized_name,
         reason, status, created_at, updated_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6::uuid,
         $7, $8, unaccent($9::text), $10, 'pending', $11, $11)`,
      [id, businessId, submitter, rows[0].city_id, rows[0].area_id, categoryId,
        input.nameEn, input.nameHi, normalized, input.reason, FIXTURE_CLOCK],
    );
    count += result.rowCount;
  }
  return count;
}

function subcategoryKey(sample, mapping, slug) {
  const parents = Object.entries(sample.serviceSubcategories).filter(([, names]) =>
    names.some(([name]) => catalog.catalogSlug(name) === slug));
  // Sample k7 explicitly says "Electrician services". The bare slug also
  // exists under Mechanic: qualify it, never attach by slug/first match.
  if (mapping.key === 'electrician' && slug === 'appliance-repair' &&
      parents.some(([key]) => key === 'electrician')) return 'electrician';
  if (parents.length !== 1) throw new Error('SEED_REFERENCE_CONFLICT');
  return parents[0][0];
}

async function keywordTargets(client, sample, mapping, categories) {
  const targets = [];
  for (const key of new Set([...mapping.shopCats, ...mapping.pcats])) {
    const categoryId = seedReference(categories, key);
    await activeCategories(client, [categoryId], 'product');
    targets.push({ kind: 'category', categoryId });
  }
  for (const slug of new Set(mapping.subs)) {
    const key = subcategoryKey(sample, mapping, slug);
    const categoryId = seedReference(categories, key);
    const { rows } = await client.query(
      `SELECT s.id, s.id = md5('apnatown:catalog:subcategory:' || $2::text
         || ':' || $3::text)::uuid AND s.category_id = $1::uuid
         AND s.slug = $3 AND s.active AND c.active AND c.kind = 'service' AS matches
       FROM subcategories s JOIN categories c ON c.id = s.category_id
       WHERE (s.category_id = $1::uuid AND s.slug = $3)
         OR s.id = md5('apnatown:catalog:subcategory:' || $2::text || ':' || $3::text)::uuid`,
      [categoryId, key, slug],
    );
    if (rows.length !== 1 || !rows[0].matches)
      throw new Error('SEED_REFERENCE_CONFLICT');
    targets.push({ kind: 'subcategory', subcategoryId: rows[0].id });
  }
  for (const productTag of new Set(mapping.tags.map(catalog.normalizeCatalogText)))
    targets.push({ kind: 'product_tag', productTag });
  return targets;
}

async function keywordTerms(client, mapping) {
  const raw = [mapping.key, ...mapping.syn];
  const { rows } = await client.query(
    `SELECT term, unaccent(normalized) AS normalized
     FROM unnest($1::text[], $2::text[]) WITH ORDINALITY AS t(term, normalized, n)
     ORDER BY n`,
    [raw, raw.map(catalog.normalizeCatalogText)],
  );
  // The sample repeats its primary term in syn. Deduplicate after the exact
  // shared NFKC normalization + database unaccent used by the writer/reader.
  const unique = new Map();
  for (const row of rows) {
    if (!row.normalized) throw new Error('SEED_DATA_INVALID');
    if (!unique.has(row.normalized)) unique.set(row.normalized, row);
  }
  return [...unique.values()];
}

async function seedKeywordChildren(client, id, terms, targets, counts) {
  for (const [index, term] of terms.entries()) {
    const result = await client.query(
      `INSERT INTO keyword_mapping_terms
         (id, mapping_id, term, normalized_term, kind, created_at)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6)`,
      [fixtureId('keyword-term', `${id}:${term.normalized}`), id,
        term.term, term.normalized, index === 0 ? 'primary' : 'synonym', FIXTURE_CLOCK],
    );
    counts.keyword_mapping_terms += result.rowCount;
  }
  for (const target of targets) {
    const key = target.categoryId ?? target.subcategoryId ?? target.productTag;
    const result = await client.query(
      `INSERT INTO keyword_mapping_targets
         (id, mapping_id, target_kind, category_id, subcategory_id, product_tag)
       VALUES ($1::uuid, $2::uuid, $3, $4::uuid, $5::uuid, $6)`,
      [fixtureId('keyword-target', `${id}:${target.kind}:${key}`), id, target.kind,
        target.categoryId ?? null, target.subcategoryId ?? null, target.productTag ?? null],
    );
    counts.keyword_mapping_targets += result.rowCount;
  }
}

async function seedKeywords(client, context, categories, counts) {
  for (const mapping of context.sample.kw) {
    const id = fixtureId('keyword-mapping', mapping.id);
    if (await preserved(client,
      `SELECT created_at = $2::timestamptz AS matches
       FROM keyword_mappings WHERE id = $1::uuid`, [id, FIXTURE_CLOCK])) continue;
    const terms = await keywordTerms(client, mapping);
    const input = checked(catalog.CreateKeywordMappingSchema, {
      canonicalTerm: terms[0]?.term,
      synonyms: terms.slice(1).map((term) => term.term),
      targets: await keywordTargets(client, context.sample, mapping, categories),
    });
    const taken = await client.query(
      `SELECT id FROM keyword_mapping_terms WHERE normalized_term = ANY($1::text[])`,
      [terms.map((term) => term.normalized)],
    );
    if (taken.rows.length) throw new Error('SEED_REFERENCE_CONFLICT');
    const result = await client.query(
      `INSERT INTO keyword_mappings (id, enabled, created_at, updated_at)
       VALUES ($1::uuid, TRUE, $2, $2)`, [id, FIXTURE_CLOCK],
    );
    counts.keyword_mappings += result.rowCount;
    // Only the newly inserted aggregate receives terms/targets. Existing
    // disabled, renamed or otherwise edited mappings stay completely intact.
    await seedKeywordChildren(client, id, terms, input.targets, counts);
  }
}

/**
 * Caller owns LOCAL/TEST guards, transaction and seed serialization.
 * category_relations already has all 19 directed prototype RELP/RELS rows
 * in 20261112081000_catalog_reference_seed. Do not restore deleted links,
 * infer reverse links or overwrite operator ordering.
 */
export async function seedCatalogData(client, context) {
  const counts = { category_relations: 0, catalog_home_sections: 0,
    catalog_home_section_categories: 0, subcategory_suggestions: 0,
    keyword_mappings: 0, keyword_mapping_terms: 0, keyword_mapping_targets: 0 };
  try {
    const categories = await categoryReferences(client, context.sample);
    await seedHomeSections(client, context, categories, counts);
    counts.subcategory_suggestions = await seedSuggestions(client, context, categories);
    await seedKeywords(client, context, categories, counts);
    return counts;
  } catch (error) {
    if (error.code === '23505') throw new Error('SEED_REFERENCE_CONFLICT');
    throw error;
  }
}
