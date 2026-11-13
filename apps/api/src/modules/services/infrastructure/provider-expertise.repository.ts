import { Injectable } from '@nestjs/common';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  ProviderExpertiseRepository,
  StoredExpertise,
} from '../application/provider-expertise-ports';

/** Parameterized SQL only; Services owns both expertise tables. */
@Injectable()
export class PrismaProviderExpertiseRepository
  implements ProviderExpertiseRepository
{
  constructor(private readonly db: PrismaDatabase) {}

  async read(tx: TxContext, businessId: string): Promise<StoredExpertise> {
    const client = this.db.client(tx);
    const rows = await client.$queryRaw<{ id: string }[]>`
      SELECT subcategory_id::text AS id FROM provider_expertise
      WHERE business_id=${businessId}::uuid
      ORDER BY created_at,subcategory_id`;
    const versions = await client.$queryRaw<{ version: number }[]>`
      SELECT version FROM provider_expertise_versions
      WHERE business_id=${businessId}::uuid`;
    return {
      subcategoryIds: rows.map((row) => row.id),
      version: versions[0]?.version ?? 1,
    };
  }

  async lockVersion(
    tx: TxContext,
    businessId: string,
    at: Date,
  ): Promise<number> {
    const client = this.db.client(tx);
    await client.$executeRaw`
      INSERT INTO provider_expertise_versions (business_id,version,updated_at)
      VALUES (${businessId}::uuid,1,${at})
      ON CONFLICT (business_id) DO NOTHING`;
    const rows = await client.$queryRaw<{ version: number }[]>`
      SELECT version FROM provider_expertise_versions
      WHERE business_id=${businessId}::uuid
      FOR UPDATE`;
    if (!rows[0]) throw new Error('EXPERTISE_VERSION_ROW_MISSING');
    return rows[0].version;
  }

  async replace(
    tx: TxContext,
    input: {
      businessId: string;
      subcategoryIds: readonly string[];
      expectedVersion: number;
      at: Date;
    },
  ): Promise<number | null> {
    const client = this.db.client(tx);
    const bumped = await client.$queryRaw<{ version: number }[]>`
      UPDATE provider_expertise_versions
      SET version=version+1,updated_at=${input.at}
      WHERE business_id=${input.businessId}::uuid
        AND version=${input.expectedVersion}
      RETURNING version`;
    if (!bumped[0]) return null;
    const ids = [...input.subcategoryIds];
    // Retained mappings keep their original created_at.
    await client.$executeRaw`
      DELETE FROM provider_expertise
      WHERE business_id=${input.businessId}::uuid
        AND NOT (subcategory_id=ANY(${ids}::uuid[]))`;
    if (ids.length)
      await client.$executeRaw`
        INSERT INTO provider_expertise (business_id,subcategory_id,created_at)
        SELECT ${input.businessId}::uuid,id,${input.at}
        FROM unnest(${ids}::uuid[]) AS id
        ON CONFLICT (business_id,subcategory_id) DO NOTHING`;
    return bumped[0].version;
  }

  publicSubcategoryIds(slug: string): Promise<string[] | null> {
    return this.db.transaction(async (tx) => {
      const client = this.db.client(tx);
      await client.$executeRaw`SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY`;
      // Businesses' public projection: approved, live, owner active, city enabled.
      const owners = await client.$queryRaw<{ id: string }[]>`
        SELECT id::text AS id FROM businesses_public_context
        WHERE slug=${slug} AND kind='provider'`;
      if (!owners[0]) return null;
      const rows = await client.$queryRaw<{ id: string }[]>`
        SELECT subcategory_id::text AS id FROM provider_expertise
        WHERE business_id=${owners[0].id}::uuid
        ORDER BY created_at,subcategory_id`;
      return rows.map((row) => row.id);
    });
  }
}
