import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  BusinessEnquiryStatsPort,
  EnquiryCohortStats,
} from '../../businesses/application/business-enquiry-stats-port';

const IST = 'Asia/Kolkata';

/** Parameterized SQL only; Services owns `enquiries`. */
@Injectable()
export class PrismaEnquiryStatsRepository implements BusinessEnquiryStatsPort {
  constructor(private readonly db: PrismaDatabase) {}

  async cohort(
    tx: TxContext,
    input: { businessId: string; fromIstDate: string; toIstDate: string },
  ): Promise<EnquiryCohortStats> {
    const rows = await this.db.client(tx).$queryRaw<
      { date: string; status: string; count: number }[]
    >(Prisma.sql`
      SELECT to_char(created_at AT TIME ZONE ${IST}, 'YYYY-MM-DD') AS date,
        status, count(*)::float8 AS count
      FROM enquiries
      WHERE business_id = ${input.businessId}::uuid
        AND created_at >= (${input.fromIstDate}::date)::timestamp AT TIME ZONE ${IST}
        AND created_at < (${input.toIstDate}::date + 1)::timestamp AT TIME ZONE ${IST}
      GROUP BY 1, 2`);
    const daily = new Map<string, number>();
    const statusCounts: Record<string, number> = {};
    let total = 0;
    for (const row of rows) {
      daily.set(row.date, (daily.get(row.date) ?? 0) + row.count);
      statusCounts[row.status] = (statusCounts[row.status] ?? 0) + row.count;
      total += row.count;
    }
    return { daily, statusCounts, total, converted: statusCounts.converted ?? 0 };
  }
}
