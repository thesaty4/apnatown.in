import { Injectable } from '@nestjs/common';
import type { OfferCreate } from '@apnatown/shared/offers';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type { OwnerOfferRepository, StoredOffer } from '../domain/owner-offers';

const iso = (column: Prisma.Sql) =>
  Prisma.sql`to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`;

const COLUMNS = Prisma.sql`o.id::text AS id, o.business_id::text AS "businessId",
  o.title_en AS "titleEn", o.title_hi AS "titleHi", o.discount_type AS "discountType",
  o.discount_percent::integer AS "discountPercent", o.discount_paise::float8 AS "discountPaise",
  ${iso(Prisma.sql`o.valid_from`)} AS "validFrom", ${iso(Prisma.sql`o.valid_to`)} AS "validTo",
  o.status, o.review_decision AS "reviewDecision", o.rejection_reason AS "rejectionReason",
  o.views_count::float8 AS "viewsCount", o.uses_count::float8 AS "usesCount",
  o.version, ${iso(Prisma.sql`o.created_at`)} AS "createdAt"`;

const fields = (input: OfferCreate) => ({
  titleHi: input.titleHi,
  percent: input.discountType === 'percent' ? input.discountPercent : null,
  paise: input.discountType === 'flat' ? input.discountPaise : null,
});

/** Parameterized SQL only; every statement is scoped by the owner's business. */
@Injectable()
export class PrismaOwnerOfferRepository implements OwnerOfferRepository {
  constructor(private readonly db: PrismaDatabase) {}

  page(tx: TxContext, input: Parameters<OwnerOfferRepository['page']>[1]): Promise<StoredOffer[]> {
    const status = input.status ? Prisma.sql`AND o.status = ${input.status}` : Prisma.empty;
    const after = input.after
      ? Prisma.sql`AND (o.created_at, o.id) < (${input.after.createdAt}::timestamptz, ${input.after.id}::uuid)`
      : Prisma.empty;
    return this.db.client(tx).$queryRaw<StoredOffer[]>(Prisma.sql`
      SELECT ${COLUMNS} FROM offers o
      WHERE o.business_id = ${input.businessId}::uuid ${status} ${after}
      ORDER BY o.created_at DESC, o.id DESC LIMIT ${input.take}`);
  }

  async find(tx: TxContext, input: { id: string; businessId: string; lock: boolean }) {
    const rows = await this.db.client(tx).$queryRaw<StoredOffer[]>(Prisma.sql`
      SELECT ${COLUMNS} FROM offers o
      WHERE o.id = ${input.id}::uuid AND o.business_id = ${input.businessId}::uuid
      ${input.lock ? Prisma.sql`FOR UPDATE` : Prisma.empty}`);
    return rows[0] ?? null;
  }

  async insert(tx: TxContext, input: OfferCreate & { id: string; businessId: string; at: Date }) {
    const f = fields(input);
    await this.db.client(tx).$executeRaw(Prisma.sql`
      INSERT INTO offers (id, business_id, title_en, title_hi, discount_type, discount_percent,
        discount_paise, scope, valid_from, valid_to, status, created_at, updated_at)
      VALUES (${input.id}::uuid, ${input.businessId}::uuid, ${input.titleEn}, ${f.titleHi},
        ${input.discountType}, ${f.percent}::smallint, ${f.paise}::bigint, 'business',
        ${input.validFrom}::timestamptz, ${input.validTo}::timestamptz, 'pending', ${input.at}, ${input.at})`);
  }

  async update(
    tx: TxContext,
    input: OfferCreate & { id: string; businessId: string; expectedVersion: number; at: Date },
  ) {
    const f = fields(input);
    const changed = await this.db.client(tx).$executeRaw(Prisma.sql`
      UPDATE offers SET title_en = ${input.titleEn}, title_hi = ${f.titleHi},
        discount_type = ${input.discountType}, discount_percent = ${f.percent}::smallint,
        discount_paise = ${f.paise}::bigint, valid_from = ${input.validFrom}::timestamptz,
        valid_to = ${input.validTo}::timestamptz, status = 'pending', review_decision = NULL,
        rejection_reason = NULL, version = version + 1, updated_at = ${input.at}
      WHERE id = ${input.id}::uuid AND business_id = ${input.businessId}::uuid
        AND version = ${input.expectedVersion} AND status <> 'ended'`);
    return changed === 1;
  }

  async setStatus(tx: TxContext, input: Parameters<OwnerOfferRepository['setStatus']>[1]) {
    const changed = await this.db.client(tx).$executeRaw(Prisma.sql`
      UPDATE offers SET status = ${input.status}, version = version + 1, updated_at = ${input.at}
      WHERE id = ${input.id}::uuid AND business_id = ${input.businessId}::uuid
        AND version = ${input.expectedVersion}`);
    return changed === 1;
  }
}
