import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { IdSchema, LimitSchema } from '@apnatown/shared/wire';
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
  GEO_ADMIN_REPOSITORY,
  type GeoAdminRepository,
  type NamedCursor,
  type OptionVisibility,
} from '../domain/geo-admin.repository';
import type {
  GeoAdminReadPort,
  GeoOptionPage,
  GeoScopeOption,
  ZoneRef,
  ZoneScope,
} from './geo-admin-read.port';

const positionSchema = z.tuple([z.string(), IdSchema]);
const optionsInputSchema = z.strictObject({
  kind: z.enum(['city', 'area', 'zone']),
  cityId: IdSchema.optional(),
  q: z.string().trim().max(100).optional(),
  cursor: z.string().optional(),
  limit: LimitSchema.optional(),
});

/** Scoped geo option/summary reads and zone scope facts for Admin. */
@Injectable()
export class GeoAdminReadService implements GeoAdminReadPort {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(GEO_ADMIN_REPOSITORY)
    private readonly repository: GeoAdminRepository,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
  ) {}

  async options(
    ctx: AdminReadContext,
    raw: {
      kind: 'city' | 'area' | 'zone';
      cityId?: string;
      q?: string;
      cursor?: string;
      limit?: number;
    },
  ): Promise<GeoOptionPage> {
    const parsed = optionsInputSchema.safeParse(raw);
    if (!parsed.success)
      throw new DomainError('VALIDATION_ERROR', {
        field: String(parsed.error.issues[0]?.path[0] ?? 'kind'),
      });
    const input = parsed.data;
    const limit = input.limit ?? 20;
    const q = input.q ?? '';
    const cityId = input.cityId ?? null;
    const platform = ctx.isSuper || ctx.scope.platformWide;
    const visibility: OptionVisibility = platform
      ? null
      : { cityIds: ctx.scope.cityWideIds, areaIds: ctx.scope.areaIds };
    const binding: CursorBinding = {
      operation: `geo.admin.options.${input.kind}`,
      sort: 'name-id',
      filters: { cityId, q },
      scope: { actor: ctx.actorUserId, revision: ctx.scopeRevision },
    };
    const after = this.position(input.cursor, binding);
    const page = { q, limit, ...(after ? { after } : {}) };
    const items: GeoScopeOption[] = await this.uow.run(async (tx) => {
      if (input.kind === 'city')
        return (
          await this.repository.cityOptions(tx, { visibility, ...page })
        ).map((row) => ({ kind: 'city' as const, ...row }));
      if (input.kind === 'area')
        return (
          await this.repository.areaOptions(tx, {
            visibility,
            cityId,
            ...page,
          })
        ).map((row) => ({ kind: 'area' as const, ...row }));
      // Zone choices need whole-city authority: area grants never imply
      // a zone (no zone-area mapping is supplied).
      return (
        await this.repository.zoneOptions(tx, {
          cityIds: platform ? null : ctx.scope.cityWideIds,
          cityId,
          ...page,
        })
      ).map((row) => ({ kind: 'zone' as const, ...row }));
    });
    const visible = items.slice(0, limit);
    const last = visible.at(-1);
    return {
      items: visible,
      nextCursor:
        items.length > limit && last
          ? this.cursors.encode(binding, [
              last.kind === 'zone' ? last.name : last.nameEn,
              last.id,
            ])
          : null,
    };
  }

  summary(
    ctx: AdminReadContext,
  ): Promise<{ enabledCities: number; waitlistSignups: number }> {
    if (!ctx.isSuper) throw new DomainError('COMMON_FORBIDDEN');
    return this.uow.run((tx) => this.repository.summary(tx));
  }

  resolveZoneScope(
    input: { zoneIds: readonly string[] },
    tx?: TxContext,
  ): Promise<{
    zones: readonly ZoneScope[];
    revision: string;
    unresolved: readonly string[];
  }> {
    const ids = [...new Set(input.zoneIds)]
      .filter((id) => IdSchema.safeParse(id).success)
      .sort();
    const read = async (transaction: TxContext) => {
      const rows = await this.repository.zonesByIds(transaction, ids);
      const zones = rows.map((row) => ({
        id: row.id,
        cityId: row.cityId,
        // Area-boundary/zone-area mapping source is an open question.
        areaIds: [] as string[],
        version: row.version,
      }));
      return {
        zones,
        revision: createHash('sha256')
          .update(
            JSON.stringify(
              zones.map((zone) => [zone.id, zone.cityId, zone.version]),
            ),
          )
          .digest('hex')
          .slice(0, 32),
        unresolved: zones.map((zone) => zone.id),
      };
    };
    return tx ? read(tx) : this.uow.run(read);
  }

  zonesInCities(
    cityIds: readonly string[],
    tx?: TxContext,
  ): Promise<ZoneRef[]> {
    const ids = [...new Set(cityIds)]
      .filter((id) => IdSchema.safeParse(id).success)
      .sort();
    if (!ids.length) return Promise.resolve([]);
    const read = async (transaction: TxContext) =>
      (await this.repository.zonesInCities(transaction, ids)).map((row) => ({
        id: row.id,
        cityId: row.cityId,
        name: row.name,
      }));
    return tx ? read(tx) : this.uow.run(read);
  }

  private position(
    cursor: string | undefined,
    binding: CursorBinding,
  ): NamedCursor | undefined {
    if (!cursor) return undefined;
    const parsed = positionSchema.safeParse(
      this.cursors.decode(cursor, binding),
    );
    if (!parsed.success)
      throw new DomainError('VALIDATION_ERROR', { field: 'cursor' });
    return { name: parsed.data[0], id: parsed.data[1] };
  }
}
