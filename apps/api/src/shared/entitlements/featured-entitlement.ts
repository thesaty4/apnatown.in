import { Injectable } from '@nestjs/common';
import { Prisma } from '../persistence/generated/client';
import { PrismaDatabase } from '../persistence/prisma-database';
import type { TxContext } from '../persistence/ports';

export const FEATURED_ENTITLEMENT_READ = Symbol('FEATURED_ENTITLEMENT_READ');

/** Read-only view of Payments' current Premium featured entitlement. */
export interface FeaturedEntitlementReadPort {
  /** True only with current verified evidence; fails closed otherwise. */
  isPremium(businessId: string, tx?: TxContext): Promise<boolean>;
}

/**
 * Single implementation over the Payments-owned `payments_featured_eligibility`
 * projection (legacy/unverified evidence is already excluded there).
 */
@Injectable()
export class PrismaFeaturedEntitlementRead implements FeaturedEntitlementReadPort {
  constructor(private readonly db: PrismaDatabase) {}

  async isPremium(businessId: string, tx?: TxContext): Promise<boolean> {
    const query = Prisma.sql`SELECT EXISTS(SELECT 1 FROM payments_featured_eligibility
      WHERE business_id = ${businessId}::uuid) AS entitled`;
    const rows = tx
      ? await this.db.client(tx).$queryRaw<{ entitled: boolean }[]>(query)
      : await this.db.queryRaw<{ entitled: boolean }[]>(query);
    return rows[0]?.entitled === true;
  }
}
