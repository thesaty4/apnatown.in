import { Injectable } from '@nestjs/common';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type { VideoHeartRepository } from '../domain/hearts';

@Injectable()
export class PrismaVideoHeartRepository implements VideoHeartRepository {
  constructor(private readonly database: PrismaDatabase) {}

  async findOwned(tx: TxContext, userId: string | null, videoIds: readonly string[]) {
    if (!userId || videoIds.length === 0) return [];
    const rows = await this.database.client(tx).$queryRaw<
      Array<{ targetId: string }>
    >`
      SELECT target_id AS "targetId"
      FROM hearts
      WHERE user_id = ${userId}::uuid
        AND target_type = 'video'
        AND target_id = ANY(${[...videoIds]}::uuid[])`;
    return rows.map((row) => row.targetId);
  }

  async set(
    tx: TxContext,
    input: { userId: string; videoId: string; hearted: boolean; at: Date },
  ): Promise<void> {
    const client = this.database.client(tx);
    if (input.hearted) {
      await client.$executeRaw`
        INSERT INTO hearts (user_id, target_type, target_id, created_at)
        VALUES (${input.userId}::uuid, 'video', ${input.videoId}::uuid, ${input.at})
        ON CONFLICT (user_id, target_type, target_id) DO NOTHING`;
      return;
    }
    await client.$executeRaw`
      DELETE FROM hearts
      WHERE user_id = ${input.userId}::uuid
        AND target_type = 'video'
        AND target_id = ${input.videoId}::uuid`;
  }
}
