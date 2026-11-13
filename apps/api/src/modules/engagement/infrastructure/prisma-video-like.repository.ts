import { Injectable } from '@nestjs/common';
import {
  EngagementStateSchema,
  VideoLikeResultSchema,
} from '@apnatown/shared';
import { CountSchema } from '@apnatown/shared/wire';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type { VideoLikeRepository } from '../domain/likes';

@Injectable()
export class PrismaVideoLikeRepository implements VideoLikeRepository {
  constructor(private readonly database: PrismaDatabase) {}

  async state(
    tx: TxContext,
    userId: string | null,
    videoIds: readonly string[],
    publicVideoIds: readonly string[],
  ) {
    const rows = await this.database.client(tx).$queryRaw<
      Array<{ videoId: string; liked: boolean; likeCount: bigint | null }>
    >`
      SELECT requested.id AS "videoId",
        EXISTS (
          SELECT 1 FROM likes l
          WHERE l.user_id = ${userId}::uuid AND l.video_id = requested.id
        ) AS liked,
        CASE WHEN requested.id = ANY(${[...publicVideoIds]}::uuid[])
          THEN COALESCE(c.like_count, 0) ELSE NULL END AS "likeCount"
      FROM unnest(${[...videoIds]}::uuid[]) AS requested(id)
      LEFT JOIN video_engagement_counts c ON c.video_id = requested.id
      ORDER BY requested.id`;
    return EngagementStateSchema.parse({
      likedVideoIds: rows.filter((row) => row.liked).map((row) => row.videoId),
      videoCounts: rows.filter((row) => row.likeCount !== null).map((row) => ({
        videoId: row.videoId,
        likeCount: Number(row.likeCount),
      })),
    });
  }

  async set(
    tx: TxContext,
    input: { userId: string; videoId: string; liked: boolean; at: Date },
  ) {
    const client = this.database.client(tx);
    await client.$executeRaw`
      INSERT INTO video_engagement_counts (video_id, updated_at)
      VALUES (${input.videoId}::uuid, ${input.at})
      ON CONFLICT (video_id) DO NOTHING`;
    // Serialize relationship and counter changes, including opposite toggles.
    await client.$queryRaw`
      SELECT video_id FROM video_engagement_counts
      WHERE video_id = ${input.videoId}::uuid FOR UPDATE`;
    const affected = input.liked
      ? await client.$executeRaw`
          INSERT INTO likes (user_id, video_id, created_at)
          VALUES (${input.userId}::uuid, ${input.videoId}::uuid, ${input.at})
          ON CONFLICT (user_id, video_id) DO NOTHING`
      : await client.$executeRaw`
          DELETE FROM likes
          WHERE user_id = ${input.userId}::uuid AND video_id = ${input.videoId}::uuid`;
    if (affected > 0) {
      await client.$executeRaw`
        UPDATE video_engagement_counts
        SET like_count = like_count + ${input.liked ? 1 : -1},
            version = version + 1, updated_at = ${input.at}
        WHERE video_id = ${input.videoId}::uuid`;
    }
    const [count] = await client.$queryRaw<Array<{ likeCount: bigint; version: bigint }>>`
      SELECT like_count AS "likeCount", version
      FROM video_engagement_counts WHERE video_id = ${input.videoId}::uuid`;
    if (!count) throw new Error('VIDEO_LIKE_COUNTER_MISSING');
    return {
      ...VideoLikeResultSchema.parse({
        liked: input.liked,
        likeCount: Number(count.likeCount),
      }),
      changed: affected > 0,
      version: CountSchema.parse(Number(count.version)),
    };
  }
}
