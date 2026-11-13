import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import {
  AdminListingProductPageSchema,
  type AdminListingProductPage,
} from '@apnatown/shared/admin';
import { IdSchema, TimestampSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import {
  ADMIN_SCOPE,
  type AdminReadContext,
  type AdminScopePort,
} from '../../../shared/auth/ports';
import { ScopeRegistry } from '../../../shared/auth/scope-registry';
import { DomainError } from '../../../shared/errors/errors';
import {
  CURSOR_CODEC,
  CursorCodec,
  type CursorBinding,
} from '../../../shared/pagination/cursor';
import {
  UNIT_OF_WORK,
  type TxContext,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import {
  BUSINESS_ADMIN_LISTING_READ,
  type BusinessAdminListingReadPort,
} from '../../businesses/application/business-ports';
import {
  PRODUCT_OWNER_REPOSITORY,
  type ProductOwnerRepository,
} from './product-owner-ports';

const positionSchema = z.tuple([TimestampSchema, IdSchema]);

/**
 * Admin product reads for Admin Listings (F-AD-003): registers the
 * `product.admin` route scope and lists a listing's products after
 * `catalog:view` over the owning business's stored area (in the transaction).
 */
@Injectable()
export class ProductAdminReadService implements OnModuleInit {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(PRODUCT_OWNER_REPOSITORY)
    private readonly products: ProductOwnerRepository,
    @Inject(BUSINESS_ADMIN_LISTING_READ)
    private readonly businesses: BusinessAdminListingReadPort,
    @Inject(ADMIN_SCOPE) private readonly scope: AdminScopePort,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    private readonly registry: ScopeRegistry,
  ) {}

  onModuleInit(): void {
    // A product's scope is its business's stored area; missing -> super only.
    this.registry.register('product.admin', async (id, tx) => {
      const resolve = async (t: TxContext) => {
        const product = await this.products.find(t, id);
        if (!product || product.deleted) return [];
        const owner = await this.businesses.scopeOf(t, product.businessId);
        return owner ? [owner.scope] : [];
      };
      return tx ? resolve(tx) : this.uow.run(resolve);
    });
  }

  listForBusiness(
    ctx: AdminReadContext,
    input: { businessId: string; cursor?: string; limit: number },
  ): Promise<AdminListingProductPage> {
    const binding: CursorBinding = {
      operation: 'products.admin.listing',
      sort: 'createdAt-desc-id',
      filters: { businessId: input.businessId },
      scope: { actor: ctx.actorUserId, revision: ctx.scopeRevision },
    };
    const after = this.position(input.cursor, binding);
    return this.uow.run(async (tx) => {
      const owner = await this.businesses.scopeOf(tx, input.businessId);
      if (!owner) throw new DomainError('BUSINESS_NOT_FOUND');
      await this.scope.authorize(
        {
          actorUserId: ctx.actorUserId,
          module: 'catalog',
          action: 'view',
          scopes: [owner.scope],
        },
        tx,
      );
      const rows = await this.products.page(tx, {
        businessId: input.businessId,
        ...(after ? { after: { createdAt: after[0], id: after[1] } } : {}),
        limit: input.limit,
      });
      const page = rows.slice(0, input.limit);
      const last = page.at(-1);
      return AdminListingProductPageSchema.parse({
        items: page.map((row) => ({
          id: row.id,
          businessId: row.businessId,
          nameEn: row.nameEn,
          nameHi: row.nameHi,
          slug: row.slug,
          published: row.published,
          availableForSale: row.inventory.availableForSale,
          stock: row.inventory.onHand,
          version: row.version,
        })),
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

  private position(
    cursor: string | undefined,
    binding: CursorBinding,
  ): [string, string] | undefined {
    if (!cursor) return undefined;
    const parsed = positionSchema.safeParse(
      this.cursors.decode(cursor, binding),
    );
    if (!parsed.success)
      throw new DomainError('VALIDATION_ERROR', { field: 'cursor' });
    return parsed.data;
  }
}
