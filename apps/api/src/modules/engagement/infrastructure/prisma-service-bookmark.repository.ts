import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type { ServiceBookmarkRepository, ServiceBookmarkRow } from '../domain/bookmarks';

@Injectable()
export class PrismaServiceBookmarkRepository implements ServiceBookmarkRepository {
  constructor(private readonly db: PrismaDatabase) {}
  async findOwned(tx: TxContext, userId: string | null, serviceIds: readonly string[]): Promise<string[]> {
    if (!userId || serviceIds.length === 0) return [];
    if (serviceIds.length > 50) throw new Error('BOOKMARK_BATCH_LIMIT');
    const rows = await this.db.client(tx).$queryRaw<{ id: string }[]>`
      SELECT target_id AS id FROM bookmarks WHERE user_id=${userId}::uuid
        AND target_type='service' AND target_id=ANY(${[...serviceIds]}::uuid[]) ORDER BY target_id`;
    return rows.map((row) => row.id);
  }
  async set(tx: TxContext, input: Parameters<ServiceBookmarkRepository['set']>[1]): Promise<void> {
    if (input.bookmarked) {
      await this.db.client(tx).$executeRaw`
        INSERT INTO bookmarks(user_id,target_type,target_id,created_at)
        VALUES(${input.userId}::uuid,'service',${input.serviceId}::uuid,${input.at})
        ON CONFLICT(user_id,target_type,target_id) DO NOTHING`;
    } else {
      await this.db.client(tx).$executeRaw`
        DELETE FROM bookmarks WHERE user_id=${input.userId}::uuid
          AND target_type='service' AND target_id=${input.serviceId}::uuid`;
    }
  }
  page(tx: TxContext, input: Parameters<ServiceBookmarkRepository['page']>[1]) {
    const { userId,limit,after } = input;
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new Error('BOOKMARK_PAGE_LIMIT');
    return this.db.client(tx).$queryRaw<ServiceBookmarkRow[]>(Prisma.sql`
      SELECT 'service' AS "targetType",target_id AS "targetId",
        to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "createdAt"
      FROM bookmarks WHERE user_id=${userId}::uuid AND target_type='service'
        ${after ? Prisma.sql`AND (created_at,target_id)<(${after.createdAt}::timestamptz,${after.targetId}::uuid)` : Prisma.empty}
      ORDER BY created_at DESC,target_id DESC LIMIT ${limit+1}`);
  }
  async eraseForUser(tx: TxContext, userId: string): Promise<void> {
    await this.db.client(tx).$executeRaw`DELETE FROM bookmarks WHERE user_id=${userId}::uuid AND target_type='service'`;
  }
}
