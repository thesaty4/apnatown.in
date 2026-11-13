import { Inject, Injectable } from '@nestjs/common';
import {
  ProductOwnerPageSchema,
  type ProductOwner,
  type ProductOwnerListQuery,
  type ProductOwnerPage,
} from '@apnatown/shared/products';
import {
  FEATURED_ENTITLEMENT_READ,
  type FeaturedEntitlementReadPort,
} from '../../../shared/entitlements/featured-entitlement';
import { DomainError } from '../../../shared/errors/errors';
import {
  CURSOR_CODEC,
  CursorCodec,
  type CursorBinding,
} from '../../../shared/pagination/cursor';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import {
  ProductOwnerAccess,
  ownedProduct,
  type ProductOwnerRequest,
} from './product-owner-access';
import {
  PRODUCT_OWNER_REPOSITORY,
  type ProductOwnerRepository,
  type ProductPosition,
} from './product-owner-ports';
import { productListItemDto, productOwnerDto } from './product-rules';

/** Decodes a `(createdAt,id)` keyset cursor bound to `binding`. */
export function cursorPosition(
  cursors: CursorCodec,
  cursor: string | undefined,
  binding: CursorBinding,
): ProductPosition | undefined {
  if (!cursor) return undefined;
  const [createdAt, id] = cursors.decode(cursor, binding);
  if (typeof createdAt !== 'string' || typeof id !== 'string')
    throw new DomainError('COMMON_VALIDATION_FAILED');
  return { createdAt, id };
}

/**
 * Owner product manager reads (F-VD-004, F-PV-005; S-VEND-05, S-PROV-06).
 * Scoped to the caller's own approved business resolved from the session.
 */
@Injectable()
export class ProductOwnerService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(PRODUCT_OWNER_REPOSITORY)
    private readonly products: ProductOwnerRepository,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    private readonly access: ProductOwnerAccess,
    @Inject(FEATURED_ENTITLEMENT_READ)
    private readonly entitlements: FeaturedEntitlementReadPort,
  ) {}

  /** Non-deleted products, newest first; allow-listed query/stock filters. */
  list(
    request: ProductOwnerRequest,
    input: ProductOwnerListQuery,
  ): Promise<ProductOwnerPage> {
    return this.uow.run(async (tx) => {
      const business = await this.access.resolve(tx, request);
      const binding: CursorBinding = {
        operation: 'products.owner.list',
        sort: 'createdAt-desc-id-desc',
        filters: { query: input.query ?? null, stock: input.stock ?? null },
        scope: { businessId: business.id },
      };
      const after = cursorPosition(this.cursors, input.cursor, binding);
      const rows = await this.products.page(tx, {
        businessId: business.id,
        ...(input.query ? { query: input.query } : {}),
        ...(input.stock ? { stock: input.stock } : {}),
        ...(after ? { after } : {}),
        limit: input.limit,
      });
      const entitled = await this.entitlements.isPremium(business.id, tx);
      const page = rows.slice(0, input.limit);
      const last = page.at(-1);
      return ProductOwnerPageSchema.parse({
        items: page.map((row) => productListItemDto(row, business, entitled)),
        nextCursor:
          rows.length > input.limit && last
            ? this.cursors.encode(binding, [
                last.createdAt.toISOString(),
                last.id,
              ])
            : null,
      });
    });
  }

  detail(
    request: ProductOwnerRequest,
    productId: string,
  ): Promise<ProductOwner> {
    return this.uow.run(async (tx) => {
      const business = await this.access.resolve(tx, request);
      const row = ownedProduct(
        await this.products.find(tx, productId),
        business,
      );
      const variants = await this.products.variants(tx, row.id);
      const entitled = await this.entitlements.isPremium(business.id, tx);
      return productOwnerDto(row, variants, business, entitled);
    });
  }
}
