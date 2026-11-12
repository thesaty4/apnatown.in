import { Injectable } from '@nestjs/common';
import type { SuggestionStatus } from '@apnatown/shared/catalog';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  StoredSuggestion,
  SuggestionPosition,
  SuggestionRepository,
  SuggestionVisibility,
} from '../domain/catalog.repository';
import { timestamp } from './sql';

const suggestionColumns = Prisma.sql`
  g.id, g.business_id AS "businessId",
  g.submitter_user_id AS "submitterUserId", g.city_id AS "cityId",
  g.area_id AS "areaId", g.category_id AS "categoryId", g.name_en AS "nameEn",
  g.name_hi AS "nameHi", g.normalized_name AS "normalizedName", g.reason,
  g.status, g.reviewed_by AS "reviewedBy",
  ${timestamp('g.reviewed_at')} AS "reviewedAt",
  g.rejection_reason AS "rejectionReason",
  g.subcategory_id AS "subcategoryId",
  g.merged_into_subcategory_id AS "mergedIntoSubcategoryId", g.version,
  ${timestamp('g.created_at')} AS "createdAt",
  ${timestamp('g.updated_at')} AS "updatedAt"`;

@Injectable()
export class PrismaSuggestionRepository implements SuggestionRepository {
  constructor(private readonly database: PrismaDatabase) {}

  async find(
    tx: TxContext,
    id: string,
    lock = false,
  ): Promise<StoredSuggestion | null> {
    const rows = await this.database.client(tx).$queryRaw<StoredSuggestion[]>(
      Prisma.sql`SELECT ${suggestionColumns} FROM subcategory_suggestions g
        WHERE g.id = ${id}::uuid
        ${lock ? Prisma.sql`FOR UPDATE OF g` : Prisma.empty}`,
    );
    return rows[0] ?? null;
  }

  async findPendingByName(
    tx: TxContext,
    categoryId: string,
    normalizedNames: readonly string[],
  ): Promise<StoredSuggestion | null> {
    const rows = await this.database.client(tx).$queryRaw<StoredSuggestion[]>(
      Prisma.sql`SELECT ${suggestionColumns} FROM subcategory_suggestions g
        WHERE g.category_id = ${categoryId}::uuid AND g.status = 'pending'
          AND g.normalized_name = ANY(${[...normalizedNames]}::text[])
        ORDER BY g.id LIMIT 1`,
    );
    return rows[0] ?? null;
  }

  async insert(
    tx: TxContext,
    row: Pick<
      StoredSuggestion,
      | 'id'
      | 'businessId'
      | 'submitterUserId'
      | 'cityId'
      | 'areaId'
      | 'categoryId'
      | 'nameEn'
      | 'nameHi'
      | 'normalizedName'
      | 'reason'
    > & { at: Date },
  ): Promise<boolean> {
    const count = await this.database.client(tx).$executeRaw`
      INSERT INTO subcategory_suggestions
        (id, business_id, submitter_user_id, city_id, area_id, category_id,
         name_en, name_hi, normalized_name, reason, status, version,
         created_at, updated_at)
      VALUES (${row.id}::uuid, ${row.businessId}::uuid,
        ${row.submitterUserId}::uuid, ${row.cityId}::uuid, ${row.areaId}::uuid,
        ${row.categoryId}::uuid, ${row.nameEn}, ${row.nameHi},
        ${row.normalizedName}, ${row.reason}, 'pending', 1, ${row.at},
        ${row.at})
      ON CONFLICT DO NOTHING`;
    return count === 1;
  }

  async decide(
    tx: TxContext,
    input: {
      id: string;
      expectedVersion: number;
      status: Exclude<SuggestionStatus, 'pending'>;
      reviewedBy: string;
      rejectionReason: string | null;
      subcategoryId: string | null;
      mergedIntoSubcategoryId: string | null;
      at: Date;
    },
  ): Promise<boolean> {
    const count = await this.database.client(tx).$executeRaw`
      UPDATE subcategory_suggestions SET
        status = ${input.status}, reviewed_by = ${input.reviewedBy}::uuid,
        reviewed_at = ${input.at}, rejection_reason = ${input.rejectionReason},
        subcategory_id = ${input.subcategoryId}::uuid,
        merged_into_subcategory_id = ${input.mergedIntoSubcategoryId}::uuid,
        version = version + 1, updated_at = ${input.at}
      WHERE id = ${input.id}::uuid AND version = ${input.expectedVersion}
        AND status = 'pending'`;
    return count === 1;
  }

  scopedPage(
    tx: TxContext,
    input: {
      status: SuggestionStatus;
      visibility: SuggestionVisibility;
      limit: number;
      after?: SuggestionPosition;
    },
  ): Promise<StoredSuggestion[]> {
    const { visibility } = input;
    const scope = visibility.platformWide
      ? Prisma.empty
      : Prisma.sql`AND (g.area_id = ANY(${[...visibility.areaIds]}::uuid[])
          OR g.city_id = ANY(${[...visibility.cityIds]}::uuid[]))`;
    const after = input.after
      ? Prisma.sql`AND (g.created_at, g.id) >
          (${input.after.createdAt}::timestamptz, ${input.after.id}::uuid)`
      : Prisma.empty;
    return this.database.client(tx).$queryRaw<StoredSuggestion[]>(Prisma.sql`
      SELECT ${suggestionColumns} FROM subcategory_suggestions g
      WHERE g.status = ${input.status} ${scope} ${after}
      ORDER BY g.created_at, g.id LIMIT ${input.limit + 1}`);
  }

  businessPage(
    tx: TxContext,
    input: { businessId: string; limit: number; after?: SuggestionPosition },
  ): Promise<StoredSuggestion[]> {
    const after = input.after
      ? Prisma.sql`AND (g.created_at, g.id) <
          (${input.after.createdAt}::timestamptz, ${input.after.id}::uuid)`
      : Prisma.empty;
    return this.database.client(tx).$queryRaw<StoredSuggestion[]>(Prisma.sql`
      SELECT ${suggestionColumns} FROM subcategory_suggestions g
      WHERE g.business_id = ${input.businessId}::uuid ${after}
      ORDER BY g.created_at DESC, g.id DESC LIMIT ${input.limit + 1}`);
  }
}
