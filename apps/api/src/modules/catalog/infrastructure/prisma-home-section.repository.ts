import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  HomeSectionContent,
  HomeSectionRepository,
  StoredHomeSection,
} from '../domain/catalog.repository';
import { timestamp } from './sql';

const sectionColumns = Prisma.sql`
  h.id, h.kind, h.content_kind AS "contentKind", h.category_id AS "categoryId",
  h.heading_en AS "headingEn", h.heading_hi AS "headingHi",
  h.supporting_text_en AS "supportingTextEn",
  h.supporting_text_hi AS "supportingTextHi",
  h.initial_category_id AS "initialCategoryId", h.position, h.active,
  ${timestamp('h.removed_at')} AS "removedAt", h.version,
  ${timestamp('h.created_at')} AS "createdAt",
  ${timestamp('h.updated_at')} AS "updatedAt",
  COALESCE((SELECT json_agg(json_build_object(
      'categoryId', p.category_id, 'position', p.position)
      ORDER BY p.position, p.category_id)
    FROM catalog_home_section_categories p WHERE p.section_id = h.id),
    '[]'::json) AS categories`;

@Injectable()
export class PrismaHomeSectionRepository implements HomeSectionRepository {
  constructor(private readonly database: PrismaDatabase) {}

  list(
    tx: TxContext,
    input: { activeOnly: boolean; limit: number },
  ): Promise<StoredHomeSection[]> {
    return this.database.client(tx).$queryRaw<StoredHomeSection[]>(Prisma.sql`
      SELECT ${sectionColumns} FROM catalog_home_sections h
      WHERE h.removed_at IS NULL
        ${input.activeOnly ? Prisma.sql`AND h.active` : Prisma.empty}
      ORDER BY h.position, h.id LIMIT ${input.limit}`);
  }

  async find(
    tx: TxContext,
    id: string,
    lock = false,
  ): Promise<StoredHomeSection | null> {
    const client = this.database.client(tx);
    if (lock) {
      const locked = await client.$queryRaw<{ id: string }[]>`
        SELECT id FROM catalog_home_sections
        WHERE id = ${id}::uuid AND removed_at IS NULL FOR UPDATE`;
      if (!locked.length) return null;
    }
    const rows = await client.$queryRaw<StoredHomeSection[]>(Prisma.sql`
      SELECT ${sectionColumns} FROM catalog_home_sections h
      WHERE h.id = ${id}::uuid AND h.removed_at IS NULL`);
    return rows[0] ?? null;
  }

  async insert(
    tx: TxContext,
    row: HomeSectionContent & {
      id: string;
      kind: StoredHomeSection['kind'];
      contentKind: StoredHomeSection['contentKind'];
      actorId: string;
      at: Date;
    },
  ): Promise<boolean> {
    const count = await this.database.client(tx).$executeRaw`
      INSERT INTO catalog_home_sections
        (id, kind, content_kind, category_id, heading_en, heading_hi,
         supporting_text_en, supporting_text_hi, initial_category_id,
         position, active, version, created_by, updated_by, created_at,
         updated_at)
      VALUES (${row.id}::uuid, ${row.kind}, ${row.contentKind},
        ${row.categoryId}::uuid, ${row.headingEn}, ${row.headingHi},
        ${row.supportingTextEn}, ${row.supportingTextHi},
        ${row.initialCategoryId}::uuid, ${row.position}, FALSE, 1,
        ${row.actorId}::uuid, ${row.actorId}::uuid, ${row.at}, ${row.at})
      ON CONFLICT DO NOTHING`;
    if (count !== 1) return false;
    await this.replacePills(tx, row.id, row.categories);
    return true;
  }

  async update(
    tx: TxContext,
    input: HomeSectionContent & {
      id: string;
      expectedVersion: number;
      actorId: string;
      at: Date;
    },
  ): Promise<'ok' | 'stale' | 'conflict'> {
    const client = this.database.client(tx);
    if (input.categoryId) {
      const [clash] = await client.$queryRaw<{ id: string }[]>`
        SELECT id FROM catalog_home_sections
        WHERE kind = 'single_category' AND removed_at IS NULL
          AND category_id = ${input.categoryId}::uuid
          AND id <> ${input.id}::uuid`;
      if (clash) return 'conflict';
    }
    const count = await client.$executeRaw`
      UPDATE catalog_home_sections SET
        category_id = ${input.categoryId}::uuid,
        heading_en = ${input.headingEn}, heading_hi = ${input.headingHi},
        supporting_text_en = ${input.supportingTextEn},
        supporting_text_hi = ${input.supportingTextHi},
        initial_category_id = ${input.initialCategoryId}::uuid,
        position = ${input.position}, updated_by = ${input.actorId}::uuid,
        version = version + 1, updated_at = ${input.at}
      WHERE id = ${input.id}::uuid AND version = ${input.expectedVersion}
        AND removed_at IS NULL`;
    if (count !== 1) return 'stale';
    await this.replacePills(tx, input.id, input.categories);
    return 'ok';
  }

  async setState(
    tx: TxContext,
    input: {
      id: string;
      expectedVersion: number;
      active: boolean;
      removed: boolean;
      actorId: string;
      at: Date;
    },
  ): Promise<boolean> {
    const count = await this.database.client(tx).$executeRaw`
      UPDATE catalog_home_sections SET
        active = ${input.active},
        removed_at = CASE WHEN ${input.removed} THEN ${input.at}::timestamptz
          ELSE NULL END,
        updated_by = ${input.actorId}::uuid,
        version = version + 1, updated_at = ${input.at}
      WHERE id = ${input.id}::uuid AND version = ${input.expectedVersion}
        AND removed_at IS NULL`;
    return count === 1;
  }

  private async replacePills(
    tx: TxContext,
    sectionId: string,
    pills: readonly { categoryId: string; position: number }[],
  ): Promise<void> {
    const client = this.database.client(tx);
    await client.$executeRaw`
      DELETE FROM catalog_home_section_categories
      WHERE section_id = ${sectionId}::uuid`;
    if (!pills.length) return;
    await client.$executeRaw(Prisma.sql`
      INSERT INTO catalog_home_section_categories
        (section_id, category_id, position)
      VALUES ${Prisma.join(
        pills.map(
          (pill) =>
            Prisma.sql`(${sectionId}::uuid, ${pill.categoryId}::uuid,
              ${pill.position})`,
        ),
      )}`);
  }
}
