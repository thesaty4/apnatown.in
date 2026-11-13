import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  CategoryChange,
  CategoryFilter,
  SimilarSubcategory,
  StoredCategory,
  StoredRelation,
  StoredSubcategory,
  SubcategoryChange,
  SubcategoryFilter,
  TaxonomyRepository,
} from '../domain/catalog.repository';
import { anyIds, timestamp } from './sql';

const categoryColumns = Prisma.sql`
  c.id, c.kind, c.slug, c.name_en AS "nameEn", c.name_hi AS "nameHi", c.icon,
  c.image_asset_id AS "imageAssetId", c.active, c.sort_order AS "sortOrder",
  c.version, ${timestamp('c.created_at')} AS "createdAt",
  ${timestamp('c.updated_at')} AS "updatedAt"`;
const subcategoryColumns = Prisma.sql`
  s.id, s.category_id AS "categoryId", s.slug, s.name_en AS "nameEn",
  s.name_hi AS "nameHi", s.normalized_name AS "normalizedName",
  s.service_types AS "serviceTypes", s.image_asset_id AS "imageAssetId",
  s.active, s.sort_order AS "sortOrder", s.version,
  ${timestamp('s.created_at')} AS "createdAt",
  ${timestamp('s.updated_at')} AS "updatedAt"`;

/** `column = value` only when the key was supplied (null is a real value). */
const assign = (
  column: string,
  supplied: boolean,
  value: Prisma.Sql,
): Prisma.Sql =>
  supplied ? Prisma.sql`${Prisma.raw(column)} = ${value},` : Prisma.empty;

@Injectable()
export class PrismaTaxonomyRepository implements TaxonomyRepository {
  constructor(private readonly database: PrismaDatabase) {}

  async unaccent(tx: TxContext, values: readonly string[]): Promise<string[]> {
    if (!values.length) return [];
    const rows = await this.database.client(tx).$queryRaw<
      { value: string }[]
    >(Prisma.sql`
      SELECT unaccent(v) AS value
      FROM unnest(${[...values]}::text[]) WITH ORDINALITY AS input(v, n)
      ORDER BY n`);
    return rows.map((row) => row.value);
  }

  listCategories(
    tx: TxContext,
    filter: CategoryFilter,
  ): Promise<StoredCategory[]> {
    return this.database.client(tx).$queryRaw<StoredCategory[]>(Prisma.sql`
      SELECT ${categoryColumns} FROM categories c
      WHERE TRUE
        ${filter.kind ? Prisma.sql`AND c.kind = ${filter.kind}` : Prisma.empty}
        ${filter.activeOnly ? Prisma.sql`AND c.active` : Prisma.empty}
        ${filter.ids ? Prisma.sql`AND ${anyIds('c.id', filter.ids)}` : Prisma.empty}
      ORDER BY c.kind, c.sort_order, c.name_en, c.id`);
  }

  async findCategory(
    tx: TxContext,
    id: string,
    lock = false,
  ): Promise<StoredCategory | null> {
    const rows = await this.database.client(tx).$queryRaw<StoredCategory[]>(
      Prisma.sql`SELECT ${categoryColumns} FROM categories c
        WHERE c.id = ${id}::uuid
        ${lock ? Prisma.sql`FOR UPDATE OF c` : Prisma.empty}`,
    );
    return rows[0] ?? null;
  }

  async findCategoryBySlug(
    tx: TxContext,
    slug: string,
  ): Promise<StoredCategory | null> {
    const rows = await this.database.client(tx).$queryRaw<StoredCategory[]>(
      Prisma.sql`SELECT ${categoryColumns} FROM categories c
        WHERE c.slug = ${slug}`,
    );
    return rows[0] ?? null;
  }

  async insertCategory(
    tx: TxContext,
    row: Omit<StoredCategory, 'version' | 'createdAt' | 'updatedAt'> & {
      at: Date;
    },
  ): Promise<boolean> {
    const count = await this.database.client(tx).$executeRaw`
      INSERT INTO categories
        (id, kind, slug, name_en, name_hi, icon, image_asset_id, active,
         sort_order, version, created_at, updated_at)
      VALUES (${row.id}::uuid, ${row.kind}, ${row.slug}, ${row.nameEn},
        ${row.nameHi}, ${row.icon}, ${row.imageAssetId}::uuid, ${row.active},
        ${row.sortOrder}, 1, ${row.at}, ${row.at})
      ON CONFLICT (slug) DO NOTHING`;
    return count === 1;
  }

  async updateCategory(
    tx: TxContext,
    input: { id: string; expectedVersion: number; at: Date } & CategoryChange,
  ): Promise<boolean> {
    const count = await this.database.client(tx).$executeRaw(Prisma.sql`
      UPDATE categories SET
        ${assign('name_en', input.nameEn !== undefined, Prisma.sql`${input.nameEn ?? null}`)}
        ${assign('name_hi', input.nameHi !== undefined, Prisma.sql`${input.nameHi ?? null}`)}
        ${assign('icon', input.icon !== undefined, Prisma.sql`${input.icon ?? null}`)}
        ${assign('image_asset_id', input.imageAssetId !== undefined, Prisma.sql`${input.imageAssetId ?? null}::uuid`)}
        ${assign('active', input.active !== undefined, Prisma.sql`${input.active ?? null}`)}
        ${assign('sort_order', input.sortOrder !== undefined, Prisma.sql`${input.sortOrder ?? null}`)}
        version = version + 1, updated_at = ${input.at}
      WHERE id = ${input.id}::uuid AND version = ${input.expectedVersion}`);
    return count === 1;
  }

  listSubcategories(
    tx: TxContext,
    filter: SubcategoryFilter,
  ): Promise<StoredSubcategory[]> {
    const kind = filter.kind
      ? Prisma.sql`AND EXISTS (SELECT 1 FROM categories k
          WHERE k.id = s.category_id AND k.kind = ${filter.kind})`
      : Prisma.empty;
    return this.database.client(tx).$queryRaw<StoredSubcategory[]>(Prisma.sql`
      SELECT ${subcategoryColumns} FROM subcategories s
      WHERE TRUE ${kind}
        ${filter.activeOnly ? Prisma.sql`AND s.active` : Prisma.empty}
        ${
          filter.categoryIds
            ? Prisma.sql`AND ${anyIds('s.category_id', filter.categoryIds)}`
            : Prisma.empty
        }
        ${filter.ids ? Prisma.sql`AND ${anyIds('s.id', filter.ids)}` : Prisma.empty}
      ORDER BY s.category_id, s.sort_order, s.name_en, s.id`);
  }

  async findSubcategory(
    tx: TxContext,
    id: string,
    lock = false,
  ): Promise<StoredSubcategory | null> {
    const rows = await this.database.client(tx).$queryRaw<StoredSubcategory[]>(
      Prisma.sql`SELECT ${subcategoryColumns} FROM subcategories s
        WHERE s.id = ${id}::uuid
        ${lock ? Prisma.sql`FOR UPDATE OF s` : Prisma.empty}`,
    );
    return rows[0] ?? null;
  }

  async findSubcategoryBySlug(
    tx: TxContext,
    categoryId: string,
    slug: string,
  ): Promise<StoredSubcategory | null> {
    const rows = await this.database.client(tx).$queryRaw<StoredSubcategory[]>(
      Prisma.sql`SELECT ${subcategoryColumns} FROM subcategories s
        WHERE s.category_id = ${categoryId}::uuid AND s.slug = ${slug}`,
    );
    return rows[0] ?? null;
  }

  async findSubcategoryClash(
    tx: TxContext,
    input: {
      categoryId: string;
      normalizedNames: readonly string[];
      slug?: string;
      excludeId?: string;
    },
  ): Promise<StoredSubcategory | null> {
    // Hindi names are compared with the same normalization (no stored column).
    const names = [...input.normalizedNames];
    const rows = await this.database.client(tx).$queryRaw<StoredSubcategory[]>(
      Prisma.sql`SELECT ${subcategoryColumns} FROM subcategories s
        WHERE s.category_id = ${input.categoryId}::uuid
          ${input.excludeId ? Prisma.sql`AND s.id <> ${input.excludeId}::uuid` : Prisma.empty}
          AND (s.normalized_name = ANY(${names}::text[])
            OR unaccent(regexp_replace(btrim(lower(normalize(s.name_hi, NFKC))),
              '\\s+', ' ', 'g')) = ANY(${names}::text[])
            ${input.slug ? Prisma.sql`OR s.slug = ${input.slug}` : Prisma.empty})
        ORDER BY s.id LIMIT 1`,
    );
    return rows[0] ?? null;
  }

  similarSubcategories(
    tx: TxContext,
    categoryId: string,
    normalizedName: string,
    limit: number,
  ): Promise<SimilarSubcategory[]> {
    // TODO(verify): product threshold; uses pg_trgm.similarity_threshold.
    return this.database.client(tx).$queryRaw<SimilarSubcategory[]>(Prisma.sql`
      SELECT s.id, s.slug, s.name_en AS "nameEn", s.name_hi AS "nameHi",
        round(similarity(s.normalized_name, ${normalizedName})::numeric, 3)::float8
          AS similarity
      FROM subcategories s
      WHERE s.category_id = ${categoryId}::uuid
        AND s.normalized_name % ${normalizedName}
      ORDER BY similarity(s.normalized_name, ${normalizedName}) DESC, s.id
      LIMIT ${limit}`);
  }

  async nextSubcategorySortOrder(
    tx: TxContext,
    categoryId: string,
  ): Promise<number> {
    const [row] = await this.database.client(tx).$queryRaw<{ next: number }[]>`
      SELECT COALESCE(max(sort_order) + 1, 0)::int AS next
      FROM subcategories WHERE category_id = ${categoryId}::uuid`;
    return Math.min(row?.next ?? 0, 10000);
  }

  async insertSubcategory(
    tx: TxContext,
    row: Omit<StoredSubcategory, 'version' | 'createdAt' | 'updatedAt'> & {
      at: Date;
    },
  ): Promise<boolean> {
    const count = await this.database.client(tx).$executeRaw`
      INSERT INTO subcategories
        (id, category_id, slug, name_en, name_hi, normalized_name,
         service_types, image_asset_id, active, sort_order, version,
         created_at, updated_at)
      VALUES (${row.id}::uuid, ${row.categoryId}::uuid, ${row.slug},
        ${row.nameEn}, ${row.nameHi}, ${row.normalizedName},
        ${row.serviceTypes}::text[], ${row.imageAssetId}::uuid, ${row.active},
        ${row.sortOrder}, 1, ${row.at}, ${row.at})
      ON CONFLICT DO NOTHING`;
    return count === 1;
  }

  async updateSubcategory(
    tx: TxContext,
    input: {
      id: string;
      expectedVersion: number;
      at: Date;
    } & SubcategoryChange,
  ): Promise<boolean> {
    const count = await this.database.client(tx).$executeRaw(Prisma.sql`
      UPDATE subcategories SET
        ${assign('name_en', input.nameEn !== undefined, Prisma.sql`${input.nameEn ?? null}`)}
        ${assign('name_hi', input.nameHi !== undefined, Prisma.sql`${input.nameHi ?? null}`)}
        ${assign('normalized_name', input.normalizedName !== undefined, Prisma.sql`${input.normalizedName ?? null}`)}
        ${assign('service_types', input.serviceTypes !== undefined, Prisma.sql`${input.serviceTypes ?? []}::text[]`)}
        ${assign('image_asset_id', input.imageAssetId !== undefined, Prisma.sql`${input.imageAssetId ?? null}::uuid`)}
        ${assign('active', input.active !== undefined, Prisma.sql`${input.active ?? null}`)}
        ${assign('sort_order', input.sortOrder !== undefined, Prisma.sql`${input.sortOrder ?? null}`)}
        version = version + 1, updated_at = ${input.at}
      WHERE id = ${input.id}::uuid AND version = ${input.expectedVersion}`);
    return count === 1;
  }

  relations(
    tx: TxContext,
    sourceCategoryIds?: readonly string[],
  ): Promise<StoredRelation[]> {
    return this.database.client(tx).$queryRaw<StoredRelation[]>(Prisma.sql`
      SELECT source_category_id AS "sourceCategoryId",
        related_category_id AS "relatedCategoryId", sort_order AS "sortOrder"
      FROM category_relations
      ${
        sourceCategoryIds
          ? Prisma.sql`WHERE ${anyIds('source_category_id', sourceCategoryIds)}`
          : Prisma.empty
      }
      ORDER BY source_category_id, sort_order`);
  }

  async revision(tx: TxContext): Promise<string> {
    const [row] = await this.database.client(tx).$queryRaw<
      { revision: string }[]
    >`
      SELECT md5(COALESCE(string_agg(entry, ',' ORDER BY entry), '')) AS revision
      FROM (
        SELECT 'c' || id::text || ':' || version AS entry FROM categories
        UNION ALL
        SELECT 's' || id::text || ':' || version FROM subcategories
      ) AS rows`;
    return row?.revision ?? 'empty';
  }
}
