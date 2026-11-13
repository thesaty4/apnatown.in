import { catalogSlug } from '@apnatown/shared/catalog';
import {
  InventoryItemSchema,
  PRODUCT_DEFAULT_LOW_STOCK_THRESHOLD,
  PRODUCT_DEFAULT_STOCK,
  PRODUCT_MARK_IN_STOCK_QUANTITY,
  ProductOwnerListItemSchema,
  ProductOwnerSchema,
  type InventoryItem,
  type ProductInventory,
  type ProductOwner,
  type ProductCreate,
  type ProductOwnerListItem,
} from '@apnatown/shared/products';
import { DomainError } from '../../../shared/errors/errors';
import {
  capabilities,
  type StoredBusiness,
} from '../../businesses/domain/business';
import type {
  InventoryRow,
  ProductFields,
  StockState,
  StoredInventory,
  StoredProduct,
  StoredProductMedia,
  StoredVariant,
  VariantPlan,
} from './product-owner-ports';

const STOCK_MAX = 2147483647;

/** Requested inventory change; `onHand` is absolute, `delta` relative. */
export interface StockChange {
  onHand?: number | undefined;
  delta?: number | undefined;
  availableForSale?: boolean | undefined;
  lowStockThreshold?: number | undefined;
}

/**
 * Stock rules (rule 6): nonnegative integer stock; a decrement to zero marks
 * the item unavailable; marking available at zero stock sets it to 10 (Q-49,
 * prototype behaviour pending confirmation).
 */
export function applyStockChange(
  current: StockState,
  change: StockChange,
): StockState {
  let onHand = change.onHand ?? current.onHand + (change.delta ?? 0);
  if (!Number.isSafeInteger(onHand) || onHand < 0 || onHand > STOCK_MAX)
    throw new DomainError('PRODUCT_STOCK_INVALID', { field: 'onHand' });
  let availableForSale = change.availableForSale ?? current.availableForSale;
  if (
    change.availableForSale === true &&
    onHand === 0 &&
    change.onHand === undefined
  )
    onHand = PRODUCT_MARK_IN_STOCK_QUANTITY;
  else if (onHand === 0 && onHand < current.onHand) availableForSale = false;
  return {
    onHand,
    lowStockThreshold: change.lowStockThreshold ?? current.lowStockThreshold,
    availableForSale,
  };
}

/** Rule 3: price ≥ 0 (schema) and MRP ≥ price, integer paise. */
export function assertPrice(pricePaise: number, mrpPaise: number): void {
  if (mrpPaise < pricePaise)
    throw new DomainError('PRODUCT_INVALID', { field: 'mrpPaise' });
}

/** Slug base generated once from the English name (≤ 70 characters). */
export const slugBase = (nameEn: string) =>
  catalogSlug(nameEn).slice(0, 70).replace(/-+$/, '') || 'product';

/** Server-generated SKU when none is supplied (no public format contract). */
export const generatedSku = (productId: string) =>
  `SKU-${productId.replace(/-/g, '').slice(-10).toUpperCase()}`;

/** New-product inventory: rule 3 defaults with the requested overrides. */
export function newProductStock(
  inventory: ProductCreate['inventory'],
): StockState {
  return applyStockChange(
    {
      onHand: PRODUCT_DEFAULT_STOCK,
      lowStockThreshold: PRODUCT_DEFAULT_LOW_STOCK_THRESHOLD,
      availableForSale: true,
    },
    inventory ?? {},
  );
}

/** Allow-listed columns of a new product (create and import). */
export function newProductFields(
  input: ProductCreate,
  id: string,
  media: StoredProductMedia[],
): ProductFields {
  return {
    categoryId: input.categoryId,
    subcategoryId: input.subcategoryId,
    nameEn: input.nameEn,
    nameHi: input.nameHi ?? null,
    description: input.description ?? null,
    brand: input.brand ?? null,
    sku: input.sku ?? generatedSku(id),
    pricePaise: input.pricePaise,
    mrpPaise: input.mrpPaise,
    unit: input.unit,
    tags: input.tags ?? [],
    specs: input.specs ?? [],
    featuredSelected: input.featuredSelected ?? false,
    published: input.published ?? true,
    media,
  };
}

/**
 * Ordered variant labels: unique (case-insensitive); an existing `id` must
 * be one of `ownedIds` (this product's variants). New rows get `newId()`.
 */
export function planVariants(
  input: readonly { id?: string | undefined; label: string }[],
  ownedIds: ReadonlySet<string>,
  newId: () => string,
): VariantPlan[] {
  const labels = new Set<string>();
  const ids = new Set<string>();
  return input.map((item, position) => {
    const label = item.label.toLocaleLowerCase('en-IN');
    if (labels.has(label))
      throw new DomainError('PRODUCT_INVALID', { field: 'variants' });
    labels.add(label);
    if (item.id !== undefined) {
      if (!ownedIds.has(item.id) || ids.has(item.id))
        throw new DomainError('PRODUCT_INVALID', { field: 'variants' });
      ids.add(item.id);
      return { id: item.id, label: item.label, position, existing: true };
    }
    return { id: newId(), label: item.label, position, existing: false };
  });
}

export function inventoryState(row: StoredInventory): ProductInventory {
  return {
    onHand: row.onHand,
    lowStockThreshold: row.lowStockThreshold,
    availableForSale: row.availableForSale,
    lowStock: row.onHand <= row.lowStockThreshold,
    inStock: row.availableForSale && row.onHand > 0,
    version: row.version,
  };
}

function listFields(
  row: StoredProduct,
  business: StoredBusiness,
  entitled: boolean,
): ProductOwnerListItem {
  // Effective featuring is derived at read time and never stored (rule 10).
  const featured =
    row.featuredSelected &&
    row.published &&
    entitled &&
    capabilities(business, false).publicProfile;
  return {
    id: row.id,
    slug: row.slug,
    nameEn: row.nameEn,
    nameHi: row.nameHi,
    categoryId: row.categoryId,
    subcategoryId: row.subcategoryId,
    sku: row.sku,
    pricePaise: row.pricePaise,
    mrpPaise: row.mrpPaise,
    unit: row.unit,
    published: row.published,
    featuredSelected: row.featuredSelected,
    featured,
    media: row.media,
    inventory: inventoryState(row.inventory),
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function productListItemDto(
  row: StoredProduct,
  business: StoredBusiness,
  entitled: boolean,
): ProductOwnerListItem {
  return ProductOwnerListItemSchema.parse(listFields(row, business, entitled));
}

export function productOwnerDto(
  row: StoredProduct,
  variants: readonly StoredVariant[],
  business: StoredBusiness,
  entitled: boolean,
): ProductOwner {
  return ProductOwnerSchema.parse({
    ...listFields(row, business, entitled),
    businessId: row.businessId,
    description: row.description,
    brand: row.brand,
    taxCode: row.taxCode,
    tags: row.tags,
    specs: row.specs,
    variants: variants.map(({ id, label, position }) => ({
      id,
      label,
      position,
    })),
  });
}

export function inventoryItemDto(row: InventoryRow): InventoryItem {
  const state = inventoryState(row);
  return InventoryItemSchema.parse({
    productId: row.productId,
    slug: row.slug,
    nameEn: row.nameEn,
    nameHi: row.nameHi,
    sku: row.sku,
    unit: row.unit,
    onHand: state.onHand,
    lowStockThreshold: state.lowStockThreshold,
    availableForSale: state.availableForSale,
    lowStock: state.lowStock,
    inStock: state.inStock,
    version: state.version,
    updatedAt: row.updatedAt.toISOString(),
  });
}
