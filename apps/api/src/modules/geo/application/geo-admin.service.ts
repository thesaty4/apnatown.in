import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  ADMIN_CITY_DETAIL_LIMIT,
  AdminCityDetailSchema,
  AdminCityPageSchema,
  AdminCitySchema,
  CityStatusSchema,
  GeoJsonPolygonSchema,
  ZoneDeletedSchema,
  ZoneSchema,
  type AdminCity,
  type AdminCityDetail,
  type AdminCityPage,
  type CityStatus,
  type CreateCity,
  type CreateZone,
  type DeleteZone,
  type GeoJsonPolygon,
  type SetCityStatus,
  type UpdateCityStateCode,
  type UpdateZone,
  type Zone,
  type ZoneDeleted,
} from '@apnatown/shared/geo';
import { IdSchema, type PageQuery } from '@apnatown/shared/wire';
import { z } from 'zod';
import type { AdminReadContext } from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import {
  CURSOR_CODEC,
  CursorCodec,
  type CursorBinding,
} from '../../../shared/pagination/cursor';
import {
  UNIT_OF_WORK,
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
  AdminCommands,
  type AdminCommand,
  type SuperActor,
} from '../../admin/application/admin-command';
import {
  AUDIT_WRITER,
  type AuditSnapshot,
  type AuditWriter,
} from '../../audit/application/audit-writer.port';
import {
  GEO_ADMIN_REPOSITORY,
  type GeoAdminRepository,
  type StoredCity,
  type StoredZone,
} from '../domain/geo-admin.repository';
import { GeoEvents } from './geo-events';

// `stateCode` would be redacted by the audit writer (key word "code"); the
// GST state is not sensitive, so it is audited as `gstState`.
const CITY_AUDIT_FIELDS = [
  'slug',
  'nameEn',
  'nameHi',
  'gstState',
  'status',
  'version',
] as const;
const ZONE_AUDIT_FIELDS = [
  'cityId',
  'name',
  'status',
  'polygon',
  'feeSlabs',
  'version',
] as const;
const cityPosition = z.tuple([CityStatusSchema, z.string(), IdSchema]);

/** Prototype edges only (G-11): Enable disabled/coming_soon, Disable enabled. */
export function nextCityStatus(
  current: CityStatus,
  action: SetCityStatus['action'],
): CityStatus | null {
  if (action === 'enable')
    return current === 'disabled' || current === 'coming_soon'
      ? 'enabled'
      : null;
  return current === 'enabled' ? 'coming_soon' : null;
}

/** Lowercase ASCII words joined by single hyphens (DB CHECK mirrors this). */
export function citySlug(nameEn: string): string {
  return nameEn
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

function cityDto(row: StoredCity): AdminCity {
  return AdminCitySchema.parse({
    id: row.id,
    slug: row.slug,
    nameEn: row.nameEn,
    nameHi: row.nameHi,
    stateCode: row.stateCode,
    status: row.status,
    version: row.version,
    counts: {
      areas: row.areaCount,
      zones: row.zoneCount,
      waitlist: row.waitlistCount,
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function zoneDto(row: StoredZone): Zone {
  return ZoneSchema.parse({
    id: row.id,
    cityId: row.cityId,
    name: row.name,
    status: row.status,
    polygon: GeoJsonPolygonSchema.parse(JSON.parse(row.polygon)),
    feeSlabs: row.feeSlabs.map((slab) => ({
      upperDistanceKm: Number(slab.upperDistanceKm),
      feePaise: Number(slab.feePaise),
    })),
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function citySnapshot(row: StoredCity): AuditSnapshot {
  return {
    slug: row.slug,
    nameEn: row.nameEn,
    nameHi: row.nameHi,
    gstState: row.stateCode,
    status: row.status,
    version: row.version,
  };
}

/** Bounded polygon fingerprint for audit (full geometry stays in `zones`). */
function polygonSummary(polygon: GeoJsonPolygon): JsonValue {
  const positions = polygon.coordinates.flat();
  const lngs = positions.map((position) => position[0]);
  const lats = positions.map((position) => position[1]);
  return {
    rings: polygon.coordinates.length,
    positions: positions.length,
    bbox: [
      Math.min(...lngs),
      Math.min(...lats),
      Math.max(...lngs),
      Math.max(...lats),
    ],
    digest: createHash('sha256')
      .update(JSON.stringify(polygon.coordinates))
      .digest('hex')
      .slice(0, 16),
  };
}

function zoneSnapshot(zone: Zone): AuditSnapshot {
  return {
    cityId: zone.cityId,
    name: zone.name,
    status: zone.status,
    polygon: polygonSummary(zone.polygon),
    feeSlabs: zone.feeSlabs.map((slab) => ({
      upperDistanceKm: slab.upperDistanceKm,
      feePaise: slab.feePaise,
    })),
    version: zone.version,
  };
}

/**
 * Super-admin cities, zones and fee slabs (F-SA-004). Each write is one
 * idempotent command: super_admin recheck, optimistic version, audit entry
 * and outbox event commit atomically. Regular admins are always denied.
 */
@Injectable()
export class GeoAdminService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(GEO_ADMIN_REPOSITORY)
    private readonly repository: GeoAdminRepository,
    @Inject(AUDIT_WRITER) private readonly audit: AuditWriter,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    private readonly commands: AdminCommands,
    private readonly events: GeoEvents,
  ) {}

  async listCities(
    ctx: AdminReadContext,
    query: PageQuery,
  ): Promise<AdminCityPage> {
    this.assertSuper(ctx);
    const binding: CursorBinding = {
      operation: 'super-admin.geo.cities',
      sort: 'status-name-id',
      filters: null,
      scope: { actor: ctx.actorUserId, revision: ctx.scopeRevision },
    };
    let after: { status: CityStatus; nameEn: string; id: string } | undefined;
    if (query.cursor) {
      const parsed = cityPosition.safeParse(
        this.cursors.decode(query.cursor, binding),
      );
      if (!parsed.success)
        throw new DomainError('VALIDATION_ERROR', { field: 'cursor' });
      after = {
        status: parsed.data[0],
        nameEn: parsed.data[1],
        id: parsed.data[2],
      };
    }
    const rows = await this.uow.run((tx) =>
      this.repository.listCities(tx, {
        limit: query.limit,
        ...(after ? { after } : {}),
      }),
    );
    const items = rows.slice(0, query.limit).map(cityDto);
    const last = items.at(-1);
    return AdminCityPageSchema.parse({
      items,
      nextCursor:
        rows.length > query.limit && last
          ? this.cursors.encode(binding, [last.status, last.nameEn, last.id])
          : null,
    });
  }

  city(ctx: AdminReadContext, cityId: string): Promise<AdminCityDetail> {
    this.assertSuper(ctx);
    return this.uow.run(async (tx) => {
      const city = await this.repository.findCity(tx, cityId);
      if (!city) throw new DomainError('CITY_NOT_FOUND');
      const [areas, zones] = await Promise.all([
        this.repository.cityAreas(tx, cityId, ADMIN_CITY_DETAIL_LIMIT),
        this.repository.cityZones(tx, cityId, ADMIN_CITY_DETAIL_LIMIT),
      ]);
      return AdminCityDetailSchema.parse({
        city: cityDto(city),
        areas: areas.map((area) => ({
          id: area.id,
          cityId: area.cityId,
          slug: area.slug,
          nameEn: area.nameEn,
          nameHi: area.nameHi,
          pinCode: area.pinCode,
        })),
        zones: zones.map(zoneDto),
      });
    });
  }

  createCity(command: AdminCommand, input: CreateCity): Promise<AdminCity> {
    const slug = citySlug(input.nameEn);
    if (!slug) throw new DomainError('VALIDATION_ERROR', { field: 'nameEn' });
    return this.commands.run(
      command,
      {
        name: 'super-admin.geo.city.create',
        method: 'POST',
        resource: '/geo/admin/cities',
        successStatus: 201,
      },
      input,
      async (tx, actor) => {
        const id = this.ids.uuidv7();
        if (
          !(await this.repository.insertCity(tx, {
            id,
            slug,
            nameEn: input.nameEn,
            nameHi: input.nameHi,
            stateCode: input.stateCode,
            status: input.status,
            at: this.clock.now(),
          }))
        )
          throw new DomainError('CITY_SLUG_CONFLICT', { field: 'nameEn' });
        const city = (await this.repository.findCity(tx, id))!;
        await this.audit.record(tx, {
          actor,
          action: 'geo.city.created',
          entityType: 'city',
          entityId: id,
          cityId: id,
          summary: 'City created',
          before: null,
          after: citySnapshot(city),
          fields: CITY_AUDIT_FIELDS,
          correlationId: command.correlationId,
        });
        return cityDto(city) as AdminCity & JsonValue;
      },
      this.receipt(AdminCitySchema),
    );
  }

  updateStateCode(
    command: AdminCommand,
    cityId: string,
    input: UpdateCityStateCode,
  ): Promise<AdminCity> {
    return this.commands.run(
      command,
      {
        name: 'super-admin.geo.city.update',
        method: 'PATCH',
        resource: `/geo/admin/cities/${cityId}`,
        successStatus: 200,
      },
      input,
      async (tx, actor) => {
        const before = await this.lockCity(tx, cityId, input.expectedVersion);
        const after = await this.saveCity(tx, cityId, input.expectedVersion, {
          stateCode: input.stateCode,
        });
        await this.recordCity(tx, actor, command, {
          action: 'geo.city.state_updated',
          summary: 'City GST state corrected',
          before,
          after,
        });
        return cityDto(after) as AdminCity & JsonValue;
      },
      this.receipt(AdminCitySchema),
    );
  }

  setCityStatus(
    command: AdminCommand,
    cityId: string,
    input: SetCityStatus,
  ): Promise<AdminCity> {
    return this.commands.run(
      command,
      {
        name: 'super-admin.geo.city.status',
        method: 'POST',
        resource: `/geo/admin/cities/${cityId}/status`,
        successStatus: 200,
      },
      input,
      async (tx, actor) => {
        const before = await this.lockCity(tx, cityId, input.expectedVersion);
        const status = nextCityStatus(before.status, input.action);
        if (!status)
          throw new DomainError('CITY_TRANSITION_INVALID', {
            field: 'action',
          });
        // In-flight orders are never cancelled here; new discovery and
        // checkout recheck the current city status.
        const after = await this.saveCity(tx, cityId, input.expectedVersion, {
          status,
        });
        await this.recordCity(tx, actor, command, {
          action:
            input.action === 'enable'
              ? 'geo.city.enabled'
              : 'geo.city.disabled',
          summary: input.action === 'enable' ? 'City enabled' : 'City disabled',
          before,
          after,
        });
        await this.events.cityStatusChanged(
          tx,
          {
            cityId,
            previousStatus: before.status,
            status: after.status,
            version: after.version,
          },
          command.correlationId,
        );
        return cityDto(after) as AdminCity & JsonValue;
      },
      this.receipt(AdminCitySchema),
    );
  }

  createZone(
    command: AdminCommand,
    cityId: string,
    input: CreateZone,
  ): Promise<Zone> {
    return this.commands.run(
      command,
      {
        name: 'super-admin.geo.zone.create',
        method: 'POST',
        resource: `/geo/admin/cities/${cityId}/zones`,
        successStatus: 201,
      },
      input,
      async (tx, actor) => {
        // City row lock serializes overlap checks within the city.
        if (!(await this.repository.findCity(tx, cityId, true)))
          throw new DomainError('CITY_NOT_FOUND');
        const polygon = JSON.stringify(input.polygon);
        await this.assertGeometry(tx, {
          cityId,
          polygon,
          active: input.status === 'active',
          excludeZoneId: null,
        });
        const id = this.ids.uuidv7();
        const at = this.clock.now();
        await this.repository.insertZone(tx, {
          id,
          cityId,
          name: input.name,
          status: input.status,
          polygon,
          at,
        });
        await this.repository.replaceFeeSlabs(tx, id, input.feeSlabs, at);
        const zone = zoneDto((await this.repository.findZone(tx, id))!);
        await this.recordZone(tx, actor, command, {
          action: 'geo.zone.created',
          summary: 'Delivery zone created',
          before: null,
          after: zone,
        });
        await this.events.zoneChanged(
          tx,
          {
            zoneId: id,
            cityId,
            change: 'created',
            status: zone.status,
            version: zone.version,
          },
          command.correlationId,
        );
        return zone as Zone & JsonValue;
      },
      this.receipt(ZoneSchema),
    );
  }

  updateZone(
    command: AdminCommand,
    zoneId: string,
    input: UpdateZone,
  ): Promise<Zone> {
    return this.commands.run(
      command,
      {
        name: 'super-admin.geo.zone.update',
        method: 'PATCH',
        resource: `/geo/admin/zones/${zoneId}`,
        successStatus: 200,
      },
      input,
      async (tx, actor) => {
        const before = await this.lockZone(tx, zoneId, input.expectedVersion);
        const polygon =
          input.polygon !== undefined
            ? JSON.stringify(input.polygon)
            : undefined;
        const status = input.status ?? before.status;
        if (polygon !== undefined || status !== before.status)
          await this.assertGeometry(tx, {
            cityId: before.cityId,
            polygon: polygon ?? JSON.stringify(before.polygon),
            active: status === 'active',
            excludeZoneId: zoneId,
          });
        const at = this.clock.now();
        if (
          !(await this.repository.updateZone(tx, {
            id: zoneId,
            expectedVersion: input.expectedVersion,
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.status !== undefined ? { status: input.status } : {}),
            ...(polygon !== undefined ? { polygon } : {}),
            at,
          }))
        )
          throw new DomainError('GEO_VERSION_CONFLICT');
        if (input.feeSlabs)
          await this.repository.replaceFeeSlabs(tx, zoneId, input.feeSlabs, at);
        const after = zoneDto((await this.repository.findZone(tx, zoneId))!);
        await this.recordZone(tx, actor, command, {
          action: 'geo.zone.updated',
          summary: 'Delivery zone updated',
          before,
          after,
        });
        await this.events.zoneChanged(
          tx,
          {
            zoneId,
            cityId: after.cityId,
            change: 'updated',
            status: after.status,
            version: after.version,
          },
          command.correlationId,
        );
        return after as Zone & JsonValue;
      },
      this.receipt(ZoneSchema),
    );
  }

  deleteZone(
    command: AdminCommand,
    zoneId: string,
    input: DeleteZone,
  ): Promise<ZoneDeleted> {
    return this.commands.run(
      command,
      {
        name: 'super-admin.geo.zone.delete',
        method: 'DELETE',
        resource: `/geo/admin/zones/${zoneId}`,
        successStatus: 200,
      },
      input,
      async (tx, actor) => {
        const before = await this.lockZone(tx, zoneId, input.expectedVersion);
        if (
          !(await this.repository.deleteZone(tx, {
            id: zoneId,
            expectedVersion: input.expectedVersion,
          }))
        )
          throw new DomainError('GEO_VERSION_CONFLICT');
        // Points formerly in this zone fall back to the settings default
        // schedule for an enabled city (Q-38); slabs cascade.
        await this.recordZone(tx, actor, command, {
          action: 'geo.zone.deleted',
          summary: 'Delivery zone deleted',
          before,
          after: null,
        });
        await this.events.zoneChanged(
          tx,
          {
            zoneId,
            cityId: before.cityId,
            change: 'deleted',
            status: null,
            version: before.version + 1,
          },
          command.correlationId,
        );
        return ZoneDeletedSchema.parse({
          id: zoneId,
          cityId: before.cityId,
          deleted: true,
        }) as ZoneDeleted & JsonValue;
      },
      this.receipt(ZoneDeletedSchema),
    );
  }

  private assertSuper(ctx: AdminReadContext): void {
    if (!ctx.isSuper) throw new DomainError('COMMON_FORBIDDEN');
  }

  private receipt<S extends z.ZodType>(schema: S) {
    type Result = z.infer<S> & JsonValue;
    return {
      store: (result: Result): JsonValue => result,
      replay: (_tx: TxContext, stored: JsonValue) =>
        Promise.resolve(schema.parse(stored) as Result),
    };
  }

  private async lockCity(
    tx: TxContext,
    cityId: string,
    expectedVersion: number,
  ): Promise<StoredCity> {
    const city = await this.repository.findCity(tx, cityId, true);
    if (!city) throw new DomainError('CITY_NOT_FOUND');
    if (city.version !== expectedVersion)
      throw new DomainError('GEO_VERSION_CONFLICT');
    return city;
  }

  private async saveCity(
    tx: TxContext,
    cityId: string,
    expectedVersion: number,
    change: { status?: CityStatus; stateCode?: string },
  ): Promise<StoredCity> {
    if (
      !(await this.repository.updateCity(tx, {
        id: cityId,
        expectedVersion,
        ...change,
        at: this.clock.now(),
      }))
    )
      throw new DomainError('GEO_VERSION_CONFLICT');
    return (await this.repository.findCity(tx, cityId))!;
  }

  /** Locks the owning city (overlap serialization) and then the zone. */
  private async lockZone(
    tx: TxContext,
    zoneId: string,
    expectedVersion: number,
  ): Promise<Zone> {
    const found = await this.repository.findZone(tx, zoneId);
    if (!found) throw new DomainError('ZONE_NOT_FOUND');
    await this.repository.findCity(tx, found.cityId, true);
    const zone = await this.repository.findZone(tx, zoneId, true);
    if (!zone) throw new DomainError('ZONE_NOT_FOUND');
    if (zone.version !== expectedVersion)
      throw new DomainError('GEO_VERSION_CONFLICT');
    return zoneDto(zone);
  }

  /**
   * PostGIS validity (valid, non-empty, non-self-intersecting polygon) and,
   * for an active zone, no intersection with another active zone in the
   * city (Q-37 pending: touching borders also count as intersecting).
   */
  private async assertGeometry(
    tx: TxContext,
    input: {
      cityId: string;
      polygon: string;
      active: boolean;
      excludeZoneId: string | null;
    },
  ): Promise<void> {
    if ((await this.repository.checkPolygon(tx, input.polygon)) !== 'ok')
      throw new DomainError('ZONE_INVALID', { field: 'polygon' });
    if (
      input.active &&
      (await this.repository.overlapsActiveZone(tx, {
        cityId: input.cityId,
        geoJson: input.polygon,
        excludeZoneId: input.excludeZoneId,
      }))
    )
      throw new DomainError('ZONE_INVALID', { field: 'polygon' });
  }

  private recordCity(
    tx: TxContext,
    actor: SuperActor,
    command: AdminCommand,
    entry: {
      action: string;
      summary: string;
      before: StoredCity;
      after: StoredCity;
    },
  ): Promise<void> {
    return this.audit.record(tx, {
      actor,
      action: entry.action,
      entityType: 'city',
      entityId: entry.after.id,
      cityId: entry.after.id,
      summary: entry.summary,
      before: citySnapshot(entry.before),
      after: citySnapshot(entry.after),
      fields: CITY_AUDIT_FIELDS,
      correlationId: command.correlationId,
    });
  }

  private recordZone(
    tx: TxContext,
    actor: SuperActor,
    command: AdminCommand,
    entry: {
      action: string;
      summary: string;
      before: Zone | null;
      after: Zone | null;
    },
  ): Promise<void> {
    const zone = (entry.after ?? entry.before)!;
    return this.audit.record(tx, {
      actor,
      action: entry.action,
      entityType: 'zone',
      entityId: zone.id,
      cityId: zone.cityId,
      summary: entry.summary,
      before: entry.before ? zoneSnapshot(entry.before) : null,
      after: entry.after ? zoneSnapshot(entry.after) : null,
      fields: ZONE_AUDIT_FIELDS,
      correlationId: command.correlationId,
    });
  }
}
