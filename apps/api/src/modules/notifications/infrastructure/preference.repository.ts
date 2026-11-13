import { Injectable } from '@nestjs/common';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  PreferenceRepository,
  PreferenceValues,
  StoredPreferences,
} from '../domain/notification';

/** Parameterized SQL only; one row per user (absent = display defaults). */
@Injectable()
export class PrismaPreferenceRepository implements PreferenceRepository {
  constructor(private readonly db: PrismaDatabase) {}

  async find(
    tx: TxContext,
    userId: string,
  ): Promise<StoredPreferences | null> {
    const rows = await this.db.client(tx).$queryRaw<StoredPreferences[]>`
      SELECT inapp,email,wa_orders,wa_offers,wa_enq,version
      FROM notification_preferences WHERE user_id=${userId}::uuid`;
    return rows[0] ?? null;
  }

  async lockOrCreate(
    tx: TxContext,
    userId: string,
    defaults: PreferenceValues,
    at: Date,
  ): Promise<StoredPreferences> {
    await this.db.client(tx).$executeRaw`
      INSERT INTO notification_preferences (user_id,inapp,email,wa_orders,
        wa_offers,wa_enq,version,updated_at)
      VALUES (${userId}::uuid,${defaults.inapp},${defaults.email},
        ${defaults.wa_orders},${defaults.wa_offers},${defaults.wa_enq},1,${at})
      ON CONFLICT (user_id) DO NOTHING`;
    const rows = await this.db.client(tx).$queryRaw<StoredPreferences[]>`
      SELECT inapp,email,wa_orders,wa_offers,wa_enq,version
      FROM notification_preferences WHERE user_id=${userId}::uuid FOR UPDATE`;
    const row = rows[0];
    if (!row) throw new Error('NOTIFICATION_PREFERENCES_MISSING');
    return row;
  }

  async update(
    tx: TxContext,
    userId: string,
    values: PreferenceValues,
    version: number,
    at: Date,
  ): Promise<void> {
    await this.db.client(tx).$executeRaw`
      UPDATE notification_preferences SET inapp=${values.inapp},
        email=${values.email},wa_orders=${values.wa_orders},
        wa_offers=${values.wa_offers},wa_enq=${values.wa_enq},
        version=${version},updated_at=${at}
      WHERE user_id=${userId}::uuid`;
  }
}
