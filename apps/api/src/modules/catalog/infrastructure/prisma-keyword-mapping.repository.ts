import { Injectable } from '@nestjs/common';
import type { KeywordTarget } from '@apnatown/shared/catalog';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  KeywordMappingRepository,
  KeywordMatchRow,
  KeywordTermRow,
  StoredKeywordMapping,
} from '../domain/catalog.repository';
import { anyIds, timestamp } from './sql';

const mappingColumns = Prisma.sql`
  m.id, m.enabled, m.version,
  ${timestamp('m.created_at')} AS "createdAt",
  ${timestamp('m.updated_at')} AS "updatedAt",
  COALESCE((SELECT t.term FROM keyword_mapping_terms t
    WHERE t.mapping_id = m.id AND t.kind = 'primary'), '') AS "canonicalTerm",
  COALESCE((SELECT array_agg(t.term ORDER BY t.id) FROM keyword_mapping_terms t
    WHERE t.mapping_id = m.id AND t.kind = 'synonym'), '{}') AS synonyms,
  COALESCE((SELECT json_agg(CASE x.target_kind
      WHEN 'category' THEN json_build_object(
        'kind', 'category', 'categoryId', x.category_id)
      WHEN 'subcategory' THEN json_build_object(
        'kind', 'subcategory', 'subcategoryId', x.subcategory_id)
      ELSE json_build_object('kind', 'product_tag', 'productTag', x.product_tag)
    END ORDER BY x.id)
    FROM keyword_mapping_targets x WHERE x.mapping_id = m.id),
    '[]'::json) AS targets`;

@Injectable()
export class PrismaKeywordMappingRepository implements KeywordMappingRepository {
  constructor(private readonly database: PrismaDatabase) {}

  async find(
    tx: TxContext,
    id: string,
    lock = false,
  ): Promise<StoredKeywordMapping | null> {
    const client = this.database.client(tx);
    if (lock) {
      const locked = await client.$queryRaw<{ id: string }[]>`
        SELECT id FROM keyword_mappings WHERE id = ${id}::uuid FOR UPDATE`;
      if (!locked.length) return null;
    }
    const rows = await client.$queryRaw<StoredKeywordMapping[]>(Prisma.sql`
      SELECT ${mappingColumns} FROM keyword_mappings m
      WHERE m.id = ${id}::uuid`);
    return rows[0] ?? null;
  }

  page(
    tx: TxContext,
    input: { limit: number; afterId?: string },
  ): Promise<StoredKeywordMapping[]> {
    return this.database.client(tx).$queryRaw<StoredKeywordMapping[]>(
      Prisma.sql`SELECT ${mappingColumns} FROM keyword_mappings m
        ${input.afterId ? Prisma.sql`WHERE m.id > ${input.afterId}::uuid` : Prisma.empty}
        ORDER BY m.id LIMIT ${input.limit + 1}`,
    );
  }

  findMany(
    tx: TxContext,
    ids: readonly string[],
  ): Promise<StoredKeywordMapping[]> {
    if (!ids.length) return Promise.resolve([]);
    return this.database.client(tx).$queryRaw<StoredKeywordMapping[]>(
      Prisma.sql`SELECT ${mappingColumns} FROM keyword_mappings m
        WHERE ${anyIds('m.id', ids)} ORDER BY m.id`,
    );
  }

  async takenTerms(
    tx: TxContext,
    normalizedTerms: readonly string[],
    excludeMappingId?: string,
  ): Promise<string[]> {
    const rows = await this.database.client(tx).$queryRaw<{ term: string }[]>(
      Prisma.sql`SELECT normalized_term AS term FROM keyword_mapping_terms
        WHERE normalized_term = ANY(${[...normalizedTerms]}::text[])
        ${
          excludeMappingId
            ? Prisma.sql`AND mapping_id <> ${excludeMappingId}::uuid`
            : Prisma.empty
        }
        ORDER BY normalized_term`,
    );
    return rows.map((row) => row.term);
  }

  async insert(tx: TxContext, input: { id: string; at: Date }): Promise<void> {
    await this.database.client(tx).$executeRaw`
      INSERT INTO keyword_mappings (id, enabled, version, created_at, updated_at)
      VALUES (${input.id}::uuid, TRUE, 1, ${input.at}, ${input.at})`;
  }

  async touch(
    tx: TxContext,
    input: { id: string; expectedVersion: number; at: Date },
  ): Promise<boolean> {
    const count = await this.database.client(tx).$executeRaw`
      UPDATE keyword_mappings SET version = version + 1, updated_at = ${input.at}
      WHERE id = ${input.id}::uuid AND version = ${input.expectedVersion}`;
    return count === 1;
  }

  async replaceTerms(
    tx: TxContext,
    input: {
      mappingId: string;
      terms: readonly (KeywordTermRow & { id: string })[];
      at: Date;
    },
  ): Promise<boolean> {
    const client = this.database.client(tx);
    await client.$executeRaw`
      DELETE FROM keyword_mapping_terms WHERE mapping_id = ${input.mappingId}::uuid`;
    const count = await client.$executeRaw(Prisma.sql`
      INSERT INTO keyword_mapping_terms
        (id, mapping_id, term, normalized_term, kind, created_at)
      VALUES ${Prisma.join(
        input.terms.map(
          (term) =>
            Prisma.sql`(${term.id}::uuid, ${input.mappingId}::uuid,
              ${term.term}, ${term.normalizedTerm}, ${term.kind}, ${input.at})`,
        ),
      )}
      ON CONFLICT DO NOTHING`);
    return count === input.terms.length;
  }

  async replaceTargets(
    tx: TxContext,
    input: {
      mappingId: string;
      targets: readonly (KeywordTarget & { id: string })[];
    },
  ): Promise<void> {
    const client = this.database.client(tx);
    await client.$executeRaw`
      DELETE FROM keyword_mapping_targets WHERE mapping_id = ${input.mappingId}::uuid`;
    await client.$executeRaw(Prisma.sql`
      INSERT INTO keyword_mapping_targets
        (id, mapping_id, target_kind, category_id, subcategory_id, product_tag)
      VALUES ${Prisma.join(
        input.targets.map(
          (target) =>
            Prisma.sql`(${target.id}::uuid, ${input.mappingId}::uuid,
              ${target.kind},
              ${target.kind === 'category' ? target.categoryId : null}::uuid,
              ${target.kind === 'subcategory' ? target.subcategoryId : null}::uuid,
              ${target.kind === 'product_tag' ? target.productTag : null})`,
        ),
      )}`);
  }

  async delete(
    tx: TxContext,
    input: { id: string; expectedVersion: number },
  ): Promise<boolean> {
    const count = await this.database.client(tx).$executeRaw`
      DELETE FROM keyword_mappings
      WHERE id = ${input.id}::uuid AND version = ${input.expectedVersion}`;
    return count === 1;
  }

  match(
    tx: TxContext,
    normalizedQuery: string,
    limit: number,
  ): Promise<KeywordMatchRow[]> {
    // Exact normalized term wins; otherwise trigram typo tolerance ranked by
    // similarity (pg_trgm.similarity_threshold; TODO(verify) product value).
    return this.database.client(tx).$queryRaw<KeywordMatchRow[]>(Prisma.sql`
      WITH q AS (SELECT unaccent(${normalizedQuery}) AS v),
      live AS (
        SELECT t.mapping_id, t.term, t.normalized_term
        FROM keyword_mapping_terms t
        JOIN keyword_mappings m ON m.id = t.mapping_id AND m.enabled),
      exact AS (
        SELECT l.mapping_id, l.term FROM live l, q
        WHERE l.normalized_term = q.v),
      fuzzy AS (
        SELECT DISTINCT ON (l.mapping_id) l.mapping_id, l.term,
          similarity(l.normalized_term, q.v) AS score
        FROM live l, q
        WHERE NOT EXISTS (SELECT 1 FROM exact) AND l.normalized_term % q.v
        ORDER BY l.mapping_id, similarity(l.normalized_term, q.v) DESC, l.term)
      SELECT mapping_id AS "mappingId", term AS "matchedTerm", exact
      FROM (
        SELECT mapping_id, term, TRUE AS exact, 1::real AS score FROM exact
        UNION ALL
        SELECT mapping_id, term, FALSE, score FROM fuzzy
      ) AS matches
      ORDER BY score DESC, mapping_id LIMIT ${limit}`);
  }

  async revision(tx: TxContext): Promise<string> {
    const [row] = await this.database.client(tx).$queryRaw<
      { revision: string }[]
    >`
      SELECT md5(COALESCE(string_agg(id::text || ':' || version || ':' ||
        enabled::text, ',' ORDER BY id), '')) AS revision
      FROM keyword_mappings`;
    return row?.revision ?? 'empty';
  }
}
