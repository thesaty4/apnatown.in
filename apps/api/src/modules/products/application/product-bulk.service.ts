import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  PRODUCT_RESTOCK_TARGET,
  ProductBulkResultSchema,
  type InventoryRestockLow,
  type ProductBulkCommand,
  type ProductBulkResult,
} from '@apnatown/shared/products';
import { DomainError } from '../../../shared/errors/errors';
import {
  COMMAND_UNIT_OF_WORK,
  type CommandUnitOfWork,
} from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import {
  ProductOwnerAccess,
  type ProductOwnerCommand,
} from './product-owner-access';
import {
  INVENTORY_REPOSITORY,
  PRODUCT_OWNER_REPOSITORY,
  type InventoryRepository,
  type ProductOwnerRepository,
} from './product-owner-ports';
import { applyStockChange } from './product-rules';
import { ProductWriteSupport } from './product-write-support';

const receipt = {
  store: (result: ProductBulkResult & JsonValue) => result,
  replay: (_tx: unknown, stored: JsonValue) =>
    Promise.resolve(
      ProductBulkResultSchema.parse(stored) as ProductBulkResult & JsonValue,
    ),
};

/**
 * All-or-nothing owner bulk commands (S-VEND-05/08). Every row is locked in
 * stable id order and checked before any write; one foreign product, stale
 * version or invalid selection rejects the whole command (Idempotency-Key +
 * versions).
 */
@Injectable()
export class ProductBulkService {
  constructor(
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(PRODUCT_OWNER_REPOSITORY)
    private readonly products: ProductOwnerRepository,
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventory: InventoryRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly support: ProductWriteSupport,
    private readonly access: ProductOwnerAccess,
  ) {}

  /**
   * `expectedVersions[i]` guards `productIds[i]`: the inventory version for
   * mark_in_stock/mark_out_of_stock, the product version for delete.
   */
  bulk(
    request: ProductOwnerCommand,
    input: ProductBulkCommand,
  ): Promise<ProductBulkResult> {
    if (
      input.productIds.length !== input.expectedVersions.length ||
      new Set(input.productIds).size !== input.productIds.length
    )
      throw new DomainError('PRODUCT_BULK_INVALID');
    const command = this.support.command(
      request,
      { name: 'products.owner.bulk', method: 'PATCH', resource: '/businesses/me/products/bulk', successStatus: 200 },
      input,
    );
    return this.commands.run(
      command,
      async (tx) => {
        const business = await this.access.resolve(tx, request, { lock: true });
        const rows = new Map(
          (await this.products.findMany(tx, input.productIds, business.id)).map((row) => [row.id, row]),
        );
        const expected = new Map(
          input.productIds.map((id, index) => [id, input.expectedVersions[index]!]),
        );
        for (const id of input.productIds) {
          const row = rows.get(id);
          if (!row || row.deleted) throw new DomainError('PRODUCT_NOT_FOUND');
          if (row.businessId !== business.id)
            throw new DomainError('PRODUCT_NOT_OWNED');
          const version =
            input.action === 'delete' ? row.version : row.inventory.version;
          if (version !== expected.get(id))
            throw new DomainError('PRODUCT_VERSION_CONFLICT');
        }
        const at = this.clock.now();
        for (const id of [...input.productIds].sort()) {
          const row = rows.get(id)!;
          const ids = { productId: id, businessId: business.id };
          if (input.action === 'delete') {
            const version = await this.products.softDelete(tx, {
              ...ids,
              expectedVersion: row.version,
              at,
            });
            if (version === null) throw new DomainError('PRODUCT_VERSION_CONFLICT');
            await this.support.emit(tx, request.correlationId, 'productDeleted', { ...ids, version });
            continue;
          }
          const stock = await this.inventory.update(tx, {
            ...applyStockChange(row.inventory, {
              availableForSale: input.action === 'mark_in_stock',
            }),
            productId: id,
            expectedVersion: row.inventory.version,
            at,
          });
          if (!stock) throw new DomainError('PRODUCT_VERSION_CONFLICT');
          await this.support.emit(tx, request.correlationId, 'inventoryChanged', {
            ...ids,
            version: stock.version,
          });
        }
        return ProductBulkResultSchema.parse({
          changedIds: input.productIds,
        }) as ProductBulkResult & JsonValue;
      },
      receipt,
    );
  }

  /**
   * Restock-low (rule 6): sets every currently low row (on_hand <=
   * threshold) of the business to 20. The submitted versions
   * must cover exactly that locked set, else nothing changes.
   */
  restockLow(
    request: ProductOwnerCommand,
    input: InventoryRestockLow,
  ): Promise<ProductBulkResult> {
    const ids = input.expectedVersions.map((item) => item.productId);
    if (new Set(ids).size !== ids.length)
      throw new DomainError('PRODUCT_BULK_INVALID');
    const command = this.support.command(
      request,
      { name: 'products.inventory.restock-low', method: 'POST', resource: '/businesses/me/inventory/restock-low', successStatus: 200 },
      input,
    );
    return this.commands.run(
      command,
      async (tx) => {
        const business = await this.access.resolve(tx, request, { lock: true });
        const low = await this.inventory.lowRows(tx, business.id);
        const expected = new Map(
          input.expectedVersions.map((item) => [item.productId, item.version]),
        );
        if (
          low.length !== expected.size ||
          low.some((row) => expected.get(row.productId) !== row.version)
        )
          throw new DomainError('PRODUCT_VERSION_CONFLICT');
        const at = this.clock.now();
        for (const row of low) {
          const stock = await this.inventory.update(tx, {
            onHand: PRODUCT_RESTOCK_TARGET,
            lowStockThreshold: row.lowStockThreshold,
            // Only the quantity changes; the owner's availability toggle stays.
            availableForSale: row.availableForSale,
            productId: row.productId,
            expectedVersion: row.version,
            at,
          });
          if (!stock) throw new DomainError('PRODUCT_VERSION_CONFLICT');
          await this.support.emit(tx, request.correlationId, 'inventoryChanged', {
            productId: row.productId,
            businessId: business.id,
            version: stock.version,
          });
        }
        return ProductBulkResultSchema.parse({
          changedIds: low.map((row) => row.productId),
        }) as ProductBulkResult & JsonValue;
      },
      receipt,
    );
  }
}
