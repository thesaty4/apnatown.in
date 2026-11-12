import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  StoredSupportMessage,
  SupportMessageRepository,
  SupportPosition,
  SupportSource,
  SupportVisibility,
} from '../domain/settings';

const columns = Prisma.sql`id, user_id AS "userId", message,
  city_id AS "cityId", area_id AS "areaId",
  to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "createdAt"`;

@Injectable()
export class PrismaSupportMessageRepository implements SupportMessageRepository {
  constructor(private readonly database: PrismaDatabase) {}

  async insert(
    tx: TxContext,
    input: {
      id: string;
      userId: string | null;
      message: string;
      source: SupportSource;
      sourceKey: string | null;
      cityId: string | null;
      areaId: string | null;
      at: Date;
    },
  ): Promise<{ id: string; created: boolean }> {
    const client = this.database.client(tx);
    const rows = await client.$queryRaw<{ id: string }[]>(Prisma.sql`
      INSERT INTO support_messages
        (id, user_id, message, source, source_key, city_id, area_id, created_at)
      VALUES (${input.id}::uuid, ${input.userId}::uuid, ${input.message},
        ${input.source}, ${input.sourceKey}, ${input.cityId}::uuid,
        ${input.areaId}::uuid, ${input.at})
      ON CONFLICT (source, source_key) DO NOTHING
      RETURNING id`);
    if (rows.length) return { id: input.id, created: true };
    const existing = await client.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT id FROM support_messages
      WHERE source = ${input.source} AND source_key = ${input.sourceKey}`);
    if (!existing[0]) throw new Error('SUPPORT_MESSAGE_INSERT_FAILED');
    return { id: existing[0].id, created: false };
  }

  async read(tx: TxContext, id: string): Promise<StoredSupportMessage | null> {
    const rows = await this.database
      .client(tx)
      .$queryRaw<StoredSupportMessage[]>(
        Prisma.sql`SELECT ${columns} FROM support_messages WHERE id = ${id}::uuid`,
      );
    return rows[0] ?? null;
  }

  page(
    tx: TxContext,
    visibility: SupportVisibility,
    limit: number,
    after?: SupportPosition,
  ): Promise<StoredSupportMessage[]> {
    // An exact area grant admits that area; a whole-city grant admits the
    // city's area and city-only rows; unscoped rows need platform scope.
    const scope = visibility.platformWide
      ? Prisma.sql`TRUE`
      : Prisma.sql`(area_id = ANY(${[...visibility.areaIds]}::uuid[])
          OR city_id = ANY(${[...visibility.cityIds]}::uuid[]))`;
    const cursor = after
      ? Prisma.sql`AND (created_at, id) < (${after.createdAt}::timestamptz, ${after.id}::uuid)`
      : Prisma.empty;
    return this.database.client(tx).$queryRaw<StoredSupportMessage[]>(
      Prisma.sql`SELECT ${columns} FROM support_messages
        WHERE ${scope} ${cursor}
        ORDER BY created_at DESC, id DESC LIMIT ${limit}`,
    );
  }

  pageByUser(
    tx: TxContext,
    userId: string,
    limit: number,
    after?: SupportPosition,
  ): Promise<StoredSupportMessage[]> {
    const cursor = after
      ? Prisma.sql`AND (created_at, id) > (${after.createdAt}::timestamptz, ${after.id}::uuid)`
      : Prisma.empty;
    return this.database.client(tx).$queryRaw<StoredSupportMessage[]>(
      Prisma.sql`SELECT ${columns} FROM support_messages
        WHERE user_id = ${userId}::uuid ${cursor}
        ORDER BY created_at, id LIMIT ${limit}`,
    );
  }

  async existsForUser(tx: TxContext, userId: string): Promise<boolean> {
    const rows = await this.database
      .client(tx)
      .$queryRaw<{ one: number }[]>(
        Prisma.sql`SELECT 1 AS one FROM support_messages WHERE user_id = ${userId}::uuid LIMIT 1`,
      );
    return rows.length > 0;
  }
}
