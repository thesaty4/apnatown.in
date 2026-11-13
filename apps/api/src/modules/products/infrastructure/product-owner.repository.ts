import { Injectable } from '@nestjs/common';
import type { ProductStockFilter } from '@apnatown/shared/products';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  NewProductRow,
  ProductFields,
  ProductOwnerRepository,
  ProductPosition,
  StoredProduct,
  StoredVariant,
  VariantPlan,
} from '../application/product-owner-ports';
import {
  inventoryInsertColumns,
  inventoryValues,
  mediaJson,
  productColumns,
  productInsertColumns,
  productValues,
  specsJson,
  storedProduct,
  type ProductRow,
} from './product-row';
import { lockSlugBases } from './product-slug-lock';

/** LIKE pattern with `%`, `_` and `\` escaped (default ESCAPE '\'). */
const contains = (text: string) => `%${text.replace(/[\\%_]/g, '\\$&')}%`;

const stockFilter = (stock: ProductStockFilter | undefined) => {
  if (stock === 'low') return Prisma.sql`AND i.on_hand <= i.low_stock_threshold`;
  if (stock === 'out_of_stock')
    return Prisma.sql`AND NOT (i.available_for_sale AND i.on_hand > 0)`;
  return Prisma.empty;
};

/** Parameterized SQL only; Products owns products/inventory/variants. */
@Injectable()
export class PrismaProductOwnerRepository implements ProductOwnerRepository {
  constructor(private readonly db: PrismaDatabase) {}

  async page(
    tx: TxContext,
    input: {
      businessId: string;
      query?: string;
      stock?: ProductStockFilter;
      after?: ProductPosition;
      limit: number;
    },
  ): Promise<StoredProduct[]> {
    const query = input.query
      ? Prisma.sql`AND (p.name_en ILIKE ${contains(input.query)}
          OR p.name_hi ILIKE ${contains(input.query)} OR p.sku ILIKE ${contains(input.query)})`
      : Prisma.empty;
    const after = input.after
      ? Prisma.sql`AND (p.created_at,p.id) < (${input.after.createdAt}::timestamptz,${input.after.id}::uuid)`
      : Prisma.empty;
    const rows = await this.db.client(tx).$queryRaw<ProductRow[]>`
      SELECT ${productColumns} FROM products p JOIN inventory i ON i.product_id=p.id
      WHERE p.business_id=${input.businessId}::uuid AND p.deleted_at IS NULL
        ${query} ${stockFilter(input.stock)} ${after}
      ORDER BY p.created_at DESC,p.id DESC
      LIMIT ${input.limit + 1}`;
    return rows.map(storedProduct);
  }

  async find(
    tx: TxContext,
    productId: string,
    lockFor?: string,
  ): Promise<StoredProduct | null> {
    const client = this.db.client(tx);
    if (lockFor) {
      const locked = await client.$queryRaw<ProductRow[]>`
        SELECT ${productColumns} FROM products p JOIN inventory i ON i.product_id=p.id
        WHERE p.id=${productId}::uuid AND p.business_id=${lockFor}::uuid
        FOR UPDATE OF p,i`;
      if (locked[0]) return storedProduct(locked[0]);
    }
    const rows = await client.$queryRaw<ProductRow[]>`
      SELECT ${productColumns} FROM products p JOIN inventory i ON i.product_id=p.id
      WHERE p.id=${productId}::uuid`;
    return rows[0] ? storedProduct(rows[0]) : null;
  }

  async findMany(
    tx: TxContext,
    productIds: readonly string[],
    businessId: string,
  ): Promise<StoredProduct[]> {
    const client = this.db.client(tx);
    const owned = await client.$queryRaw<ProductRow[]>`
      SELECT ${productColumns} FROM products p JOIN inventory i ON i.product_id=p.id
      WHERE p.id = ANY(${[...productIds]}::uuid[]) AND p.business_id=${businessId}::uuid
      ORDER BY p.id FOR UPDATE OF p,i`;
    const seen = new Set(owned.map((row) => row.id));
    const rest = productIds.filter((id) => !seen.has(id));
    // Unowned ids are read unlocked only so callers can report NOT_OWNED.
    const others = rest.length
      ? await client.$queryRaw<ProductRow[]>`
      SELECT ${productColumns} FROM products p JOIN inventory i ON i.product_id=p.id
      WHERE p.id = ANY(${rest}::uuid[])`
      : [];
    return [...owned, ...others].map(storedProduct);
  }

  variants(tx: TxContext, productId: string): Promise<StoredVariant[]> {
    return this.db.client(tx).$queryRaw<StoredVariant[]>`
      SELECT id::text AS id,label,position FROM product_variants
      WHERE product_id=${productId}::uuid AND active ORDER BY position`;
  }

  async variantIds(
    tx: TxContext,
    productId: string,
    ids: readonly string[],
  ): Promise<string[]> {
    if (!ids.length) return [];
    const rows = await this.db.client(tx).$queryRaw<{ id: string }[]>`
      SELECT id::text AS id FROM product_variants
      WHERE product_id=${productId}::uuid AND id = ANY(${[...ids]}::uuid[])`;
    return rows.map((row) => row.id);
  }

  async replaceVariants(
    tx: TxContext,
    productId: string,
    plan: readonly VariantPlan[],
  ): Promise<void> {
    const client = this.db.client(tx);
    // Deactivate first so kept rows can take any label/position under the
    // partial unique indexes; referenced variants are never hard-deleted.
    await client.$executeRaw`
      UPDATE product_variants SET active=false
      WHERE product_id=${productId}::uuid AND active`;
    for (const item of plan) {
      if (item.existing)
        await client.$executeRaw`
          UPDATE product_variants SET label=${item.label},position=${item.position},active=true
          WHERE id=${item.id}::uuid AND product_id=${productId}::uuid`;
      else
        await client.$executeRaw`
          INSERT INTO product_variants (id,product_id,label,position,active)
          VALUES (${item.id}::uuid,${productId}::uuid,${item.label},${item.position},true)`;
    }
  }

  async skuTaken(
    tx: TxContext,
    input: { businessId: string; sku: string; exceptProductId?: string },
  ): Promise<boolean> {
    const client = this.db.client(tx);
    // Serializes concurrent writers of the same business SKU until commit.
    await client.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtextextended(${`product.sku:${input.businessId}:${input.sku}`}, 0))`;
    const except = input.exceptProductId
      ? Prisma.sql`AND id <> ${input.exceptProductId}::uuid`
      : Prisma.empty;
    // Soft-deleted rows keep their SKU under the unique index.
    const rows = await client.$queryRaw<{ taken: boolean }[]>`
      SELECT EXISTS(SELECT 1 FROM products WHERE business_id=${input.businessId}::uuid
        AND sku=${input.sku} ${except}) AS taken`;
    return rows[0]?.taken === true;
  }

  async allocateSlug(tx: TxContext, base: string): Promise<string> {
    const client = this.db.client(tx);
    // Serializes creates/imports sharing a slug base (bucket) until commit.
    await lockSlugBases(client, [base]);
    // Deleted rows keep their slug (UNIQUE), so they are included.
    const rows = await client.$queryRaw<{ slug: string }[]>`
      SELECT slug FROM products WHERE slug=${base} OR slug LIKE ${`${base.replace(/[\\%_]/g, '\\$&')}-%`}`;
    const taken = new Set(rows.map((row) => row.slug));
    if (!taken.has(base)) return base;
    for (let suffix = 2; ; suffix += 1) {
      const candidate = `${base}-${suffix}`;
      if (!taken.has(candidate)) return candidate;
    }
  }

  async insert(tx: TxContext, row: NewProductRow): Promise<boolean> {
    const client = this.db.client(tx);
    // DO NOTHING keeps the transaction usable on a unique race.
    const inserted = await client.$queryRaw<{ id: string }[]>`
      INSERT INTO products ${productInsertColumns} VALUES ${productValues(row)}
      ON CONFLICT DO NOTHING RETURNING id::text AS id`;
    if (!inserted.length) return false;
    await client.$executeRaw`
      INSERT INTO inventory ${inventoryInsertColumns} VALUES ${inventoryValues(row)}`;
    return true;
  }

  async update(
    tx: TxContext,
    input: {
      productId: string;
      businessId: string;
      expectedVersion: number;
      fields: ProductFields;
      at: Date;
    },
  ): Promise<boolean> {
    const f = input.fields;
    const count = await this.db.client(tx).$executeRaw`
      UPDATE products SET category_id=${f.categoryId}::uuid,subcategory_id=${f.subcategoryId}::uuid,
        name_en=${f.nameEn},name_hi=${f.nameHi},description=${f.description},brand=${f.brand},
        sku=${f.sku},price_paise=${f.pricePaise}::bigint,mrp_paise=${f.mrpPaise}::bigint,
        unit=${f.unit},tags=${f.tags}::text[],specs=${specsJson(f)}::jsonb,
        featured_selected=${f.featuredSelected},published=${f.published},
        media=${mediaJson(f)}::jsonb,version=version+1,updated_at=${input.at}
      WHERE id=${input.productId}::uuid AND business_id=${input.businessId}::uuid
        AND version=${input.expectedVersion} AND deleted_at IS NULL`;
    return count === 1;
  }

  async softDelete(
    tx: TxContext,
    input: {
      productId: string;
      businessId: string;
      expectedVersion: number;
      at: Date;
    },
  ): Promise<number | null> {
    const rows = await this.db.client(tx).$queryRaw<{ version: number }[]>`
      UPDATE products SET deleted_at=${input.at},version=version+1,updated_at=${input.at}
      WHERE id=${input.productId}::uuid AND business_id=${input.businessId}::uuid
        AND version=${input.expectedVersion} AND deleted_at IS NULL
      RETURNING version`;
    return rows[0]?.version ?? null;
  }
}
