import { Injectable } from '@nestjs/common';
import { ProductPublicSchema } from '@apnatown/shared';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import { publicListingDetail } from '../../../shared/persistence/public-listing-detail';
import type { ProductReadPort } from '../application/product-read.service';
import { productPublicProjection } from './public-projection';

@Injectable()
export class PrismaProductReadRepository implements ProductReadPort {
  constructor(private readonly db: PrismaDatabase) {}
  bySlug(slug: string) {
    return this.db.transaction(async (tx) => {
      const client = this.db.client(tx);
      await client.$executeRaw`SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY`;
      const result = await publicListingDetail(client,productPublicProjection,slug);
      return result ? ProductPublicSchema.parse({
        ...result, orderability: { orderable: false, reasonCode: 'CHECKOUT_UNAVAILABLE' },
      }) : null;
    });
  }
}
