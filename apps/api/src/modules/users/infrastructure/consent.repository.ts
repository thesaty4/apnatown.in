import { Injectable } from '@nestjs/common';
import type { ConsentChannel, ConsentPurpose } from '@apnatown/shared/users';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type { ConsentRepository, StoredConsent } from '../domain/consent';

// Text timestamps preserve PostgreSQL microseconds for evidence ordering.
const columns = Prisma.sql`
  id, user_id AS "userId", purpose, channel, granted,
  notice_version AS "noticeVersion", source,
  to_char(recorded_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "recordedAt"`;

@Injectable()
export class PrismaConsentRepository implements ConsentRepository {
  constructor(private readonly database: PrismaDatabase) {}
  latestForUser(tx: TxContext, userId: string): Promise<StoredConsent[]> {
    // Registry CHECK bounds authenticated rows to the five registered pairs.
    return this.database.client(tx).$queryRaw<StoredConsent[]>(Prisma.sql`
      SELECT DISTINCT ON (purpose, channel) ${columns} FROM consents
      WHERE user_id = ${userId}::uuid
      ORDER BY purpose, channel, recorded_at DESC, id DESC`);
  }
  async latest(
    tx: TxContext,
    userId: string,
    purpose: ConsentPurpose,
    channel: ConsentChannel,
  ): Promise<StoredConsent | null> {
    const rows = await this.database.client(tx).$queryRaw<
      StoredConsent[]
    >(Prisma.sql`
      SELECT ${columns} FROM consents
      WHERE user_id = ${userId}::uuid AND purpose = ${purpose} AND channel = ${channel}
      ORDER BY recorded_at DESC, id DESC LIMIT 1`);
    return rows[0] ?? null;
  }
  async insert(tx: TxContext, row: StoredConsent): Promise<StoredConsent> {
    const rows = await this.database.client(tx).$queryRaw<
      StoredConsent[]
    >(Prisma.sql`
      INSERT INTO consents (id, user_id, purpose, channel, granted,
        notice_version, recorded_at, source)
      VALUES (${row.id}::uuid, ${row.userId}::uuid, ${row.purpose}, ${row.channel},
        ${row.granted}, ${row.noticeVersion}, ${row.recordedAt}::timestamptz, ${row.source})
      RETURNING ${columns}`);
    const stored = rows[0];
    if (!stored) throw new Error('CONSENT_INSERT_FAILED');
    return stored;
  }
}
