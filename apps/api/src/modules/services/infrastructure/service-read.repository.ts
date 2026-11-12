import { Injectable } from '@nestjs/common';
import { ServicePublicSchema } from '@apnatown/shared';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import { publicListingDetail } from '../../../shared/persistence/public-listing-detail';
import type { ServiceReadPort } from '../application/service-read.service';
import { servicePublicProjection } from './public-projection';
@Injectable()
export class PrismaServiceReadRepository implements ServiceReadPort {
  constructor(private readonly db: PrismaDatabase) {}
  bySlug(slug: string) {
    return this.db.transaction(async (tx) => {
      const client = this.db.client(tx);
      await client.$executeRaw`SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY`;
      const result = await publicListingDetail(client,servicePublicProjection,slug);
      if (!result) return null;
      const extra = await client.$queryRaw<{ included: string[]; excluded: string[]; serviceArea: string | null; experienceYears: number | null }[]>`
        SELECT included,excluded,service_area AS "serviceArea",experience_years AS "experienceYears"
        FROM services WHERE id=${result.item.id}::uuid`;
      return ServicePublicSchema.parse({ ...result,...extra[0] });
    });
  }
}
