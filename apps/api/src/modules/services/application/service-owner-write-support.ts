import { Inject, Injectable } from '@nestjs/common';
import {
  SERVICES_EVENT_TYPES,
  ServiceChangedPayloadSchema,
  type JsonValue,
} from '@apnatown/shared';
import type { ServiceMediaInput } from '@apnatown/shared/services';
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
import type {
  CommandContext,
  TxContext,
} from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import type { StoredBusiness } from '../../businesses/domain/business';
import {
  LISTING_IMAGE_ATTACH,
  type ListingImageAttachPort,
} from '../../media-videos/application/listing-image-attach.port';
import {
  EnquiryOwnerAccess,
  type EnquiryOwnerRequest,
} from './enquiry-owner-access';
import type { StoredService, StoredServiceMedia } from './service-owner-ports';

/** Owner command: session-resolved business plus an Idempotency-Key. */
export interface ServiceOwnerCommand extends EnquiryOwnerRequest {
  correlationId: string;
  key: unknown;
}

/**
 * Shared steps of owner service writes: idempotent command context, approved
 * owner resolution, Media image resolution and the id-only change event.
 */
@Injectable()
export class ServiceOwnerWriteSupport {
  constructor(
    @Inject(COMMAND_CONTEXT_FACTORY)
    private readonly contexts: HttpCommandContextFactory,
    @Inject(LISTING_IMAGE_ATTACH)
    private readonly images: ListingImageAttachPort,
    @Inject(EVENT_FACTORY) private readonly events: EventFactory,
    @Inject(OUTBOX_WRITER) private readonly outbox: OutboxWriter,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly access: EnquiryOwnerAccess,
  ) {}

  command(
    request: ServiceOwnerCommand,
    method: 'POST' | 'PATCH' | 'DELETE',
    resource: string,
    successStatus: number,
    payload: object,
  ): CommandContext {
    return this.contexts.create(
      {
        name: `services.owner.${method.toLowerCase()}`,
        method,
        scope: 'principal',
        successStatus,
      },
      {
        actorId: request.actorId,
        correlationId: request.correlationId,
        resource,
        business: null,
        expiresAt: new Date(this.clock.now().getTime() + RECEIPT_TTL_MS),
      },
      {
        key: request.key,
        // The owner route context is part of the request fingerprint.
        payload: JSON.parse(
          JSON.stringify({
            ...payload,
            businessKind: request.businessKind ?? null,
          }),
        ) as JsonValue,
      },
    );
  }

  /**
   * Listing writes are approved-only (rule 8, BR-06): the caller's own
   * business with its live seller role, row-locked until commit.
   */
  async approved(
    tx: TxContext,
    request: ServiceOwnerCommand,
    denial: 'USERS_APPROVAL_REQUIRED' | 'COMMON_FORBIDDEN',
  ): Promise<StoredBusiness> {
    const business = await this.access.resolve(tx, request, true);
    if (business.status !== 'approved') throw new DomainError(denial);
    return business;
  }

  /** Ordered owner-uploaded, ready `service` images via Media's port. */
  async media(
    tx: TxContext,
    business: StoredBusiness,
    request: ServiceOwnerCommand,
    items: readonly ServiceMediaInput[],
  ): Promise<StoredServiceMedia[]> {
    if (!items.length) return [];
    try {
      await this.images.resolveOwned(tx, {
        businessId: business.id,
        actorUserId: request.actorId,
        purpose: 'service',
        assetIds: items.map((item) => item.assetId),
      });
    } catch (error) {
      if (error instanceof DomainError && error.code === 'MEDIA_NOT_FOUND')
        throw new DomainError('SERVICES_INVALID', { field: 'media' });
      throw error;
    }
    // Gallery placement is never inferred from a default (Q-50).
    return items.map((item) => ({
      assetId: item.assetId,
      showInGallery: item.showInGallery ?? false,
    }));
  }

  /** `service.changed` for search/detail cache invalidation (ids only). */
  async changed(
    tx: TxContext,
    correlationId: string,
    before: StoredService,
    after: StoredService,
    deleted: boolean,
  ): Promise<void> {
    const payload = ServiceChangedPayloadSchema.parse({
      serviceId: after.id,
      businessId: after.businessId,
      categoryIds: [...new Set([before.categoryId, after.categoryId])],
      subcategoryIds: [...new Set([before.subcategoryId, after.subcategoryId])],
      version: after.version,
      deleted,
    }) as JsonValue;
    await this.outbox.append(
      tx,
      this.events.create(
        SERVICES_EVENT_TYPES.serviceChanged,
        { type: 'service', id: after.id, version: after.version },
        payload,
        correlationId,
      ),
    );
  }
}
