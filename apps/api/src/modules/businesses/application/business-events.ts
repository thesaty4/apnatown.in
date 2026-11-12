import { Inject, Injectable } from '@nestjs/common';
import {
  BUSINESS_EVENT_TYPES,
  BusinessEventPayloadSchema,
  BusinessProfileChangedPayloadSchema,
  type JsonValue,
} from '@apnatown/shared';
import type { BusinessStatus } from '@apnatown/shared/businesses';
import {
  EVENT_FACTORY,
  type EventFactory,
} from '../../../shared/events/event-factory';
import { OUTBOX_WRITER, type OutboxWriter } from '../../../shared/events/ports';
import type { TxContext } from '../../../shared/persistence/ports';
import type { StoredBusiness } from '../domain/business';

function base(business: StoredBusiness, previousStatus?: BusinessStatus) {
  return {
    businessId: business.id,
    ownerUserId: business.ownerUserId,
    cityId: business.cityId,
    areaId: business.areaId,
    status: business.status,
    ...(previousStatus ? { previousStatus } : {}),
    version: business.version,
  };
}

/**
 * Businesses outbox events, appended in the write transaction and published
 * after commit (Notifications, Search/public cache revalidation).
 */
@Injectable()
export class BusinessEvents {
  constructor(
    @Inject(EVENT_FACTORY) private readonly events: EventFactory,
    @Inject(OUTBOX_WRITER) private readonly outbox: OutboxWriter,
  ) {}

  submitted(
    tx: TxContext,
    business: StoredBusiness,
    previousStatus: BusinessStatus,
    correlationId: string,
  ): Promise<void> {
    return this.append(
      tx,
      BUSINESS_EVENT_TYPES.applicationSubmitted,
      business,
      BusinessEventPayloadSchema.parse(base(business, previousStatus)),
      correlationId,
    );
  }

  decisionChanged(
    tx: TxContext,
    business: StoredBusiness,
    previousStatus: BusinessStatus,
    correlationId: string,
  ): Promise<void> {
    return this.append(
      tx,
      BUSINESS_EVENT_TYPES.decisionChanged,
      business,
      BusinessEventPayloadSchema.parse(base(business, previousStatus)),
      correlationId,
    );
  }

  profileChanged(
    tx: TxContext,
    business: StoredBusiness,
    input: {
      previousStatus?: BusinessStatus;
      categoryIdsBefore: readonly string[];
      categoryIdsAfter: readonly string[];
    },
    correlationId: string,
  ): Promise<void> {
    return this.append(
      tx,
      BUSINESS_EVENT_TYPES.profileChanged,
      business,
      BusinessProfileChangedPayloadSchema.parse({
        ...base(business, input.previousStatus),
        categoryIdsBefore: [...input.categoryIdsBefore],
        categoryIdsAfter: [...input.categoryIdsAfter],
        deleted: business.deletedAt !== null,
      }),
      correlationId,
    );
  }

  private append(
    tx: TxContext,
    type: string,
    business: StoredBusiness,
    payload: JsonValue,
    correlationId: string,
  ): Promise<void> {
    return this.outbox.append(
      tx,
      this.events.create(
        type,
        { type: 'business', id: business.id, version: business.version },
        payload,
        correlationId,
      ),
    );
  }
}
