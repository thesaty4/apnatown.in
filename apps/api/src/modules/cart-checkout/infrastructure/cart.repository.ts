import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  CartLookup,
  CartOwner,
  CartRepository,
  NewCartLine,
  StoredCart,
  StoredCartLine,
} from '../application/cart-ports';

function ownerPredicate(owner: CartOwner): Prisma.Sql {
  return owner.kind === 'user'
    ? Prisma.sql`c.user_id = ${owner.userId}::uuid`
    : Prisma.sql`c.guest_cart_token_hash = ${Buffer.from(owner.tokenHash)}::bytea`;
}

/** Cart-checkout-owned `carts`/`cart_lines`; owner is always a predicate. */
@Injectable()
export class PrismaCartRepository implements CartRepository {
  constructor(private readonly db: PrismaDatabase) {}

  async find(tx: TxContext, owner: CartOwner, lookup: CartLookup) {
    const fresh =
      owner.kind === 'guest' && lookup.guestNotBefore
        ? Prisma.sql`AND c.updated_at >= ${lookup.guestNotBefore}`
        : Prisma.empty;
    const lock = lookup.lock ? Prisma.sql`FOR UPDATE` : Prisma.empty;
    const rows = await this.db.client(tx).$queryRaw<StoredCart[]>(Prisma.sql`
      SELECT c.id::text AS id,c.version FROM carts c
      WHERE ${ownerPredicate(owner)} ${fresh} ${lock}`);
    return rows[0] ?? null;
  }

  async create(tx: TxContext, id: string, owner: CartOwner, at: Date) {
    const userId = owner.kind === 'user' ? owner.userId : null;
    const hash = owner.kind === 'guest' ? Buffer.from(owner.tokenHash) : null;
    // Owner uniqueness resolves concurrent first adds; the loser gets no row.
    const rows = await this.db.client(tx).$queryRaw<StoredCart[]>(Prisma.sql`
      INSERT INTO carts (id,user_id,guest_cart_token_hash,version,created_at,updated_at)
      VALUES (${id}::uuid,${userId}::uuid,${hash}::bytea,1,${at},${at})
      ON CONFLICT DO NOTHING RETURNING id::text AS id,version`);
    return rows[0] ?? null;
  }

  async touch(tx: TxContext, cartId: string, at: Date) {
    const rows = await this.db.client(tx).$queryRaw<{ version: number }[]>(Prisma.sql`
      UPDATE carts SET version=version+1,updated_at=${at}
      WHERE id=${cartId}::uuid RETURNING version`);
    if (!rows[0]) throw new Error('CART_TOUCH_MISSING');
    return rows[0].version;
  }

  async deleteCart(tx: TxContext, cartId: string) {
    // Lines cascade with their cart.
    await this.db.client(tx).$executeRaw`DELETE FROM carts WHERE id=${cartId}::uuid`;
  }

  lines(tx: TxContext, cartId: string) {
    return this.db.client(tx).$queryRaw<StoredCartLine[]>(Prisma.sql`
      SELECT l.id::text AS id,l.version,l.product_id::text AS "productId",
        l.product_variant_id::text AS "variantId",l.quantity::int AS quantity,
        l.saved_for_later AS "savedForLater"
      FROM cart_lines l WHERE l.cart_id=${cartId}::uuid
      ORDER BY l.saved_for_later,l.created_at,l.id`);
  }

  async insertLine(tx: TxContext, line: NewCartLine) {
    await this.db.client(tx).$executeRaw`
      INSERT INTO cart_lines (id,cart_id,product_id,product_variant_id,quantity,
        saved_for_later,version,created_at,updated_at)
      VALUES (${line.id}::uuid,${line.cartId}::uuid,${line.productId}::uuid,
        ${line.variantId}::uuid,${line.quantity}::smallint,${line.savedForLater},1,
        ${line.at},${line.at})`;
  }

  async updateLine(
    tx: TxContext,
    lineId: string,
    change: { quantity: number; savedForLater: boolean; at: Date },
  ) {
    await this.db.client(tx).$executeRaw`
      UPDATE cart_lines SET quantity=${change.quantity}::smallint,
        saved_for_later=${change.savedForLater},version=version+1,updated_at=${change.at}
      WHERE id=${lineId}::uuid`;
  }

  async deleteLine(tx: TxContext, lineId: string) {
    await this.db.client(tx).$executeRaw`DELETE FROM cart_lines WHERE id=${lineId}::uuid`;
  }
}
