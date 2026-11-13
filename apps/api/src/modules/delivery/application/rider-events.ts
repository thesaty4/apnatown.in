import { Inject, Injectable } from '@nestjs/common';
import {
  RIDER_EVENT_TYPES,
  RiderApplicationDecidedPayloadSchema,
  RiderApplicationSubmittedPayloadSchema,
  type RiderStatus,
} from '@apnatown/shared/delivery';
import type { JsonValue } from '@apnatown/shared';
import {
  EVENT_FACTORY,
  type EventFactory,
} from '../../../shared/events/event-factory';
import { OUTBOX_WRITER, type OutboxWriter } from '../../../shared/events/ports';
import type { TxContext } from '../../../shared/persistence/ports';
import { riderScope, type StoredRider } from '../domain/rider';

/**
 * Rider application outbox events, appended in the write transaction and
 * published after commit (Admin/Users/Auth/Notifications). No phone, payout,
 * KYC or free-text reason in payloads.
 */
@Injectable()
export class RiderEvents {
  constructor(
    @Inject(EVENT_FACTORY) private readonly events: EventFactory,
    @Inject(OUTBOX_WRITER) private readonly outbox: OutboxWriter,
  ) {}

  submitted(tx: TxContext, rider: StoredRider, correlationId: string) {
    return this.append(
      tx,
      RIDER_EVENT_TYPES.applicationSubmitted,
      rider,
      RiderApplicationSubmittedPayloadSchema.parse({
        riderUserId: rider.userId,
        applicationVersion: rider.version,
        scope: riderScope(rider),
      }),
      correlationId,
    );
  }

  decided(
    tx: TxContext,
    rider: StoredRider,
    input: { previousStatus: RiderStatus; decisionId: string },
    correlationId: string,
  ) {
    return this.append(
      tx,
      RIDER_EVENT_TYPES.applicationDecided,
      rider,
      RiderApplicationDecidedPayloadSchema.parse({
        riderUserId: rider.userId,
        applicationVersion: rider.version,
        scope: riderScope(rider),
        status: rider.status,
        previousStatus: input.previousStatus,
        decisionId: input.decisionId,
      }),
      correlationId,
    );
  }

  private append(
    tx: TxContext,
    type: string,
    rider: StoredRider,
    payload: JsonValue,
    correlationId: string,
  ): Promise<void> {
    return this.outbox.append(
      tx,
      this.events.create(
        type,
        { type: 'rider_profile', id: rider.userId, version: rider.version },
        payload,
        correlationId,
      ),
    );
  }
}
