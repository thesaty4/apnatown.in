import { Injectable } from '@nestjs/common';
import type { Session } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type { StoredSession, SessionRepository } from '../domain/session';

@Injectable()
export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly database: PrismaDatabase) {}
  async findByHash(
    tx: TxContext,
    hash: Uint8Array,
  ): Promise<StoredSession | null> {
    const row = await this.database.client(tx).session.findUnique({
      where: { tokenHash: Uint8Array.from(hash) },
      select: { id: true },
    });
    return row ? this.lock(tx, row.id) : null;
  }
  async lock(tx: TxContext, id: string): Promise<StoredSession | null> {
    const db = this.database.client(tx);
    await db.$queryRaw`SELECT id FROM sessions WHERE id = ${id}::uuid FOR UPDATE`;
    const row = await db.session.findUnique({ where: { id } });
    return row ? fromRow(row) : null;
  }
  async insert(tx: TxContext, session: StoredSession): Promise<void> {
    await this.database.client(tx).session.create({
      data: {
        id: session.id,
        kind: session.kind,
        userId: session.userId,
        tokenHash: Uint8Array.from(session.tokenHash),
        csrfToken: session.csrfToken,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        revokedAt: null,
        lastSeenAt: session.lastSeenAt,
      },
    });
  }
  async revoke(tx: TxContext, id: string, now: Date): Promise<void> {
    await this.database.client(tx).session.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: now },
    });
  }
  async revokeUser(tx: TxContext, userId: string, now: Date): Promise<void> {
    await this.database.client(tx).session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    });
  }
  async touch(tx: TxContext, id: string, now: Date): Promise<void> {
    await this.database
      .client(tx)
      .session.update({ where: { id }, data: { lastSeenAt: now } });
  }
}
function fromRow(row: Session): StoredSession {
  if (
    (row.kind !== 'anonymous' && row.kind !== 'authenticated') ||
    (row.kind === 'anonymous') !== (row.userId === null)
  )
    throw new Error('INVALID_STORED_SESSION');
  return { ...row, kind: row.kind };
}
