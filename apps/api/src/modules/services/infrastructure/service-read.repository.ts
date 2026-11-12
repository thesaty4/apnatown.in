import { Injectable } from '@nestjs/common';
import { ServicePublicSchema } from '@apnatown/shared';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import { publicListingDetail } from '../../../shared/persistence/public-listing-detail';
import type { ServiceReadPort } from '../application/service-read.service';
import { servicePublicProjection } from './public-projection';
import { Prisma } from '../../../shared/persistence/generated/client';
import type { TxContext } from '../../../shared/persistence/ports';
import type { SavedServiceCard } from '../application/service-saved-cards';
@Injectable()
export class PrismaServiceReadRepository implements ServiceReadPort {
  constructor(private readonly db: PrismaDatabase) {}
  async publicCards(tx: TxContext, ids: readonly string[]): Promise<SavedServiceCard[]> {
    if (ids.length === 0) return [];
    if (ids.length > 50) throw new Error('SERVICE_CARD_BATCH_LIMIT');
    return this.db.client(tx).$queryRaw<SavedServiceCard[]>(Prisma.sql`
      SELECT s.id,s.name_en AS "labelEn",s.name_hi AS "labelHi",'/service/'||s.slug AS "canonicalPath"
      FROM (${servicePublicProjection}) s WHERE s.id=ANY(${[...ids]}::uuid[])`);
  }
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
