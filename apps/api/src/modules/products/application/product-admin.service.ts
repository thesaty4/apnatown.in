import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCTS_EVENT_TYPES,
  ProductEventPayloadSchema,
  type JsonValue,
} from '@apnatown/shared';
import {
  AdminProductPublicationResultSchema,
  type AdminListingProductPage,
  type AdminProductPublication,
  type AdminProductPublicationResult,
  type ScopeRef,
} from '@apnatown/shared/admin';
import type { AdminReadContext } from '../../../shared/auth/ports';
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
import {
  COMMAND_UNIT_OF_WORK,
  type CommandUnitOfWork,
  type TxContext,
} from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import { AdminScopedActor } from '../../admin/application/admin-scoped-actor';
import {
  AUDIT_WRITER,
  type AuditWriter,
} from '../../audit/application/audit-writer.port';
import {
  BUSINESS_ADMIN_LISTING_READ,
  type BusinessAdminListingReadPort,
} from '../../businesses/application/business-ports';
import type {
  ProductAdminCommand,
  ProductAdminPort,
} from './product-admin.port';
import { ProductAdminReadService } from './product-admin-read.service';
import {
  PRODUCT_OWNER_REPOSITORY,
  type ProductOwnerRepository,
  type StoredProduct,
} from './product-owner-ports';

const UNRESOLVED: ScopeRef = { cityId: null, areaId: null };

/**
 * Admin product publication for Admin Listings (F-AD-003). The owning
 * business's stored area is the authorization scope, rechecked in every
 * transaction. Publication is product-version guarded, audited and emits the
 * existing `product.updated`/`product.published` events (owner notification).
 */
@Injectable()
export class ProductAdminService implements ProductAdminPort {
  constructor(
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY)
    private readonly contexts: HttpCommandContextFactory,
    @Inject(PRODUCT_OWNER_REPOSITORY)
    private readonly products: ProductOwnerRepository,
    @Inject(BUSINESS_ADMIN_LISTING_READ)
    private readonly businesses: BusinessAdminListingReadPort,
    @Inject(AUDIT_WRITER) private readonly audit: AuditWriter,
    @Inject(EVENT_FACTORY) private readonly events: EventFactory,
    @Inject(OUTBOX_WRITER) private readonly outbox: OutboxWriter,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly actors: AdminScopedActor,
    private readonly reads: ProductAdminReadService,
  ) {}

  /** Delegates to the read side (scope registration, keyset list). */
  listForBusiness(
    ctx: AdminReadContext,
    input: { businessId: string; cursor?: string; limit: number },
  ): Promise<AdminListingProductPage> {
    return this.reads.listForBusiness(ctx, input);
  }

  setPublishedByAdmin(
    request: ProductAdminCommand,
    input: { productId: string } & AdminProductPublication,
  ): Promise<AdminProductPublicationResult> {
    const { productId, ...payload } = input;
    const command = this.contexts.create(
      {
        name: 'product.admin.publication',
        method: 'POST',
        scope: 'principal',
        successStatus: 200,
      },
      {
        actorId: request.actorId,
        correlationId: request.correlationId,
        resource: `/admin/products/${productId}/publication`,
        business: null,
        expiresAt: new Date(this.clock.now().getTime() + RECEIPT_TTL_MS),
      },
      {
        key: request.key,
        payload: JSON.parse(JSON.stringify(payload)) as JsonValue,
      },
    );
    return this.commands.run(
      command,
      async (tx) => {
        const { product, owner } = await this.authorize(tx, request, productId);
        if (product.version !== input.expectedVersion)
          throw new DomainError('PRODUCT_VERSION_CONFLICT');
        if (product.published === input.published) return this.result(product);
        const updated = await this.products.update(tx, {
          productId,
          businessId: product.businessId,
          expectedVersion: input.expectedVersion,
          fields: { ...product, published: input.published },
          at: this.clock.now(),
        });
        if (!updated) throw new DomainError('PRODUCT_VERSION_CONFLICT');
        const after = (await this.products.find(tx, productId))!;
        await this.audit.record(tx, {
          actor: owner.actor,
          action: input.published
            ? 'product.admin.publish'
            : 'product.admin.unpublish',
          entityType: 'product',
          entityId: productId,
          cityId: owner.scope.cityId,
          areaId: owner.scope.areaId,
          summary: `Admin ${input.published ? 'published' : 'unpublished'} product (${input.reasonKey})`,
          before: {
            published: product.published,
            version: product.version,
            reasonKey: null,
          },
          after: {
            published: after.published,
            version: after.version,
            reasonKey: input.reasonKey,
          },
          fields: ['published', 'version', 'reasonKey'],
          correlationId: request.correlationId,
        });
        for (const event of ['productUpdated', 'productPublished'] as const)
          await this.emit(tx, request.correlationId, event, after);
        return this.result(after);
      },
      {
        store: (result) => result,
        // Replay rechecks the caller's current catalog:edit over the product.
        replay: async (tx, stored) => {
          await this.authorize(tx, request, productId, false);
          return AdminProductPublicationResultSchema.parse(
            stored,
          ) as AdminProductPublicationResult & JsonValue;
        },
      },
    );
  }

  private async authorize(
    tx: TxContext,
    request: ProductAdminCommand,
    productId: string,
    strict = true,
  ) {
    const found = await this.products.find(tx, productId);
    const owner =
      found && !found.deleted
        ? await this.businesses.scopeOf(tx, found.businessId)
        : null;
    if (strict && (!found || !owner))
      throw new DomainError('PRODUCT_NOT_FOUND');
    const scope = owner?.scope ?? UNRESOLVED;
    const actor = await this.actors.require(tx, request, {
      module: 'catalog',
      action: 'edit',
      scopes: [scope],
    });
    if (owner && actor.userId === owner.ownerUserId)
      throw new DomainError('ADMIN_SELF_ACTION');
    // Lock product and inventory rows for the versioned write.
    const product = found
      ? await this.products.find(tx, productId, found.businessId)
      : null;
    if (strict && (!product || product.deleted))
      throw new DomainError('PRODUCT_NOT_FOUND');
    return { product: product!, owner: { actor, scope } };
  }

  private result(
    product: StoredProduct,
  ): AdminProductPublicationResult & JsonValue {
    return AdminProductPublicationResultSchema.parse({
      id: product.id,
      businessId: product.businessId,
      published: product.published,
      version: product.version,
    });
  }

  private emit(
    tx: TxContext,
    correlationId: string,
    event: 'productUpdated' | 'productPublished',
    product: StoredProduct,
  ): Promise<void> {
    const payload = ProductEventPayloadSchema.parse({
      productId: product.id,
      businessId: product.businessId,
      version: product.version,
    }) as JsonValue;
    return this.outbox.append(
      tx,
      this.events.create(
        PRODUCTS_EVENT_TYPES[event],
        { type: 'product', id: product.id, version: product.version },
        payload,
        correlationId,
      ),
    );
  }
}
