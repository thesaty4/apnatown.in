import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  CheckoutRepository,
  StoredAttempt,
  StoredQuote,
} from '../application/checkout-ports';

/** Owner (user) is always a predicate; parameterized SQL only. */
@Injectable()
export class PrismaCheckoutRepository implements CheckoutRepository {
  constructor(private readonly db: PrismaDatabase) {}

  async insertQuote(tx: TxContext, input: Parameters<CheckoutRepository['insertQuote']>[1]) {
    const q = input.quote;
    await this.db.client(tx).$executeRaw`
      INSERT INTO checkout_quotes (id,cart_id,user_id,cart_version,address_id,address_version,
        input_hash,pricing_revision,snapshot,created_at,expires_at)
      VALUES (${q.quoteId}::uuid,${input.cartId}::uuid,${input.userId}::uuid,${q.cartVersion},
        ${q.addressId}::uuid,${q.addressVersion},${input.inputHash},${q.pricingRevision},
        ${JSON.stringify(q)}::jsonb,${input.at},${new Date(q.expiresAt)})`;
  }

  async findQuote(tx: TxContext, quoteId: string, userId: string) {
    const rows = await this.db.client(tx).$queryRaw<StoredQuote[]>(Prisma.sql`
      SELECT q.id::text AS id,q.cart_id::text AS "cartId",q.cart_version AS "cartVersion",
        q.address_id::text AS "addressId",q.address_version AS "addressVersion",
        q.snapshot,q.expires_at AS "expiresAt"
      FROM checkout_quotes q WHERE q.id=${quoteId}::uuid AND q.user_id=${userId}::uuid`);
    return rows[0] ?? null;
  }

  async insertAttempt(tx: TxContext, input: Parameters<CheckoutRepository['insertAttempt']>[1]) {
    await this.db.client(tx).$executeRaw`
      INSERT INTO checkout_attempts (id,user_id,cart_id,quote_id,idempotency_key,request_hash,status,
        payment_method,payment_round,expires_at,version,created_at,updated_at)
      VALUES (${input.id}::uuid,${input.userId}::uuid,${input.cartId}::uuid,${input.quoteId}::uuid,
        ${input.keyHash},${input.requestHash},'placed',${input.paymentMethod},1,${input.expiresAt},1,
        ${input.at},${input.at})`;
  }

  async findAttempt(tx: TxContext, attemptId: string, userId: string) {
    const rows = await this.db.client(tx).$queryRaw<StoredAttempt[]>(Prisma.sql`
      SELECT a.id::text AS id,a.quote_id::text AS "quoteId",a.status,
        a.payment_method AS "paymentMethod",a.payment_round AS "paymentRound",a.version,
        a.created_at AS "createdAt"
      FROM checkout_attempts a WHERE a.id=${attemptId}::uuid AND a.user_id=${userId}::uuid`);
    return rows[0] ?? null;
  }
}
