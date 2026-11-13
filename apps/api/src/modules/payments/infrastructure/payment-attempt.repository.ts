import { Inject, Injectable } from '@nestjs/common';
import type { OrderPaymentSummary, PaymentMethod } from '@apnatown/shared/orders';
import { DomainError } from '../../../shared/errors/errors';
import { EVENT_FACTORY, type EventFactory } from '../../../shared/events/event-factory';
import { OUTBOX_WRITER, type OutboxWriter } from '../../../shared/events/ports';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type { CashAllocation, PaymentOrderPort } from '../application/payment-order-port';

type Row = {
  id: string;
  method: PaymentMethod;
  status: OrderPaymentSummary['status'];
  amountPaise: number;
  currentPayablePaise: number;
  fundedPaise: number;
  returnedPaise: number;
  financialVersion: number;
  version: number;
  closed: boolean;
  collectedAt: Date | null;
};

const columns = Prisma.sql`
  pa.id::text AS id,pa.method,pa.status,pa.amount_paise::float8 AS "amountPaise",
  pa.current_payable_paise::float8 AS "currentPayablePaise",
  pa.funded_paise::float8 AS "fundedPaise",pa.returned_paise::float8 AS "returnedPaise",
  pa.financial_version AS "financialVersion",pa.version,
  (pa.closed_at IS NOT NULL) AS closed,pa.collected_at AS "collectedAt"`;

/** Outstanding = current uncollected contractual cash due (never after close). */
function summary(row: Row): OrderPaymentSummary {
  const cash = row.method === 'cash';
  const outstanding =
    cash && row.status === 'pending' && !row.closed
      ? Math.max(0, row.currentPayablePaise - row.fundedPaise)
      : 0;
  return {
    paymentAttemptId: row.id,
    method: row.method,
    settlementKind: cash ? 'cash' : 'provider',
    status: row.status,
    fundingSatisfied: row.status === 'paid' || row.status === 'collected' || row.status === 'refunded',
    orderedAmountPaise: row.amountPaise,
    currentPayablePaise: row.currentPayablePaise,
    fundedPaise: row.fundedPaise,
    refundedPaise: row.returnedPaise,
    outstandingPaise: outstanding,
    collectedAt: row.collectedAt ? row.collectedAt.toISOString() : null,
  };
}

/** Payments-owned `payment_attempts`; parameterized SQL only. */
@Injectable()
export class PrismaPaymentAttemptRepository implements PaymentOrderPort {
  constructor(
    private readonly db: PrismaDatabase,
    @Inject(EVENT_FACTORY) private readonly events: EventFactory,
    @Inject(OUTBOX_WRITER) private readonly outbox: OutboxWriter,
  ) {}

  async createCashAllocations(
    tx: TxContext,
    input: Parameters<PaymentOrderPort['createCashAllocations']>[1],
  ) {
    for (const allocation of input.allocations) await this.insert(tx, input, allocation);
  }

  private async insert(
    tx: TxContext,
    input: Parameters<PaymentOrderPort['createCashAllocations']>[1],
    allocation: CashAllocation,
  ) {
    await this.db.client(tx).$executeRaw`
      INSERT INTO payment_attempts (id,checkout_attempt_id,quote_id,payment_round,business_id,
        initiated_by,purpose,amount_paise,current_payable_paise,method,status,
        idempotency_key,request_hash,created_at,updated_at)
      VALUES (${allocation.id}::uuid,${input.checkoutAttemptId}::uuid,${input.quoteId}::uuid,
        ${input.paymentRound},${allocation.businessId}::uuid,${input.initiatedBy}::uuid,'order',
        ${allocation.amountPaise}::bigint,${allocation.amountPaise}::bigint,'cash','pending',
        ${input.idempotencyKey},${input.requestHash},${input.at},${input.at})`;
  }

  async linkOrder(tx: TxContext, input: { paymentAttemptId: string; orderId: string; at: Date }) {
    const count = await this.db.client(tx).$executeRaw`
      UPDATE payment_attempts SET order_id=${input.orderId}::uuid,updated_at=${input.at}
      WHERE id=${input.paymentAttemptId}::uuid AND order_id IS NULL`;
    if (count !== 1) throw new Error('PAYMENT_ATTEMPT_LINK_FAILED');
  }

  async summary(tx: TxContext, orderId: string, lock = false) {
    const forUpdate = lock ? Prisma.sql`FOR UPDATE` : Prisma.empty;
    const rows = await this.db.client(tx).$queryRaw<Row[]>(Prisma.sql`
      SELECT ${columns} FROM payment_attempts pa
      WHERE pa.order_id=${orderId}::uuid ORDER BY pa.created_at DESC,pa.id DESC LIMIT 1 ${forUpdate}`);
    return rows[0] ? summary(rows[0]) : null;
  }

  async listing(tx: TxContext, orderIds: readonly string[]) {
    if (!orderIds.length) return new Map();
    const rows = await this.db.client(tx).$queryRaw<
      { orderId: string; method: PaymentMethod; status: OrderPaymentSummary['status'] }[]
    >(Prisma.sql`
      SELECT DISTINCT ON (pa.order_id) pa.order_id::text AS "orderId",pa.method,pa.status
      FROM payment_attempts pa WHERE pa.order_id = ANY(${[...orderIds]}::uuid[])
      ORDER BY pa.order_id,pa.created_at DESC,pa.id DESC`);
    return new Map(rows.map((row) => [row.orderId, { method: row.method, status: row.status }]));
  }

  async recordCashCollection(
    tx: TxContext,
    input: Parameters<PaymentOrderPort['recordCashCollection']>[1],
  ) {
    const before = await this.summary(tx, input.orderId, true);
    if (!before) throw new Error('PAYMENT_ATTEMPT_MISSING');
    const rows = await this.db.client(tx).$queryRaw<Row[]>(Prisma.sql`
      UPDATE payment_attempts pa SET status='collected',funded_paise=current_payable_paise,
        collection_key=${input.collectionKey},verified_handover_id=${input.verifiedHandoverId}::uuid,
        collected_by=${input.actorUserId}::uuid,collected_at=${input.at},
        version=version+1,updated_at=${input.at}
      WHERE pa.id=${before.paymentAttemptId}::uuid AND pa.method='cash' AND pa.status='pending'
        AND pa.closed_at IS NULL AND pa.financial_version=${input.expectedFinancialVersion}
      RETURNING ${columns}`);
    if (!rows[0]) throw new DomainError('DELIVERY_VERSION_CONFLICT');
    const after = summary(rows[0]);
    await this.outbox.append(
      tx,
      this.events.create(
        'payment.cash_collected',
        { type: 'payment_attempt', id: after.paymentAttemptId, version: rows[0].version },
        {
          orderId: input.orderId,
          paymentAttemptId: after.paymentAttemptId,
          collectionKey: input.collectionKey,
          amountPaise: after.fundedPaise,
          financialVersion: rows[0].financialVersion,
          collectedAt: input.at.toISOString(),
        },
        input.correlationId,
      ),
    );
    return after;
  }

  async closeForCancellation(tx: TxContext, orderId: string, at: Date) {
    await this.db.client(tx).$executeRaw`
      UPDATE payment_attempts SET closed_at=${at},version=version+1,updated_at=${at}
      WHERE order_id=${orderId}::uuid AND method='cash' AND status='pending' AND closed_at IS NULL`;
  }
}
