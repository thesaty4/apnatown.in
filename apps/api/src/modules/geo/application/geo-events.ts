import { Inject, Injectable } from '@nestjs/common';
import {
  GEO_EVENT_TYPES,
  GeoCityStatusChangedPayloadSchema,
  GeoZoneChangedPayloadSchema,
  type GeoCityStatusChangedPayload,
  type GeoZoneChangedPayload,
} from '@apnatown/shared';
import {
  EVENT_FACTORY,
  type EventFactory,
} from '../../../shared/events/event-factory';
import { OUTBOX_WRITER, type OutboxWriter } from '../../../shared/events/ports';
import type { TxContext } from '../../../shared/persistence/ports';

/**
 * Geo outbox events, appended in the write transaction and published after
 * commit; consumers invalidate city/serviceability and quote caches.
 */
@Injectable()
export class GeoEvents {
  constructor(
    @Inject(EVENT_FACTORY) private readonly events: EventFactory,
    @Inject(OUTBOX_WRITER) private readonly outbox: OutboxWriter,
  ) {}

  cityStatusChanged(
    tx: TxContext,
    payload: GeoCityStatusChangedPayload,
    correlationId: string,
  ): Promise<void> {
    const data = GeoCityStatusChangedPayloadSchema.parse(payload);
    return this.outbox.append(
      tx,
      this.events.create(
        GEO_EVENT_TYPES.cityStatusChanged,
        { type: 'city', id: data.cityId, version: data.version },
        data,
        correlationId,
      ),
    );
  }

  zoneChanged(
    tx: TxContext,
    payload: GeoZoneChangedPayload,
    correlationId: string,
  ): Promise<void> {
    const data = GeoZoneChangedPayloadSchema.parse(payload);
    return this.outbox.append(
      tx,
      this.events.create(
        GEO_EVENT_TYPES.zoneChanged,
        { type: 'zone', id: data.zoneId, version: data.version },
        data,
        correlationId,
      ),
    );
  }
}
