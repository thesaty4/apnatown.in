import { Inject, Injectable } from '@nestjs/common';
import {
  InventoryPageSchema,
  type InventoryItem,
  type InventoryListQuery,
  type InventoryPage,
  type InventoryUpdate,
} from '@apnatown/shared/products';
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
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import {
  ProductOwnerAccess,
  ownedProduct,
  type ProductOwnerCommand,
  type ProductOwnerRequest,
} from './product-owner-access';
import {
  INVENTORY_REPOSITORY,
  PRODUCT_OWNER_REPOSITORY,
  type InventoryRepository,
  type ProductOwnerRepository,
} from './product-owner-ports';
import { cursorPosition } from './product-owner.service';
import { applyStockChange, inventoryItemDto } from './product-rules';
import { ProductWriteSupport } from './product-write-support';

/** Owner inventory (F-VD-009, F-PV-005; S-VEND-08). */
@Injectable()
export class InventoryService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventory: InventoryRepository,
    @Inject(PRODUCT_OWNER_REPOSITORY)
    private readonly products: ProductOwnerRepository,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly support: ProductWriteSupport,
    private readonly access: ProductOwnerAccess,
  ) {}

  /** Inventory of non-deleted products, newest product first. */
  list(
    request: ProductOwnerRequest,
    input: InventoryListQuery,
  ): Promise<InventoryPage> {
    return this.uow.run(async (tx) => {
      const business = await this.access.resolve(tx, request);
      const binding: CursorBinding = {
        operation: 'products.inventory.list',
        sort: 'createdAt-desc-id-desc',
        filters: {},
        scope: { businessId: business.id },
      };
      const after = cursorPosition(this.cursors, input.cursor, binding);
      const rows = await this.inventory.page(tx, {
        businessId: business.id,
        ...(after ? { after } : {}),
        limit: input.limit,
      });
      const page = rows.slice(0, input.limit);
      const last = page.at(-1);
      return InventoryPageSchema.parse({
        items: page.map(inventoryItemDto),
        nextCursor:
          rows.length > input.limit && last
            ? this.cursors.encode(binding, [
                last.createdAt.toISOString(),
                last.productId,
              ])
            : null,
      });
    });
  }

  /**
   * Inventory-version guarded edit (rule 6): a delta reaching zero marks the
   * item unavailable; marking available at zero stock sets 10 (Q-49).
   */
  update(
    request: ProductOwnerCommand,
    productId: string,
    input: InventoryUpdate,
  ): Promise<InventoryItem> {
    return this.uow.run(async (tx) => {
      const business = await this.access.resolve(tx, request, { lock: true });
      const row = ownedProduct(await this.products.find(tx, productId, business.id), business);
      if (row.inventory.version !== input.expectedVersion)
        throw new DomainError('PRODUCT_VERSION_CONFLICT');
      const { expectedVersion, ...change } = input;
      const stock = await this.inventory.update(tx, {
        ...applyStockChange(row.inventory, change),
        productId,
        expectedVersion,
        at: this.clock.now(),
      });
      if (!stock) throw new DomainError('PRODUCT_VERSION_CONFLICT');
      await this.support.emit(tx, request.correlationId, 'inventoryChanged', {
        productId,
        businessId: business.id,
        version: stock.version,
      });
      return inventoryItemDto({
        ...stock,
        productId,
        slug: row.slug,
        nameEn: row.nameEn,
        nameHi: row.nameHi,
        sku: row.sku,
        unit: row.unit,
        createdAt: row.createdAt,
      });
    });
  }
}
