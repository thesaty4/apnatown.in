import { Inject, Injectable } from '@nestjs/common';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import type { AuthCleanup } from '../application/cleanup';

@Injectable()
export class PrismaAuthCleanup implements AuthCleanup {
  constructor(
    private readonly database: PrismaDatabase,
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
  ) {}
  async batch(limit: number): Promise<void> {
    await this.uow.run(async (tx) => {
      const db = this.database.client(tx);
      // Retain revoked rows until expiry so bootstrap can identify revoked
      // authenticated credentials rather than silently renewing their context.
      await db.$executeRaw`
        DELETE FROM sessions WHERE id IN (
          SELECT id FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP
          ORDER BY expires_at, id LIMIT ${limit} FOR UPDATE SKIP LOCKED
        )`;
      // Retain the full rolling-hour rate-limit history, even after OTP expiry.
      await db.$executeRaw`
        DELETE FROM otp_challenges WHERE id IN (
          SELECT id FROM otp_challenges WHERE expires_at <= CURRENT_TIMESTAMP
            AND created_at < CURRENT_TIMESTAMP - INTERVAL '1 hour'
          ORDER BY expires_at, id LIMIT ${limit} FOR UPDATE SKIP LOCKED
        )`;
    });
  }
}
