import { Injectable } from '@nestjs/common';
import type { MyReview } from '@apnatown/shared/reviews';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type { MyReviewsRepository } from '../domain/my-reviews';
import { iso } from './review-sql';

type Row = {
  id: string;
  targetType: MyReview['targetType'];
  targetId: string;
  rating: number;
  text: string;
  status: MyReview['status'];
  helpfulCount: number;
  ownerReply: string | null;
  createdAt: string;
  productNameEn: string | null;
  productNameHi: string | null;
  productSlug: string | null;
  serviceNameEn: string | null;
  serviceNameHi: string | null;
  serviceSlug: string | null;
  businessNameEn: string | null;
  businessNameHi: string | null;
  businessSlug: string | null;
  businessKind: 'shop' | 'provider' | null;
};

@Injectable()
export class PrismaMyReviewsRepository implements MyReviewsRepository {
  constructor(private readonly db: PrismaDatabase) {}

  async mine(tx: TxContext, userId: string): Promise<MyReview[]> {
    const rows = await this.db.client(tx).$queryRaw<Row[]>(Prisma.sql`
      SELECT r.id::text AS id, r.target_type AS "targetType",
        r.target_id::text AS "targetId", r.rating::integer AS rating, r.text,
        r.status::text AS status, r.helpful_count AS "helpfulCount",
        NULLIF(btrim(r.owner_reply), '') AS "ownerReply",
        ${iso(Prisma.sql`r.created_at`)} AS "createdAt",
        p.name_en AS "productNameEn", p.name_hi AS "productNameHi",
        p.slug AS "productSlug",
        s.name_en AS "serviceNameEn", s.name_hi AS "serviceNameHi",
        s.slug AS "serviceSlug",
        b.name_en AS "businessNameEn", b.name_hi AS "businessNameHi",
        b.slug AS "businessSlug", b.kind AS "businessKind"
      FROM reviews r
      LEFT JOIN products p ON r.target_type = 'product' AND p.id = r.target_id
      LEFT JOIN services s ON r.target_type = 'service' AND s.id = r.target_id
      LEFT JOIN businesses b ON r.target_type = 'business' AND b.id = r.target_id
      WHERE r.author_user_id = ${userId}::uuid AND r.status <> 'deleted'
      ORDER BY r.created_at DESC, r.id DESC
      LIMIT 50`);
    return rows.map((row) => {
      const path = row.productSlug
        ? `/product/${row.productSlug}`
        : row.serviceSlug
          ? `/service/${row.serviceSlug}`
          : row.businessSlug && row.businessKind
            ? `/${row.businessKind}/${row.businessSlug}`
            : null;
      return {
        id: row.id,
        targetType: row.targetType,
        targetId: row.targetId,
        targetNameEn:
          row.productNameEn ?? row.serviceNameEn ?? row.businessNameEn,
        targetNameHi:
          row.productNameHi ?? row.serviceNameHi ?? row.businessNameHi,
        targetPath: path,
        rating: row.rating,
        text: row.text,
        status: row.status,
        helpfulCount: row.helpfulCount,
        ownerReply: row.ownerReply,
        createdAt: row.createdAt,
      };
    });
  }
}
