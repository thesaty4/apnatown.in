import { Injectable } from '@nestjs/common';
import { CountSchema } from '@apnatown/shared/wire';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type { VideoShareRepository } from '../domain/shares';

@Injectable()
export class PrismaVideoShareRepository implements VideoShareRepository {
  constructor(private readonly database: PrismaDatabase) {}

  async increment(videoId: string, at: Date, tx: TxContext) {
    const client = this.database.client(tx);
    await client.$executeRaw`
      INSERT INTO video_engagement_counts (video_id, updated_at)
      VALUES (${videoId}::uuid, ${at})
      ON CONFLICT (video_id) DO NOTHING`;
    await client.$queryRaw`
      SELECT video_id FROM video_engagement_counts
      WHERE video_id = ${videoId}::uuid FOR UPDATE`;
    await client.$executeRaw`
      UPDATE video_engagement_counts
      SET share_count = share_count + 1,
          version = version + 1, updated_at = ${at}
      WHERE video_id = ${videoId}::uuid`;
    const [row] = await client.$queryRaw<
      Array<{ shareCount: bigint; version: bigint }>
    >`
      SELECT share_count AS "shareCount", version
      FROM video_engagement_counts
      WHERE video_id = ${videoId}::uuid`;
    if (!row) throw new Error('VIDEO_SHARE_COUNTER_MISSING');
    return {
      shareCount: CountSchema.parse(Number(row.shareCount)),
      version: CountSchema.parse(Number(row.version)),
    };
  }
}
