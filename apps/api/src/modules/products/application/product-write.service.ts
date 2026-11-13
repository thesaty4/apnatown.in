import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  ProductOwnerSchema,
  type ProductCreate,
  type ProductOwner,
  type ProductUpdate,
} from '@apnatown/shared/products';
import {
  FEATURED_ENTITLEMENT_READ,
  type FeaturedEntitlementReadPort,
} from '../../../shared/entitlements/featured-entitlement';
import { DomainError } from '../../../shared/errors/errors';
import {
  COMMAND_UNIT_OF_WORK,
  UNIT_OF_WORK,
  type CommandUnitOfWork,
  type TxContext,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import {
  CLOCK,
  ID_PROVIDER,
  type Clock,
  type IdProvider,
} from '../../../shared/runtime/providers';
import type { StoredBusiness } from '../../businesses/domain/business';
import {
  ProductOwnerAccess,
  ownedProduct,
  type ProductOwnerCommand,
} from './product-owner-access';
import {
  INVENTORY_REPOSITORY,
  PRODUCT_OWNER_REPOSITORY,
  type InventoryRepository,
  type ProductFields,
  type ProductOwnerRepository,
  type StoredProduct,
} from './product-owner-ports';
import {
  applyStockChange,
  assertPrice,
  generatedSku,
  newProductFields,
  newProductStock,
  planVariants,
  productOwnerDto,
  slugBase,
} from './product-rules';
import { ProductWriteSupport } from './product-write-support';

/**
 * Owner product writes (F-VD-004, F-PV-005; rules 1-3, 6, 7, 9, 10). The
 * owner business is session-resolved and row-locked; PATCH/DELETE are
 * version-guarded; a NEW featured selection needs current Premium
 * entitlement (fails closed). Events carry ids/version only.
 */
@Injectable()
export class ProductWriteService {
  constructor(
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(PRODUCT_OWNER_REPOSITORY)
    private readonly products: ProductOwnerRepository,
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventory: InventoryRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    private readonly support: ProductWriteSupport,
    private readonly access: ProductOwnerAccess,
    @Inject(FEATURED_ENTITLEMENT_READ)
    private readonly entitlements: FeaturedEntitlementReadPort,
  ) {}

  /** Product + inventory in one transaction (rule 2); Idempotency-Key. */
  async create(
    request: ProductOwnerCommand,
    input: ProductCreate,
  ): Promise<ProductOwner> {
    assertPrice(input.pricePaise, input.mrpPaise);
    const stock = newProductStock(input.inventory);
    const command = this.support.command(
      request,
      { name: 'products.owner.create', method: 'POST', resource: '/businesses/me/products', successStatus: 201 },
      input,
    );
    await this.support.assertTaxonomy(input.categoryId, input.subcategoryId);
    return this.commands.run(
      command,
      async (tx) => {
        const business = await this.access.resolve(tx, request, {
          lock: true,
          denial: 'USERS_APPROVAL_REQUIRED',
        });
        const featuredSelected = input.featuredSelected ?? false;
        const entitled = await this.entitlements.isPremium(business.id, tx);
        if (featuredSelected && !entitled)
          throw new DomainError('FEATURED_ENTITLEMENT_UNAVAILABLE');
        const id = this.ids.uuidv7();
        const variants = planVariants(input.variants ?? [], new Set(), () => this.ids.uuidv7());
        const fields = newProductFields(
          input,
          id,
          await this.support.media(tx, business, request.actorId, input.media ?? []),
        );
        await this.assertSku(tx, business.id, fields.sku);
        const inserted = await this.products.insert(tx, {
          ...fields,
          id,
          businessId: business.id,
          slug: await this.products.allocateSlug(tx, slugBase(fields.nameEn)),
          stock,
          at: this.clock.now(),
        });
        if (!inserted) throw new DomainError('PRODUCT_SKU_CONFLICT');
        if (variants.length) await this.products.replaceVariants(tx, id, variants);
        const row = ownedProduct(await this.products.find(tx, id), business);
        await this.support.emit(tx, request.correlationId, 'productCreated', {
          productId: id,
          businessId: business.id,
          version: row.version,
        });
        return productOwnerDto(row, variants, business, entitled) as ProductOwner & JsonValue;
      },
      {
        store: (result) => result,
        replay: (_tx, stored) =>
          Promise.resolve(ProductOwnerSchema.parse(stored) as ProductOwner & JsonValue),
      },
    );
  }

  /** Partial, product-version guarded; inventory carries its own version. */
  update(
    request: ProductOwnerCommand,
    productId: string,
    input: ProductUpdate,
  ): Promise<ProductOwner> {
    return this.uow.run(async (tx) => {
      const { business, current } = await this.current(tx, request, productId, input.expectedVersion);
      const next: ProductFields = {
        categoryId: input.categoryId ?? current.categoryId,
        subcategoryId: input.subcategoryId ?? current.subcategoryId,
        nameEn: input.nameEn ?? current.nameEn,
        nameHi: input.nameHi === undefined ? current.nameHi : input.nameHi,
        description: input.description === undefined ? current.description : input.description,
        brand: input.brand === undefined ? current.brand : input.brand,
        sku: input.sku === undefined ? current.sku : (input.sku ?? generatedSku(productId)),
        pricePaise: input.pricePaise ?? current.pricePaise,
        mrpPaise: input.mrpPaise ?? current.mrpPaise,
        unit: input.unit ?? current.unit,
        tags: input.tags ?? current.tags,
        specs: input.specs ?? current.specs,
        featuredSelected: input.featuredSelected ?? current.featuredSelected,
        published: input.published ?? current.published,
        media: input.media
          ? await this.support.media(tx, business, request.actorId, input.media)
          : current.media,
      };
      assertPrice(next.pricePaise, next.mrpPaise);
      if (next.categoryId !== current.categoryId || next.subcategoryId !== current.subcategoryId)
        await this.support.assertTaxonomy(next.categoryId, next.subcategoryId, tx);
      const entitled = await this.entitlements.isPremium(business.id, tx);
      // Only a NEW selection needs entitlement; a retained one stays stored.
      if (next.featuredSelected && !current.featuredSelected && !entitled)
        throw new DomainError('FEATURED_ENTITLEMENT_UNAVAILABLE');
      if (next.sku !== current.sku) await this.assertSku(tx, business.id, next.sku, productId);
      if (input.variants) {
        const owned = await this.products.variantIds(
          tx,
          productId,
          input.variants.flatMap((item) => (item.id ? [item.id] : [])),
        );
        const plan = planVariants(input.variants, new Set(owned), () => this.ids.uuidv7());
        await this.products.replaceVariants(tx, productId, plan);
      }
      const at = this.clock.now();
      const updated = await this.products.update(tx, {
        productId,
        businessId: business.id,
        expectedVersion: input.expectedVersion,
        fields: next,
        at,
      });
      if (!updated) throw new DomainError('PRODUCT_VERSION_CONFLICT');
      if (input.inventory) {
        const { expectedVersion, ...change } = input.inventory;
        if (expectedVersion !== current.inventory.version)
          throw new DomainError('PRODUCT_VERSION_CONFLICT');
        const stock = await this.inventory.update(tx, {
          ...applyStockChange(current.inventory, change),
          productId,
          expectedVersion,
          at,
        });
        if (!stock) throw new DomainError('PRODUCT_VERSION_CONFLICT');
        await this.support.emit(tx, request.correlationId, 'inventoryChanged', {
          productId,
          businessId: business.id,
          version: stock.version,
        });
      }
      const ids = { productId, businessId: business.id, version: current.version + 1 };
      await this.support.emit(tx, request.correlationId, 'productUpdated', ids);
      if (next.published !== current.published)
        await this.support.emit(tx, request.correlationId, 'productPublished', ids);
      const row = ownedProduct(await this.products.find(tx, productId), business);
      const variants = await this.products.variants(tx, productId);
      return productOwnerDto(row, variants, business, entitled);
    });
  }

  /** Soft delete; repeating it for an already deleted own product is a no-op. */
  remove(
    request: ProductOwnerCommand,
    productId: string,
    expectedVersion: number,
  ): Promise<void> {
    return this.uow.run(async (tx) => {
      const business = await this.access.resolve(tx, request, { lock: true });
      const row = await this.products.find(tx, productId, business.id);
      if (row?.deleted && row.businessId === business.id) return;
      const current = ownedProduct(row, business);
      if (current.version !== expectedVersion)
        throw new DomainError('PRODUCT_VERSION_CONFLICT');
      const version = await this.products.softDelete(tx, {
        productId,
        businessId: business.id,
        expectedVersion,
        at: this.clock.now(),
      });
      if (version === null) throw new DomainError('PRODUCT_VERSION_CONFLICT');
      await this.support.emit(tx, request.correlationId, 'productDeleted', {
        productId,
        businessId: business.id,
        version,
      });
    });
  }

  /** Locked approved business + its locked, version-matched product. */
  private async current(
    tx: TxContext,
    request: ProductOwnerCommand,
    productId: string,
    expectedVersion: number,
  ): Promise<{ business: StoredBusiness; current: StoredProduct }> {
    const business = await this.access.resolve(tx, request, { lock: true });
    const current = ownedProduct(await this.products.find(tx, productId, business.id), business);
    if (current.version !== expectedVersion)
      throw new DomainError('PRODUCT_VERSION_CONFLICT');
    return { business, current };
  }

  /** Unique business SKU (rule 3). */
  private async assertSku(
    tx: TxContext,
    businessId: string,
    sku: string | null,
    exceptProductId?: string,
  ): Promise<void> {
    if (sku === null) return;
    const taken = await this.products.skuTaken(tx, {
      businessId,
      sku,
      ...(exceptProductId ? { exceptProductId } : {}),
    });
    if (taken) throw new DomainError('PRODUCT_SKU_CONFLICT');
  }
}
