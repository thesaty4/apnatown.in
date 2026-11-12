import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  AreaSchema,
  CitySchema,
  LocationResolutionSchema,
  WaitlistAcceptedSchema,
  type LocationResolution,
  type LocationResolve,
  type WaitlistAccepted,
  type WaitlistRequest,
} from '@apnatown/shared/geo';
import { normalizePhone } from '@apnatown/shared/users';
import type { SessionBinding } from '../../../shared/auth';
import {
  IDENTITY_CRYPTO,
  type IdentityCrypto,
} from '../../../shared/auth/crypto';
import { SESSION_ACCESS, type SessionAccess } from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import {
  COMMAND_CONTEXT_FACTORY,
  HttpCommandContextFactory,
} from '../../../shared/idempotency/context';
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
import {
  GEO_LOCATION_REPOSITORY,
  type GeoLocationRepository,
} from '../domain/geo-location.repository';
import type { GeoArea, GeoCity } from '../domain/geo-read.repository';

/** Abuse limits for public geo POSTs (per session and per network address). */
export const GEO_RESOLVE_LIMIT = {
  key: 'geo.location.resolve',
  maximumHits: 30,
  windowSeconds: 60,
} as const;
export const GEO_WAITLIST_LIMIT = {
  key: 'geo.waitlist',
  maximumHits: 5,
  windowSeconds: 3600,
} as const;
// Local retry horizon for waitlist receipts, not a retention policy.
const RECEIPT_TTL_MS = 24 * 60 * 60 * 1000;

export interface WaitlistSubmission {
  session: SessionBinding;
  /** Authenticated user from the guard; null for an anonymous session. */
  principalId: string | null;
  correlationId: string;
  key: unknown;
}

const cityDto = (city: GeoCity) =>
  CitySchema.parse({
    id: city.id,
    slug: city.slug,
    nameEn: city.nameEn,
    nameHi: city.nameHi,
    status: city.status,
  });
const areaDto = (area: GeoArea) =>
  AreaSchema.parse({
    id: area.id,
    cityId: area.cityId,
    slug: area.slug,
    nameEn: area.nameEn,
    nameHi: area.nameHi,
    pinCode: area.pinCode,
  });

/**
 * Public location resolution and the service-area waitlist. Coordinates are
 * used for one PostGIS lookup against stored zones and are never stored or
 * logged; no maps/geocoding provider is called (none is approved).
 */
@Injectable()
export class GeoLocationService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY)
    private readonly contexts: HttpCommandContextFactory,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(GEO_LOCATION_REPOSITORY)
    private readonly locations: GeoLocationRepository,
    @Inject(IDENTITY_CRYPTO) private readonly crypto: IdentityCrypto,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
  ) {}

  resolve(input: LocationResolve): Promise<LocationResolution> {
    return this.uow.run(async (tx) => {
      const chosen = input.cityId
        ? await this.locations.findCity(tx, input.cityId)
        : null;
      if (input.cityId && !chosen) throw new DomainError('CITY_NOT_FOUND');
      const cityId = chosen?.id ?? null;

      if (input.areaId) {
        const area = await this.locations.findArea(tx, input.areaId);
        if (!area || (cityId && area.cityId !== cityId))
          throw new DomainError('AREA_NOT_FOUND');
        return this.result(tx, 'area', area.cityId, area, null);
      }

      if (input.pinCode) {
        const areas = await this.locations.areasByPin(
          tx,
          input.pinCode,
          cityId,
        );
        const cities = new Set(areas.map((area) => area.cityId));
        // A PIN shared by several cities is ambiguous: ask for a manual pick.
        if (cities.size !== 1) throw new DomainError('LOCATION_UNRESOLVED');
        const [only] = cities;
        return this.result(
          tx,
          'pin',
          only!,
          areas.length === 1 ? areas[0]! : null,
          null,
        );
      }

      if (input.lat === undefined || input.lng === undefined)
        throw new DomainError('LOCATION_INVALID', { field: 'lat' });
      const zones = await this.locations.zonesAt(
        tx,
        { lat: input.lat, lng: input.lng },
        cityId,
      );
      const cities = new Set(zones.map((zone) => zone.cityId));
      // No configured boundary contains the point (or it is ambiguous):
      // manual city/area selection remains available.
      if (cities.size !== 1) throw new DomainError('LOCATION_UNRESOLVED');
      const [only] = cities;
      const zone = zones.find((hit) => hit.status === 'active') ?? null;
      // Zones are delivery-fee polygons, not area boundaries: no area claim.
      return this.result(
        tx,
        'gps',
        only!,
        null,
        zone ? { id: zone.id, name: zone.name } : null,
      );
    });
  }

  /** POST /geo/waitlist: anonymous or signed-in, idempotent, 202. */
  joinWaitlist(
    request: WaitlistSubmission,
    input: WaitlistRequest,
  ): Promise<WaitlistAccepted> {
    const phone = normalizePhone(input.phone);
    const cityId = input.cityId ?? null;
    const command = this.contexts.create(
      {
        name: 'geo.waitlist.create',
        method: 'POST',
        scope: 'principal',
        successStatus: 202,
      },
      {
        actorId: request.principalId ?? request.session.id,
        correlationId: request.correlationId,
        resource: '/geo/waitlist',
        business: null,
        expiresAt: new Date(this.clock.now().getTime() + RECEIPT_TTL_MS),
      },
      // Keyed request hash only; the phone itself is never stored here.
      { key: request.key, payload: { cityId, phone } },
    );
    return this.commands.run(
      command,
      async (tx) => {
        if (request.principalId) {
          const principal = await this.sessions.requirePrincipal(
            tx,
            request.session,
          );
          if (principal.userId !== request.principalId)
            throw new DomainError('SESSION_EXPIRED');
        }
        if (cityId && !(await this.locations.findCity(tx, cityId)))
          throw new DomainError('CITY_NOT_FOUND');
        const id = this.ids.uuidv7();
        // Encrypted phone + keyed lookup hash only. Not marketing consent;
        // no message or job is created until Q-35 defines target/channel.
        await this.locations.insertWaitlist(tx, {
          id,
          cityId,
          phoneCiphertext: this.crypto.encrypt(
            phone,
            `geo:waitlist:${id}:phone`,
          ),
          phoneLookupHash: this.crypto.phoneHash(phone),
          at: this.clock.now(),
        });
        return WaitlistAcceptedSchema.parse({
          requestId: id,
        }) as WaitlistAccepted & JsonValue;
      },
      {
        store: (result) => result,
        replay: (_tx, stored) =>
          Promise.resolve(
            WaitlistAcceptedSchema.parse(stored) as WaitlistAccepted &
              JsonValue,
          ),
      },
    );
  }

  private async result(
    tx: TxContext,
    source: LocationResolution['source'],
    cityId: string,
    area: GeoArea | null,
    zone: LocationResolution['zone'],
  ): Promise<LocationResolution> {
    const city = await this.locations.findCity(tx, cityId);
    if (!city) throw new DomainError('CITY_NOT_FOUND');
    return LocationResolutionSchema.parse({
      source,
      city: cityDto(city),
      area: area ? areaDto(area) : null,
      zone,
      // City-level serviceability only; business delivery radius is separate.
      serviceable: city.status === 'enabled',
    });
  }
}
