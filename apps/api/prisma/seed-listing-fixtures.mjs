import { fixtureId } from './seed-fixtures.mjs';

// Reference units mapped to the Services unit allow-list.
const SERVICE_UNITS = new Map([
  ['', null],
  ['/ sq ft', 'sq_ft'],
  ['/ plate', 'plate'],
  ['/ unit', 'unit'],
  ['/ chair', 'unit'],
  ['/ month', 'month'],
]);

function invalid() {
  throw new Error('SEED_DATA_INVALID');
}

function checked(schema, value) {
  const parsed = schema.safeParse(value);
  if (!parsed.success) invalid();
  return parsed.data;
}

function text(value) {
  if (typeof value !== 'string' || !value.trim()) invalid();
  return value;
}

function integer(value) {
  if (!Number.isInteger(value) || value < 0 || value > 2147483647) invalid();
  return value;
}

function boolean(value) {
  if (typeof value !== 'boolean') invalid();
  return value;
}

function strings(values) {
  if (!Array.isArray(values)) invalid();
  return values.map(text);
}

// Convert decimal rupees exactly, without multiplying floating point values.
function paise(value, helpers) {
  if (typeof value !== 'number' || !Number.isFinite(value)) invalid();
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(value));
  if (!match) invalid();
  const amount =
    BigInt(match[1]) * 100n + BigInt((match[2] ?? '').padEnd(2, '0'));
  if (amount > BigInt(Number.MAX_SAFE_INTEGER)) invalid();
  return checked(helpers.paiseSchema, Number(amount));
}

function identity(kind, key, name, helpers) {
  if (typeof key !== 'string' || !/^[a-z0-9-]+$/.test(key)) invalid();
  const prefix = helpers.slug(text(name)).slice(0, 55).replace(/-+$/g, '');
  return {
    id: fixtureId(kind, key),
    slug: checked(helpers.slugSchema, `${prefix}-${key}`),
    nameEn: name,
  };
}

function taxonomyFor(sample, kind, categoryKey, sub, helpers) {
  const categories =
    kind === 'product' ? sample.categories : sample.serviceCategories;
  const category = categories.find((entry) => entry.id === categoryKey);
  if (!category) invalid();
  const subcategorySlug = kind === 'product' ? helpers.slug(text(sub)) : sub;
  if (
    kind === 'service' &&
    !sample.serviceSubcategories[categoryKey]?.some(
      ([name]) => helpers.slug(name) === subcategorySlug,
    )
  )
    invalid();
  return {
    key: `${kind}:${categoryKey}:${subcategorySlug}`,
    kind,
    categoryKey,
    categorySlug: checked(helpers.slugSchema, helpers.slug(category.en)),
    subcategorySlug: checked(helpers.slugSchema, subcategorySlug),
    // Product subcategories are not in the reference taxonomy migration.
    // Their source has only EN labels: keep that label, don't invent Hindi.
    subcategoryId:
      kind === 'product'
        ? fixtureId('product-subcategory', `${categoryKey}:${subcategorySlug}`)
        : null,
    name: kind === 'product' ? sub : null,
    normalizedName:
      kind === 'product' ? helpers.normalizeCatalogText(sub) : null,
  };
}

function productFor(entry, sample, helpers) {
  if (!['active', 'paused'].includes(entry.status)) invalid();
  const pricePaise = paise(entry.price, helpers);
  const mrpPaise = paise(entry.mrp, helpers);
  if (mrpPaise < pricePaise) invalid();
  if (
    !Array.isArray(entry.specs) ||
    entry.specs.some((pair) => !Array.isArray(pair) || pair.length !== 2)
  )
    invalid();
  return {
    ...identity('product', entry.id, entry.name?.en, helpers),
    businessKey: entry.bid,
    taxonomy: taxonomyFor(sample, 'product', entry.cat, entry.sub, helpers),
    nameHi: entry.name.hi ?? null,
    description: entry.desc ?? null,
    brand: entry.brand ?? null,
    sku: entry.sku ?? null,
    pricePaise,
    mrpPaise,
    unit: text(entry.unit),
    tags: strings(entry.tags),
    specs: entry.specs.map(strings),
    featuredSelected: boolean(entry.featured),
    published: entry.status === 'active',
    onHand: integer(entry.stock),
    lowStockThreshold: integer(entry.low),
    availableForSale: boolean(entry.avail),
  };
}

function servicePrice(entry, helpers) {
  if (!SERVICE_UNITS.has(entry.unit)) invalid();
  const priceType = entry.ptype === 'free' ? 'fixed' : entry.ptype;
  checked(helpers.servicePriceTypeSchema, priceType);
  if (!priceType || (entry.ptype === 'free' && entry.from !== 0)) invalid();
  const priceFromPaise =
    priceType === 'enquiry' ? null : paise(entry.from, helpers);
  const priceToPaise = priceType === 'range' ? paise(entry.to, helpers) : null;
  if (priceToPaise !== null && priceToPaise < priceFromPaise) invalid();
  return {
    priceType,
    priceFromPaise,
    priceToPaise,
    unit: SERVICE_UNITS.get(entry.unit),
  };
}

function serviceFor(entry, business, sample, helpers) {
  return {
    ...identity('service', entry.id, entry.n, helpers),
    businessKey: business.id,
    taxonomy: taxonomyFor(sample, 'service', entry.cat, entry.sub, helpers),
    // Services have only English titles in this reference.
    description: text(entry.desc),
    ...servicePrice(entry, helpers),
    included: strings(entry.incl),
    excluded: strings(entry.excl),
    serviceArea: entry.area ?? null,
    status: boolean(entry.active) ? 'active' : 'paused',
  };
}

/**
 * Source rows, not Explore cards. No emoji "images", manufactured reviews,
 * subscriptions, verified experience or checkout data. Provider expertise and
 * enquiries are seeded separately (seed-provider-data.mjs).
 */
export function buildListingFixtures(sample, helpers) {
  const businesses = [...sample.biz, ...sample.svc];
  const byBusiness = new Map(
    businesses.map((entry) => [entry.id, { products: [], services: [] }]),
  );
  if (byBusiness.size !== businesses.length) invalid();
  // Provider products inherit the provider's SERVICE category in the reference
  // (js15.js addP), but Products accepts PRODUCT categories only; skip them
  // rather than inventing a product category mapping (open issue G-24).
  const productCategories = new Set(sample.categories.map((entry) => entry.id));
  const products = sample.products
    .filter((entry) => productCategories.has(entry.cat))
    .map((entry) => productFor(entry, sample, helpers));
  const services = businesses.flatMap((business) =>
    business.services.map((entry) =>
      serviceFor(entry, business, sample, helpers),
    ),
  );
  const taxonomy = new Map();
  for (const [kind, entries] of [
    ['products', products],
    ['services', services],
  ]) {
    if (new Set(entries.map((entry) => entry.id)).size !== entries.length)
      invalid();
    if (new Set(entries.map((entry) => entry.slug)).size !== entries.length)
      invalid();
    for (const entry of entries) {
      const owner = byBusiness.get(entry.businessKey);
      if (!owner) invalid();
      owner[kind].push(entry);
      taxonomy.set(entry.taxonomy.key, entry.taxonomy);
    }
  }
  return { byBusiness, taxonomy: [...taxonomy.values()] };
}
