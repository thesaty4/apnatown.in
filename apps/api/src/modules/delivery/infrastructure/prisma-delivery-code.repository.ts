import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  DeliveryCodeRepository,
  NewDeliveryCode,
  StoredDeliveryCode,
} from '../domain/delivery-code';

const columns = Prisma.sql`
  c.id::text AS id,c.order_id::text AS "orderId",c.kind,c.generation,
  c.code_hash AS "codeHash",c.code_ciphertext AS "codeCiphertext",c.attempts,
  c.max_attempts AS "maxAttempts",c.issued_at AS "issuedAt",c.expires_at AS "expiresAt",
  c.reissue_available_at AS "reissueAvailableAt",c.consumed_at AS "consumedAt",
  c.invalidated_at AS "invalidatedAt",c.locked_at AS "lockedAt"`;

/** Delivery-owned `delivery_codes`; parameterized SQL only, no plaintext. */
@Injectable()
export class PrismaDeliveryCodeRepository implements DeliveryCodeRepository {
  constructor(private readonly db: PrismaDatabase) {}

  async live(tx: TxContext, orderId: string, lock: boolean) {
    const forUpdate = lock ? Prisma.sql`FOR UPDATE` : Prisma.empty;
    const rows = await this.db.client(tx).$queryRaw<StoredDeliveryCode[]>(Prisma.sql`
      SELECT ${columns} FROM delivery_codes c
      WHERE c.order_id=${orderId}::uuid AND c.consumed_at IS NULL AND c.invalidated_at IS NULL
      ORDER BY c.generation DESC LIMIT 1 ${forUpdate}`);
    return rows[0] ?? null;
  }

  async latest(tx: TxContext, orderId: string) {
    const rows = await this.db.client(tx).$queryRaw<StoredDeliveryCode[]>(Prisma.sql`
      SELECT ${columns} FROM delivery_codes c WHERE c.order_id=${orderId}::uuid
      ORDER BY (c.consumed_at IS NULL AND c.invalidated_at IS NULL) DESC,c.issued_at DESC,
        c.generation DESC LIMIT 1`);
    return rows[0] ?? null;
  }

  async insert(tx: TxContext, code: NewDeliveryCode) {
    await this.db.client(tx).$executeRaw`
      INSERT INTO delivery_codes (id,order_id,kind,generation,code_hash,code_ciphertext,
        hash_key_version,encryption_key_version,attempts,max_attempts,issued_at,expires_at,
        reissue_available_at)
      VALUES (${code.id}::uuid,${code.orderId}::uuid,${code.kind},${code.generation},
        ${Buffer.from(code.codeHash)},${Buffer.from(code.codeCiphertext)},
        'otp-hmac-v1','pii-aesgcm-v1',0,5,${code.issuedAt},${code.expiresAt},
        ${code.reissueAvailableAt})`;
  }

  async invalidateLive(tx: TxContext, orderId: string, at: Date) {
    await this.db.client(tx).$executeRaw`
      UPDATE delivery_codes SET invalidated_at=${at},code_ciphertext=NULL
      WHERE order_id=${orderId}::uuid AND consumed_at IS NULL AND invalidated_at IS NULL`;
  }

  async recordFailure(tx: TxContext, id: string, at: Date) {
    const rows = await this.db.client(tx).$queryRaw<StoredDeliveryCode[]>(Prisma.sql`
      UPDATE delivery_codes c SET attempts=c.attempts+1,
        locked_at=CASE WHEN c.attempts+1 >= c.max_attempts THEN ${at} ELSE c.locked_at END
      WHERE c.id=${id}::uuid RETURNING ${columns}`);
    if (!rows[0]) throw new Error('DELIVERY_CODE_MISSING');
    return rows[0];
  }

  async consume(
    tx: TxContext,
    input: { id: string; handoverId: string; actorUserId: string; at: Date },
  ) {
    const count = await this.db.client(tx).$executeRaw`
      UPDATE delivery_codes SET consumed_at=${input.at},consumed_handover_id=${input.handoverId}::uuid,
        consumed_by=${input.actorUserId}::uuid,code_ciphertext=NULL
      WHERE id=${input.id}::uuid AND consumed_at IS NULL AND invalidated_at IS NULL
        AND locked_at IS NULL`;
    return count === 1;
  }
}
