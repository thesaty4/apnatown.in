import { Inject, Injectable } from '@nestjs/common';
import { IdSchema } from '@apnatown/shared/wire';
import { DomainError } from '../../../shared/errors/errors';
import {
  UNIT_OF_WORK,
  type TxContext,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import {
  SETTINGS_READ,
  type SettingsReadPort,
} from '../../settings/application/settings-ports';
import {
  GEO_LOCATION_REPOSITORY,
  type GeoLocationRepository,
  type StoredFeeSlab,
} from '../domain/geo-location.repository';
import type {
  DeliveryQuote,
  GeoDeliveryPort,
  GeoPointInput,
} from './geo-delivery.port';

/**
 * First slab whose upper bound includes the distance; beyond the last band
 * the last fee applies (prototype behaviour). Slabs are ascending.
 */
export function feeForDistance(
  slabs: readonly StoredFeeSlab[],
  distanceKm: number,
): number | null {
  if (!slabs.length) return null;
  const slab =
    slabs.find((item) => distanceKm <= item.upperDistanceKm) ?? slabs.at(-1)!;
  return slab.feePaise;
}

const validPoint = (point: GeoPointInput) =>
  Number.isFinite(point.lat) &&
  Number.isFinite(point.lng) &&
  Math.abs(point.lat) <= 90 &&
  Math.abs(point.lng) <= 180;

/**
 * Single source of truth for platform-rider delivery fees. Distance is
 * straight-line (geodesic) between the stored points: no road-routing maps
 * provider is approved. Points are used per call and never stored/logged.
 */
@Injectable()
export class GeoDeliveryService implements GeoDeliveryPort {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(GEO_LOCATION_REPOSITORY)
    private readonly locations: GeoLocationRepository,
    @Inject(SETTINGS_READ) private readonly settings: SettingsReadPort,
  ) {}

  quoteDeliveryFee(
    input: {
      cityId: string;
      destination: GeoPointInput;
      origin: GeoPointInput;
    },
    tx?: TxContext,
  ): Promise<DeliveryQuote> {
    if (!IdSchema.safeParse(input.cityId).success)
      throw new DomainError('CITY_NOT_FOUND');
    if (!validPoint(input.destination) || !validPoint(input.origin))
      throw new DomainError('LOCATION_INVALID');
    const quote = async (transaction: TxContext): Promise<DeliveryQuote> => {
      const city = await this.locations.cityFiscal(transaction, input.cityId);
      if (!city) throw new DomainError('CITY_NOT_FOUND');
      if (city.status !== 'enabled')
        return { status: 'unserviceable', reason: 'city_disabled' };
      const zones = await this.locations.zonesAt(
        transaction,
        input.destination,
        null,
      );
      const inCity = zones.filter((zone) => zone.cityId === input.cityId);
      // The destination lies only in another city's configured zones.
      if (!inCity.length && zones.length)
        return { status: 'unserviceable', reason: 'outside_city' };
      const raw = await this.locations.distanceKm(
        transaction,
        input.origin,
        input.destination,
      );
      const distanceKm = Math.round(raw * 100) / 100;
      const zone = inCity.find((hit) => hit.status === 'active');
      if (zone) {
        const fee = feeForDistance(
          await this.locations.feeSlabs(transaction, zone.id),
          distanceKm,
        );
        if (fee !== null)
          return {
            status: 'quoted',
            cityVersion: city.version,
            distanceKm,
            feePaise: fee,
            source: 'zone',
            zoneId: zone.id,
            zoneVersion: zone.version,
          };
      }
      // Enabled, resolved city without a matching active zone: the global
      // default schedule from settings (Q-38); never a sample default.
      const schedule = await this.settings.get('delivery', transaction);
      const fee = schedule
        ? feeForDistance(
            schedule.value.slabs.map((slab) => ({
              upperDistanceKm: slab.uptoKm,
              feePaise: slab.feePaise,
            })),
            distanceKm,
          )
        : null;
      if (!schedule || fee === null)
        return { status: 'configuration_required' };
      return {
        status: 'quoted',
        cityVersion: city.version,
        distanceKm,
        feePaise: fee,
        source: 'default',
        settingsVersion: schedule.version,
      };
    };
    return tx ? quote(tx) : this.uow.run(quote);
  }
}
