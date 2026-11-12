import { Injectable } from '@nestjs/common';
import { BusinessDiscoveryDetailSchema, type BusinessDiscoveryDetail } from '@apnatown/shared';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import { publicListingDetail } from '../../../shared/persistence/public-listing-detail';
import type { BusinessDiscoveryDetailPort } from '../application/business-discovery-detail.service';
import { businessPublicProjection } from './public-projection';
@Injectable()
export class PrismaBusinessDiscoveryDetailRepository implements BusinessDiscoveryDetailPort {
  constructor(private readonly db: PrismaDatabase) {}
  bySlug(slug: string) {
    return this.db.transaction(async (tx) => {
      const client = this.db.client(tx);
      await client.$executeRaw`SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY`;
      const result = await publicListingDetail(client,businessPublicProjection,slug);
      if (!result) return null;
      const hours = await client.$queryRaw<BusinessDiscoveryDetail['hours']>`
        SELECT day_of_week AS "dayOfWeek",to_char(opens_at,'HH24:MI') AS "opensAt",
          to_char(closes_at,'HH24:MI') AS "closesAt",is_closed AS "isClosed"
        FROM business_hours WHERE business_id=${result.item.id}::uuid ORDER BY day_of_week`;
      return BusinessDiscoveryDetailSchema.parse({ ...result,hours });
    });
  }
}
