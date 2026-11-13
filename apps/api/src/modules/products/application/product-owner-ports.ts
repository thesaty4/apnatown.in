import type { ProductStockFilter } from '@apnatown/shared/products';
import type { TxContext } from '../../../shared/persistence/ports';

export const PRODUCT_OWNER_REPOSITORY = Symbol('PRODUCT_OWNER_REPOSITORY');
export const INVENTORY_REPOSITORY = Symbol('INVENTORY_REPOSITORY');
export const PRODUCT_PILLS_REPOSITORY = Symbol('PRODUCT_PILLS_REPOSITORY');

/** Stored `products.media` item; Media's public projection reads `assetId`. */
export interface StoredProductMedia {
  assetId: string;
  showInGallery: boolean;
}

export interface ProductSpec {
  label: string;
  value: string;
}

/** Owner-editable product columns (allow-list; never owner/slug/status). */
export interface ProductFields {
  categoryId: string;
  subcategoryId: string;
  nameEn: string;
  nameHi: string | null;
  description: string | null;
  brand: string | null;
  sku: string | null;
  pricePaise: number;
  mrpPaise: number;
  unit: string;
  tags: string[];
  specs: ProductSpec[];
  featuredSelected: boolean;
  published: boolean;
  media: StoredProductMedia[];
}

/** Inventory state; `version` is the inventory row version. */
export interface StockState {
  onHand: number;
  lowStockThreshold: number;
  availableForSale: boolean;
}

/** A new product with its first inventory row (create and import). */
export type NewProductRow = ProductFields & {
  id: string;
  businessId: string;
  slug: string;
  stock: StockState;
  at: Date;
};

export interface StoredInventory extends StockState {
  version: number;
  updatedAt: Date;
}

/** A product row (any business) with its inventory. */
export interface StoredProduct extends ProductFields {
  id: string;
  businessId: string;
  slug: string;
  taxCode: string | null;
  version: number;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  inventory: StoredInventory;
}

export interface StoredVariant {
  id: string;
  label: string;
  position: number;
}

/** Final variant list; `existing` rows are reactivated, others inserted. */
export interface VariantPlan extends StoredVariant {
  existing: boolean;
}

export interface ProductPosition {
  createdAt: string;
  id: string;
}

/** Products-owned persistence for the owner manager (F-VD-004, F-PV-005). */
export interface ProductOwnerRepository {
  /** Non-deleted products of the business, newest first; up to `limit + 1`. */
  page(
    tx: TxContext,
    input: {
      businessId: string;
      query?: string;
      stock?: ProductStockFilter;
      after?: ProductPosition;
      limit: number;
    },
  ): Promise<StoredProduct[]>;
  /**
   * Any product by id (deleted included). With `lockFor` (business id), the
   * row is locked only when that business owns it; others are read unlocked.
   */
  find(
    tx: TxContext,
    productId: string,
    lockFor?: string,
  ): Promise<StoredProduct | null>;
  /** Rows for the ids; the business's own rows are locked in stable id order. */
  findMany(
    tx: TxContext,
    productIds: readonly string[],
    businessId: string,
  ): Promise<StoredProduct[]>;
  /** Active variants in position order. */
  variants(tx: TxContext, productId: string): Promise<StoredVariant[]>;
  /** Variant rows of the product (active or not) among `ids`. */
  variantIds(
    tx: TxContext,
    productId: string,
    ids: readonly string[],
  ): Promise<string[]>;
  /** Deactivates omitted variants; reactivates/relabels kept, inserts new. */
  replaceVariants(
    tx: TxContext,
    productId: string,
    plan: readonly VariantPlan[],
  ): Promise<void>;
  /** True when another non-null-SKU product of the business uses `sku`; serialized per SKU until commit. */
  skuTaken(
    tx: TxContext,
    input: { businessId: string; sku: string; exceptProductId?: string },
  ): Promise<boolean>;
  /** Unique slug from `base`, serialized per base until commit. */
  allocateSlug(tx: TxContext, base: string): Promise<string>;
  /** Product + inventory rows in one statement pair; false on SKU race. */
  insert(tx: TxContext, row: NewProductRow): Promise<boolean>;
  /** Version-guarded full field write; bumps version; false when stale. */
  update(
    tx: TxContext,
    input: {
      productId: string;
      businessId: string;
      expectedVersion: number;
      fields: ProductFields;
      at: Date;
    },
  ): Promise<boolean>;
  /** Version-guarded soft delete; returns the new version or null when stale. */
  softDelete(
    tx: TxContext,
    input: {
      productId: string;
      businessId: string;
      expectedVersion: number;
      at: Date;
    },
  ): Promise<number | null>;
}

/** Inventory page row (non-deleted product of the business). */
export interface InventoryRow extends StoredInventory {
  productId: string;
  slug: string;
  nameEn: string;
  nameHi: string | null;
  sku: string | null;
  unit: string;
  createdAt: Date;
}

export interface InventoryRepository {
  /** Product order (newest first) keyset; up to `limit + 1` rows. */
  page(
    tx: TxContext,
    input: { businessId: string; after?: ProductPosition; limit: number },
  ): Promise<InventoryRow[]>;
  /** Version-guarded write; bumps version; null when stale. */
  update(
    tx: TxContext,
    input: StockState & {
      productId: string;
      expectedVersion: number;
      at: Date;
    },
  ): Promise<StoredInventory | null>;
  /** Locked low rows (on_hand <= threshold) of non-deleted products, id order. */
  lowRows(
    tx: TxContext,
    businessId: string,
  ): Promise<(StockState & { productId: string; version: number })[]>;
}

export interface StoredPill {
  subcategoryId: string;
  position: number;
  labelEn: string | null;
  labelHi: string | null;
  hidden: boolean;
}

export interface ProductPillsRepository {
  /** Saved preferences in position order. */
  saved(tx: TxContext, businessId: string): Promise<StoredPill[]>;
  /** Distinct subcategories of the business's non-deleted products. */
  productSubcategoryIds(tx: TxContext, businessId: string): Promise<string[]>;
  /** Replace-all; the caller holds the business row lock. */
  replace(
    tx: TxContext,
    businessId: string,
    items: readonly StoredPill[],
  ): Promise<void>;
}
