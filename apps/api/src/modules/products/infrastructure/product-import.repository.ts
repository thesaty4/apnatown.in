import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type { ProductImportRepository } from '../application/product-import-ports';
import type { NewProductRow } from '../application/product-owner-ports';
import {
  inventoryInsertColumns,
  inventoryValues,
  productInsertColumns,
  productValues,
} from './product-row';
import { lockSlugBases } from './product-slug-lock';

/** LIKE prefix pattern `<base>-%` with `%`, `_` and `\` escaped. */
const suffixed = (base: string) => `${base.replace(/[\\%_]/g, '\\$&')}-%`;

/** Batch import writes; parameterized SQL only (Products owns these tables). */
@Injectable()
export class PrismaProductImportRepository implements ProductImportRepository {
  constructor(private readonly db: PrismaDatabase) {}

  async existingSkus(
    tx: TxContext,
    businessId: string,
    skus: readonly string[],
  ): Promise<string[]> {
    if (!skus.length) return [];
    // Soft-deleted rows keep their SKU under the unique index.
    const rows = await this.db.client(tx).$queryRaw<{ sku: string }[]>`
      SELECT sku FROM products WHERE business_id=${businessId}::uuid
        AND sku = ANY(${[...skus]}::text[])`;
    return rows.map((row) => row.sku);
  }

  async allocateSlugs(
    tx: TxContext,
    bases: readonly string[],
  ): Promise<string[]> {
    const client = this.db.client(tx);
    const distinct = [...new Set(bases)].sort();
    if (!distinct.length) return [];
    // Same bucket keys as single create, ≤ 64 locks in ascending order.
    await lockSlugBases(client, distinct);
    // Deleted rows keep their slug (UNIQUE), so they are included.
    const rows = await client.$queryRaw<{ slug: string }[]>`
      SELECT slug FROM products WHERE slug = ANY(${distinct}::text[])
        OR slug LIKE ANY(${distinct.map(suffixed)}::text[])`;
    const taken = new Set(rows.map((row) => row.slug));
    return bases.map((base) => {
      let slug = base;
      for (let suffix = 2; taken.has(slug); suffix += 1)
        slug = `${base}-${suffix}`;
      taken.add(slug);
      return slug;
    });
  }

  async insertMany(
    tx: TxContext,
    rows: readonly NewProductRow[],
  ): Promise<boolean> {
    if (!rows.length) return true;
    const client = this.db.client(tx);
    // DO NOTHING keeps the statement from aborting on a unique race; the
    // caller rolls the whole import back when any row was skipped.
    const inserted = await client.$queryRaw<{ id: string }[]>`
      INSERT INTO products ${productInsertColumns}
      VALUES ${Prisma.join(rows.map(productValues))}
      ON CONFLICT DO NOTHING RETURNING id::text AS id`;
    if (inserted.length !== rows.length) return false;
    await client.$executeRaw`
      INSERT INTO inventory ${inventoryInsertColumns}
      VALUES ${Prisma.join(rows.map(inventoryValues))}`;
    return true;
  }
}
