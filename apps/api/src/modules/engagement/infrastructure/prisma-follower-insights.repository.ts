import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  FollowerInsightsRepository,
  StoredAnnouncement,
} from '../domain/follower-insights';

const IST = 'Asia/Kolkata';
const ANNOUNCEMENT_COLUMNS = Prisma.sql`id::text AS id, business_id::text AS "businessId",
  kind, message_en AS "messageEn", message_hi AS "messageHi",
  to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "createdAt"`;
const ACTIVE = Prisma.sql`unfollowed_at IS NULL`;

/** Parameterized SQL only. `videos` is read for the approved count (Media-owned, read-only). */
@Injectable()
export class PrismaFollowerInsightsRepository implements FollowerInsightsRepository {
  constructor(private readonly db: PrismaDatabase) {}

  private async count(tx: TxContext, query: Prisma.Sql): Promise<number> {
    const rows = await this.db.client(tx).$queryRaw<{ count: number }[]>(query);
    return rows[0]?.count ?? 0;
  }

  activeFollowers(tx: TxContext, businessId: string) {
    return this.count(tx, Prisma.sql`SELECT count(*)::integer AS count FROM follows
      WHERE business_id = ${businessId}::uuid AND ${ACTIVE}`);
  }

  countBellFollowers(tx: TxContext, businessId: string) {
    return this.count(tx, Prisma.sql`SELECT count(*)::integer AS count FROM follows
      WHERE business_id = ${businessId}::uuid AND ${ACTIVE} AND bell_on`);
  }

  approvedVideos(tx: TxContext, businessId: string) {
    return this.count(tx, Prisma.sql`SELECT count(*)::integer AS count FROM videos
      WHERE business_id = ${businessId}::uuid AND status = 'approved' AND owner_deleted_at IS NULL`);
  }

  async firstFollowsByWeek(tx: TxContext, input: { businessId: string; fromIstDate: string }) {
    // follows.created_at is the first-ever follow (refollow keeps the row).
    const rows = await this.db.client(tx).$queryRaw<{ week: string; count: number }[]>(Prisma.sql`
      SELECT to_char(date_trunc('week', created_at AT TIME ZONE ${IST}), 'YYYY-MM-DD') AS week,
        count(*)::integer AS count
      FROM follows
      WHERE business_id = ${input.businessId}::uuid
        AND created_at >= (${input.fromIstDate}::date)::timestamp AT TIME ZONE ${IST}
      GROUP BY 1`);
    return new Map(rows.map((row) => [row.week, row.count]));
  }

  recentAnnouncements(tx: TxContext, businessId: string, limit: number) {
    return this.db.client(tx).$queryRaw<StoredAnnouncement[]>(Prisma.sql`
      SELECT ${ANNOUNCEMENT_COLUMNS} FROM follower_announcements
      WHERE business_id = ${businessId}::uuid
      ORDER BY created_at DESC, id DESC LIMIT ${limit}`);
  }

  async bellFollowers(tx: TxContext, businessId: string, limit: number) {
    const rows = await this.db.client(tx).$queryRaw<{ userId: string }[]>(Prisma.sql`
      SELECT user_id::text AS "userId" FROM follows
      WHERE business_id = ${businessId}::uuid AND ${ACTIVE} AND bell_on
      ORDER BY user_id LIMIT ${limit}`);
    return rows.map((row) => row.userId);
  }

  async insertAnnouncement(
    tx: TxContext,
    input: Omit<StoredAnnouncement, 'createdAt'> & { at: Date },
  ) {
    await this.db.client(tx).$executeRaw(Prisma.sql`
      INSERT INTO follower_announcements (id, business_id, kind, source, message_en, message_hi, created_at)
      VALUES (${input.id}::uuid, ${input.businessId}::uuid, ${input.kind}, 'owner_announcement',
        ${input.messageEn}, ${input.messageHi}, ${input.at})`);
  }

  async announcement(tx: TxContext, id: string) {
    const rows = await this.db.client(tx).$queryRaw<StoredAnnouncement[]>(Prisma.sql`
      SELECT ${ANNOUNCEMENT_COLUMNS} FROM follower_announcements WHERE id = ${id}::uuid`);
    return rows[0] ?? null;
  }

  async business(tx: TxContext, businessId: string) {
    const rows = await this.db.client(tx).$queryRaw<
      { nameEn: string | null; nameHi: string | null; visible: boolean }[]
    >(Prisma.sql`
      SELECT name_en AS "nameEn", name_hi AS "nameHi",
        (status = 'approved' AND deleted_at IS NULL) AS visible
      FROM businesses WHERE id = ${businessId}::uuid`);
    return rows[0] ?? null;
  }
}
