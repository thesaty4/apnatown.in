import { parseRupees } from '@apnatown/shared';
import {
  PRODUCT_DEFAULT_LOW_STOCK_THRESHOLD,
  PRODUCT_DEFAULT_STOCK,
  type ProductCreate,
  type ProductOwner,
  type ProductUpdate,
} from '@apnatown/shared/products';
import { multilineError, plainError, textOrNull } from './validation';

export type MediaItem = { assetId: string; showInGallery: boolean };
export type SpecRow = { key: number; label: string; value: string };

export type Draft = {
  nameEn: string;
  nameHi: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  brand: string;
  sku: string;
  price: string;
  mrp: string;
  unit: string;
  tags: string;
  variants: string;
  specs: SpecRow[];
  onHand: string;
  lowStockThreshold: string;
  availableForSale: boolean;
  published: boolean;
  featuredSelected: boolean;
  media: MediaItem[];
};

/** Field ids in visual order: the first invalid one receives focus. */
export const FIELD_ORDER = [
  'nameEn',
  'nameHi',
  'description',
  'categoryId',
  'subcategoryId',
  'brand',
  'price',
  'mrp',
  'unit',
  'sku',
  'onHand',
  'lowStockThreshold',
  'variants',
  'tags',
  'specs',
  'media',
  'featuredSelected',
] as const;
export type FieldName = (typeof FIELD_ORDER)[number];
/** `products.validation.*` key per invalid field. */
export type FieldErrors = Partial<Record<FieldName, string>>;

const STOCK_MAX = 2147483647;

/** Integer paise → plain rupee input text (no grouping, ≤ 2 decimals). */
export function paiseToInput(paise: number) {
  const rupees = Math.floor(paise / 100);
  const rest = paise % 100;
  return rest === 0 ? String(rupees) : `${rupees}.${String(rest).padStart(2, '0')}`;
}

/** Strict rupees → paise (shared parser); commas/₹ the owner types are dropped. */
export const inputToPaise = (value: string) =>
  parseRupees(value.replace(/[₹,\s]/gu, ''));

const list = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

let specKey = 0;
export const newSpec = (label = '', value = ''): SpecRow => ({
  key: ++specKey,
  label,
  value,
});

export function emptyDraft(categoryId = ''): Draft {
  return {
    nameEn: '',
    nameHi: '',
    description: '',
    categoryId,
    subcategoryId: '',
    brand: '',
    sku: '',
    price: '',
    mrp: '',
    unit: '',
    tags: '',
    variants: '',
    specs: [],
    onHand: String(PRODUCT_DEFAULT_STOCK),
    lowStockThreshold: String(PRODUCT_DEFAULT_LOW_STOCK_THRESHOLD),
    availableForSale: true,
    published: true,
    featuredSelected: false,
    media: [],
  };
}

export function fromProduct(product: ProductOwner): Draft {
  return {
    nameEn: product.nameEn,
    nameHi: product.nameHi ?? '',
    description: product.description ?? '',
    categoryId: product.categoryId,
    subcategoryId: product.subcategoryId,
    brand: product.brand ?? '',
    sku: product.sku ?? '',
    price: paiseToInput(product.pricePaise),
    mrp: paiseToInput(product.mrpPaise),
    unit: product.unit,
    tags: product.tags.join(', '),
    variants: [...product.variants]
      .sort((a, b) => a.position - b.position)
      .map((variant) => variant.label)
      .join(', '),
    specs: product.specs.map((spec) => newSpec(spec.label, spec.value)),
    onHand: String(product.inventory.onHand),
    lowStockThreshold: String(product.inventory.lowStockThreshold),
    availableForSale: product.inventory.availableForSale,
    published: product.published,
    featuredSelected: product.featuredSelected,
    media: product.media.map((item) => ({ ...item })),
  };
}

const stockError = (value: string) =>
  /^\d{1,10}$/u.test(value.trim()) && Number(value) <= STOCK_MAX
    ? undefined
    : 'wholeNumber';

export function validate(draft: Draft): FieldErrors {
  const errors: FieldErrors = {};
  const set = (field: FieldName, key: string | undefined) => {
    if (key && !errors[field]) errors[field] = key;
  };
  set('nameEn', plainError(draft.nameEn, 120, true));
  set('nameHi', plainError(draft.nameHi, 120, false));
  set('description', multilineError(draft.description, 2000));
  if (!draft.categoryId) set('categoryId', 'required');
  if (!draft.subcategoryId) set('subcategoryId', 'required');
  set('brand', plainError(draft.brand, 80, false));
  set('sku', plainError(draft.sku, 64, false));
  set('unit', plainError(draft.unit, 40, true));
  const price = inputToPaise(draft.price.trim());
  if (!draft.price.trim()) set('price', 'required');
  else if (price === null) set('price', 'money');
  if (draft.mrp.trim()) {
    const mrp = inputToPaise(draft.mrp.trim());
    if (mrp === null) set('mrp', 'money');
    else if (price !== null && mrp < price) set('mrp', 'mrpBelowPrice');
  }
  set('onHand', stockError(draft.onHand));
  set('lowStockThreshold', stockError(draft.lowStockThreshold));
  const tags = list(draft.tags);
  if (tags.length > 20) set('tags', 'tooManyTags');
  for (const tag of tags) set('tags', plainError(tag, 40, true));
  const variants = list(draft.variants);
  if (variants.length > 20) set('variants', 'tooManyVariants');
  for (const variant of variants) set('variants', plainError(variant, 60, true));
  const specs = draft.specs.filter((row) => row.label.trim() || row.value.trim());
  if (specs.length > 30) set('specs', 'tooManySpecs');
  for (const row of specs) {
    set('specs', plainError(row.label, 60, true));
    set('specs', plainError(row.value, 200, true));
  }
  return errors;
}

/** Discount shown next to MRP; undefined when there is none. */
export function discountPercent(draft: Pick<Draft, 'price' | 'mrp'>) {
  const price = inputToPaise(draft.price.trim());
  const mrp = inputToPaise(draft.mrp.trim());
  if (price === null || mrp === null || mrp <= price || mrp === 0) return undefined;
  return Math.floor(((mrp - price) * 100) / mrp);
}

function common(draft: Draft) {
  const pricePaise = inputToPaise(draft.price.trim()) ?? 0;
  return {
    nameEn: draft.nameEn.trim(),
    nameHi: textOrNull(draft.nameHi),
    description: textOrNull(draft.description),
    categoryId: draft.categoryId,
    subcategoryId: draft.subcategoryId,
    brand: textOrNull(draft.brand),
    // Blank SKU: the server generates one.
    sku: textOrNull(draft.sku),
    pricePaise,
    // Blank MRP means "sold at MRP".
    mrpPaise: draft.mrp.trim()
      ? (inputToPaise(draft.mrp.trim()) ?? pricePaise)
      : pricePaise,
    unit: draft.unit.trim(),
    tags: list(draft.tags),
    specs: draft.specs
      .filter((row) => row.label.trim() || row.value.trim())
      .map((row) => ({ label: row.label.trim(), value: row.value.trim() })),
    published: draft.published,
    media: draft.media,
  };
}

export function toCreate(draft: Draft): ProductCreate {
  return {
    ...common(draft),
    variants: list(draft.variants).map((label) => ({ label })),
    ...(draft.featuredSelected && { featuredSelected: true }),
    inventory: {
      onHand: Number(draft.onHand),
      lowStockThreshold: Number(draft.lowStockThreshold),
      availableForSale: draft.availableForSale,
    },
  };
}

/** Full editable patch with the product version; inventory only when changed
 * (with its own inventory version); featured only when the owner changed it,
 * so a retained selection never re-trips the entitlement check. */
export function toUpdate(draft: Draft, product: ProductOwner): ProductUpdate {
  const ids = new Map(product.variants.map((v) => [v.label, v.id]));
  const onHand = Number(draft.onHand);
  const lowStockThreshold = Number(draft.lowStockThreshold);
  const stock = product.inventory;
  const inventoryChanged =
    onHand !== stock.onHand ||
    lowStockThreshold !== stock.lowStockThreshold ||
    draft.availableForSale !== stock.availableForSale;
  return {
    ...common(draft),
    variants: list(draft.variants).map((label) => {
      const id = ids.get(label);
      return id ? { id, label } : { label };
    }),
    ...(draft.featuredSelected !== product.featuredSelected && {
      featuredSelected: draft.featuredSelected,
    }),
    ...(inventoryChanged && {
      inventory: {
        onHand,
        lowStockThreshold,
        availableForSale: draft.availableForSale,
        expectedVersion: stock.version,
      },
    }),
    expectedVersion: product.version,
  };
}

/** Server `details.field` (e.g. `pricePaise`, `inventory.onHand`, `tags.3`)
 * → the editor field that shows it. */
export function serverField(field: string | undefined): FieldName | undefined {
  if (!field) return undefined;
  const head = field.replace(/^inventory\./u, '').split(/[.[]/u)[0] ?? '';
  const alias: Record<string, FieldName> = {
    pricePaise: 'price',
    mrpPaise: 'mrp',
    featured: 'featuredSelected',
  };
  const name = alias[head] ?? head;
  return (FIELD_ORDER as readonly string[]).includes(name)
    ? (name as FieldName)
    : undefined;
}
