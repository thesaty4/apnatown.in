import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCTS_EVENT_TYPES,
  ProductEventPayloadSchema,
  ProductPillsUpdatedPayloadSchema,
  type JsonValue,
} from '@apnatown/shared';
import type { ProductMediaInput } from '@apnatown/shared/products';
import { DomainError } from '../../../shared/errors/errors';
import {
  EVENT_FACTORY,
  type EventFactory,
} from '../../../shared/events/event-factory';
import { OUTBOX_WRITER, type OutboxWriter } from '../../../shared/events/ports';
import {
  COMMAND_CONTEXT_FACTORY,
  HttpCommandContextFactory,
} from '../../../shared/idempotency/context';
import { RECEIPT_TTL_MS } from '../../../shared/idempotency/receipt-ttl';
import type { TxContext } from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import { BusinessOwnerContext } from '../../businesses/application/business-owner-context';
import type { StoredBusiness } from '../../businesses/domain/business';
import {
  CATALOG_READ,
  type CatalogReadPort,
} from '../../catalog/application/catalog-ports';
import {
  LISTING_IMAGE_ATTACH,
  type ListingImageAttachPort,
} from '../../media-videos/application/listing-image-attach.port';
import type { ProductOwnerCommand } from './product-owner-access';
import type { StoredProductMedia } from './product-owner-ports';

type ProductEvent = Exclude<keyof typeof PRODUCTS_EVENT_TYPES, 'pillsUpdated'>;

/**
 * Cross-cutting product write steps shared by the owner services: catalog
 * taxonomy, Media-owned image validation, outbox events (ids/version only)
 * and Idempotency-Key command contexts.
 */
@Injectable()
export class ProductWriteSupport {
  constructor(
    @Inject(CATALOG_READ) private readonly catalog: CatalogReadPort,
    @Inject(LISTING_IMAGE_ATTACH)
    private readonly images: ListingImageAttachPort,
    @Inject(EVENT_FACTORY) private readonly events: EventFactory,
    @Inject(OUTBOX_WRITER) private readonly outbox: OutboxWriter,
    @Inject(COMMAND_CONTEXT_FACTORY)
    private readonly contexts: HttpCommandContextFactory,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly businesses: BusinessOwnerContext,
  ) {}

  /**
   * Rule 2: the category must be an active product category and the
   * subcategory active under it; product forms never create taxonomy.
   * Inside `tx` when given (write-time recheck under the caller's locks).
   */
  async assertTaxonomy(
    categoryId: string,
    subcategoryId: string,
    tx?: TxContext,
  ): Promise<void> {
    const taxonomy = await this.productTaxonomy(
      [categoryId],
      [subcategoryId],
      tx,
    );
    if (!taxonomy.categories.has(categoryId))
      throw new DomainError('PRODUCT_INVALID', { field: 'categoryId' });
    if (taxonomy.subcategories.get(subcategoryId) !== categoryId)
      throw new DomainError('PRODUCT_INVALID', { field: 'subcategoryId' });
  }

  /**
   * Active product categories among `categoryIds` and the parent category of
   * each active subcategory among `subcategoryIds` (one Catalog read; inside
   * `tx` when given).
   */
  async productTaxonomy(
    categoryIds: readonly string[],
    subcategoryIds: readonly string[],
    tx?: TxContext,
  ): Promise<{ categories: Set<string>; subcategories: Map<string, string> }> {
    const taxonomy = await this.catalog.taxonomy(
      { categoryIds, subcategoryIds, kind: 'product', activeOnly: true },
      tx,
    );
    const categories = new Set(
      taxonomy.categories
        .filter((row) => row.active && row.kind === 'product')
        .map((row) => row.id),
    );
    const subcategories = new Map(
      taxonomy.subcategories
        .filter((row) => row.active && categories.has(row.categoryId))
        .map((row) => [row.id, row.categoryId] as const),
    );
    return { categories, subcategories };
  }

  /**
   * Rules 7/9: ordered, unique, ready `product` images uploaded for this
   * business by the acting owner (Media's port); a guessed private/KYC or
   * other-purpose asset is PRODUCT_INVALID. An omitted gallery flag defaults
   * from the Businesses-owned `galleryMediaDefault` (read in `tx`).
   */
  async media(
    tx: TxContext,
    business: StoredBusiness,
    actorUserId: string,
    items: readonly ProductMediaInput[],
  ): Promise<StoredProductMedia[]> {
    if (!items.length) return [];
    const assetIds = items.map((item) => item.assetId);
    if (new Set(assetIds).size !== assetIds.length)
      throw new DomainError('PRODUCT_INVALID', { field: 'media' });
    try {
      await this.images.resolveOwned(tx, {
        businessId: business.id,
        actorUserId,
        purpose: 'product',
        assetIds,
      });
    } catch (error) {
      if (error instanceof DomainError && error.code === 'MEDIA_NOT_FOUND')
        throw new DomainError('PRODUCT_INVALID', { field: 'media' });
      throw error;
    }
    const fallback = items.some((item) => item.showInGallery === undefined)
      ? await this.businesses.galleryMediaDefault(tx, business.id)
      : false;
    return items.map((item) => ({
      assetId: item.assetId,
      showInGallery: item.showInGallery ?? fallback,
    }));
  }

  /** Product/inventory event; `version` is the aggregate's new version. */
  async emit(
    tx: TxContext,
    correlationId: string,
    event: ProductEvent,
    input: { productId: string; businessId: string; version: number },
  ): Promise<void> {
    const payload = ProductEventPayloadSchema.parse(input) as JsonValue;
    await this.outbox.append(
      tx,
      this.events.create(
        PRODUCTS_EVENT_TYPES[event],
        {
          type: event === 'inventoryChanged' ? 'inventory' : 'product',
          id: input.productId,
          version: input.version,
        },
        payload,
        correlationId,
      ),
    );
  }

  /** One `product.created` per new product (version 1), one statement. */
  async emitCreated(
    tx: TxContext,
    correlationId: string,
    businessId: string,
    productIds: readonly string[],
  ): Promise<void> {
    await this.outbox.appendMany(
      tx,
      productIds.map((productId) =>
        this.events.create(
          PRODUCTS_EVENT_TYPES.productCreated,
          { type: 'product', id: productId, version: 1 },
          ProductEventPayloadSchema.parse({
            productId,
            businessId,
            version: 1,
          }) as JsonValue,
          correlationId,
        ),
      ),
    );
  }

  async emitPills(
    tx: TxContext,
    correlationId: string,
    business: StoredBusiness,
  ): Promise<void> {
    const payload = ProductPillsUpdatedPayloadSchema.parse({
      businessId: business.id,
    }) as JsonValue;
    await this.outbox.append(
      tx,
      this.events.create(
        PRODUCTS_EVENT_TYPES.pillsUpdated,
        { type: 'business', id: business.id, version: business.version },
        payload,
        correlationId,
      ),
    );
  }

  /** Idempotency-Key command; the owner route context joins the fingerprint. */
  command(
    request: ProductOwnerCommand,
    operation: {
      name: string;
      method: 'POST' | 'PATCH';
      resource: string;
      successStatus: number;
    },
    payload: object,
  ) {
    return this.contexts.create(
      {
        name: operation.name,
        method: operation.method,
        scope: 'principal',
        successStatus: operation.successStatus,
      },
      {
        actorId: request.actorId,
        correlationId: request.correlationId,
        resource: operation.resource,
        business: null,
        expiresAt: new Date(this.clock.now().getTime() + RECEIPT_TTL_MS),
      },
      {
        key: request.key,
        payload: JSON.parse(
          JSON.stringify({
            ...payload,
            businessKind: request.businessKind ?? null,
          }),
        ) as JsonValue,
      },
    );
  }
}
