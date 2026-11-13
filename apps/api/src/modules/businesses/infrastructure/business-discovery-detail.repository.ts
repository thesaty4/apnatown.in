import { Injectable } from '@nestjs/common';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import { publicListingDetail } from '../../../shared/persistence/public-listing-detail';
import type { BusinessDiscoveryDetailBase, BusinessDiscoveryDetailPort } from '../application/business-discovery-detail.service';
import { businessPublicProfile } from './business-public-profile';
import { businessPublicProjection } from './public-projection';
@Injectable()
export class PrismaBusinessDiscoveryDetailRepository implements BusinessDiscoveryDetailPort {
  constructor(private readonly db: PrismaDatabase) {}
  bySlug(slug: string): Promise<BusinessDiscoveryDetailBase | null> {
    return this.db.transaction(async (tx) => {
      const client = this.db.client(tx);
      await client.$executeRaw`SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY`;
      const result = await publicListingDetail(client,businessPublicProjection,slug);
      if (!result || result.item.kind !== 'shop') return null;
      const hours = await client.$queryRaw<BusinessDiscoveryDetailBase['hours']>`
        SELECT day_of_week AS "dayOfWeek",to_char(opens_at,'HH24:MI') AS "opensAt",
          to_char(closes_at,'HH24:MI') AS "closesAt",is_closed AS "isClosed"
        FROM business_hours WHERE business_id=${result.item.id}::uuid ORDER BY day_of_week`;
      const profile = await businessPublicProfile(client,result.item.id);
      if (!profile) return null;
      return { ...result,item: { ...result.item,kind: 'shop' as const },hours,profile };
    });
  }
}
