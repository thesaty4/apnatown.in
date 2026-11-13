import { Inject, Injectable } from '@nestjs/common';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import type { GuestCartPurgeStore } from '../application/guest-cart-purge';

@Injectable()
export class PrismaGuestCartPurgeStore implements GuestCartPurgeStore {
  constructor(
    private readonly database: PrismaDatabase,
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
  ) {}
  async purgeExpired(ttlSeconds: number, limit: number): Promise<number> {
    if (!Number.isInteger(ttlSeconds) || ttlSeconds < 1)
      throw new Error('INVALID_GUEST_CART_TTL');
    if (!Number.isInteger(limit) || limit < 1 || limit > 500)
      throw new Error('INVALID_GUEST_CART_PURGE_BATCH');
    // Same freshness rule as the guest capability (updated_at within TTL);
    // cart_lines go via ON DELETE CASCADE. Uses carts_guest_expiry_idx.
    return this.uow.run((tx) =>
      this.database.client(tx).$executeRaw`
        DELETE FROM carts WHERE id IN (
          SELECT id FROM carts
          WHERE user_id IS NULL
            AND updated_at < CURRENT_TIMESTAMP - make_interval(secs => ${ttlSeconds})
          ORDER BY updated_at, id LIMIT ${limit} FOR UPDATE SKIP LOCKED
        )`,
    );
  }
}
