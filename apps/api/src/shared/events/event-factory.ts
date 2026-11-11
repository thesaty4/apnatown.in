import { Inject, Injectable } from '@nestjs/common';
import {
  canonicalJson,
  EventEnvelopeSchema,
  type EventEnvelope,
  type JsonValue,
} from '@apnatown/shared';
import {
  CLOCK,
  ID_PROVIDER,
  type Clock,
  type IdProvider,
} from '../runtime/providers';

export const EVENT_FACTORY = Symbol('EVENT_FACTORY');

export interface AggregateReference {
  type: string;
  id: string;
  version: number;
}

export interface DomainEvent<T extends JsonValue = JsonValue> extends Omit<
  EventEnvelope,
  'payload'
> {
  payload: T;
}

export interface EventFactory {
  create<T extends JsonValue>(
    type: string,
    aggregate: AggregateReference,
    payload: T,
    correlationId: string,
  ): DomainEvent<T>;
}

@Injectable()
export class SystemEventFactory implements EventFactory {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
  ) {}

  create<T extends JsonValue>(
    type: string,
    aggregate: AggregateReference,
    payload: T,
    correlationId: string,
  ): DomainEvent<T> {
    // Validate bounded JSON before recursive schema validation.
    canonicalJson(payload);
    const event: DomainEvent<T> = {
      id: this.ids.uuidv7(),
      type,
      schemaVersion: 1,
      aggregateType: aggregate.type,
      aggregateId: aggregate.id,
      aggregateVersion: aggregate.version,
      payload,
      correlationId,
      occurredAt: this.clock.now().toISOString(),
    };
    if (!EventEnvelopeSchema.safeParse(event).success)
      throw new Error('INVALID_DOMAIN_EVENT');
    return event;
  }
}
