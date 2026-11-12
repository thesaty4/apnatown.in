import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  allPermissions,
  maskEmail,
  normalizePermissions,
  PermissionMatrixSchema,
  type AdminCard,
  type AdminImpact,
  type AdminListQuery,
  type AdminMe,
  type AdminPage,
  type CreateAdmin,
  type SetAdminAreas,
  type SetAdminPermissions,
  type SetAdminRole,
  type SetAdminStatus,
} from '@apnatown/shared/admin';
import { PhoneInputSchema } from '@apnatown/shared/users';
import { IdSchema, TimestampSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import {
  AUTH_SESSION_PORT,
  type AdminReadContext,
  type AuthSessionPort,
} from '../../../shared/auth/ports';
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
  AUDIT_WRITER,
  type AuditWriter,
} from '../../audit/application/audit-writer.port';
import {
  GEO_SCOPE,
  type GeoScopePort,
} from '../../geo/application/geo-scope.port';
import {
  USER_IDENTITY,
  type UserIdentityPort,
} from '../../users/application/identity-port';
import {
  USER_ROLES,
  type UserRolePort,
} from '../../users/application/user-role-port';
import {
  ADMIN_REPOSITORY,
  ROLE_REPOSITORY,
  type AdminGrants,
  type AdminListFilters,
  type AdminRepository,
  type AreaGrant,
  type RoleRepository,
} from '../domain/admin';
import {
  AdminCommands,
  type AdminCommand,
  type SuperActor,
} from './admin-command';
import { AdminEvents } from './admin-events';
import { AdminProjection } from './admin-projection';

const positionSchema = z.tuple([TimestampSchema, IdSchema]);
const receiptSchema = z.strictObject({ id: IdSchema });
const AUDIT_FIELDS = [
  'displayName',
  'roleId',
  'status',
  'areaIds',
  'permissions',
] as const;

/** Platform-wide read context for super-admin command flows. */
function superContext(actor: SuperActor): AdminReadContext {
  return {
    actorUserId: actor.userId,
    isSuper: true,
    permission: null,
    scope: { platformWide: true, cityWideIds: [], areaIds: [] },
    scopeRevision: 'platform',
    locale: 'en',
  };
}
function snapshot(grants: AdminGrants): Record<string, JsonValue> {
  return {
    displayName: grants.account.displayName,
    roleId: grants.account.roleId,
    status: grants.account.status,
    areaIds: grants.areaGrants.map((grant) => grant.areaId).sort(),
    permissions: grants.permissions,
  };
}

@Injectable()
export class AdminAccountsService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(ADMIN_REPOSITORY) private readonly admins: AdminRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(USER_IDENTITY) private readonly identity: UserIdentityPort,
    @Inject(USER_ROLES) private readonly userRoles: UserRolePort,
    @Inject(GEO_SCOPE) private readonly geo: GeoScopePort,
    @Inject(AUTH_SESSION_PORT) private readonly sessions: AuthSessionPort,
    @Inject(AUDIT_WRITER) private readonly audit: AuditWriter,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    private readonly commands: AdminCommands,
    private readonly events: AdminEvents,
    private readonly projection: AdminProjection,
  ) {}

  me(ctx: AdminReadContext): Promise<AdminMe> {
    return this.uow.run(async (tx) => {
      const [profile] = await this.identity.describe(tx, [ctx.actorUserId]);
      if (ctx.isSuper)
        return {
          id: ctx.actorUserId,
          name: profile?.displayName ?? 'Super admin',
          emailMasked: null,
          areas: [],
          cityWideIds: [],
          permissions: allPermissions(),
          communicationScopes: ['city', 'zone'],
          scopeRevision: ctx.scopeRevision,
          isSuper: true,
        };
      const grants = await this.admins.read(tx, ctx.actorUserId);
      if (!grants) throw new DomainError('COMMON_FORBIDDEN');
      if (grants.account.status !== 'active')
        throw new DomainError('ADMIN_INACTIVE');
      return {
        id: ctx.actorUserId,
        name: grants.account.displayName,
        emailMasked: maskEmail(this.projection.email(grants)),
        areas: await this.geo.describeAreas(
          grants.areaGrants.map((grant) => grant.areaId),
          tx,
        ),
        cityWideIds: grants.cityWideIds,
        permissions: grants.permissions,
        communicationScopes: grants.account.communicationScopes,
        scopeRevision: `v${grants.account.version}`,
        isSuper: false,
      };
    });
  }

  list(ctx: AdminReadContext, query: AdminListQuery): Promise<AdminPage> {
    if (!ctx.isSuper) throw new DomainError('COMMON_FORBIDDEN');
    // No authoritative Geo zone→area mapping exists; never guess by city.
    if (query.zoneId)
      throw new DomainError('COMMON_UNAVAILABLE', { field: 'zoneId' });
    return this.uow.run(async (tx) => {
      const filters: AdminListFilters = {
        cityId: query.cityId,
        roleId: query.roleId,
        status: query.status,
      };
      if (query.q) {
        const phone = query.q.replace(/[\s-]/g, '');
        filters.q = {
          name: query.q,
          userId: PhoneInputSchema.safeParse(phone).success
            ? await this.identity.findByPhone(tx, phone)
            : null,
        };
      }
      if (query.areaId) {
        const [area] = await this.geo.describeAreas([query.areaId], tx);
        if (!area) throw new DomainError('AREA_NOT_FOUND', { field: 'areaId' });
        filters.area = { areaId: area.id, cityId: area.cityId };
      }
      const binding: CursorBinding = {
        operation: 'super-admin.admins',
        sort: 'createdAt-userId-desc',
        filters: {
          q: query.q ?? null,
          cityId: query.cityId ?? null,
          areaId: query.areaId ?? null,
          roleId: query.roleId ?? null,
          status: query.status ?? null,
        },
        scope: { actor: ctx.actorUserId, revision: ctx.scopeRevision },
      };
      let after: { createdAt: string; userId: string } | undefined;
      if (query.cursor) {
        const parsed = positionSchema.safeParse(
          this.cursors.decode(query.cursor, binding),
        );
        if (!parsed.success) throw new DomainError('VALIDATION_ERROR');
        after = { createdAt: parsed.data[0], userId: parsed.data[1] };
      }
      const ids = await this.admins.page(tx, filters, query.limit, after);
      const items = await this.projection.cards(
        tx,
        ctx,
        await this.admins.readMany(tx, ids.slice(0, query.limit)),
      );
      const last = items.at(-1);
      return {
        items,
        nextCursor:
          ids.length > query.limit && last
            ? this.cursors.encode(binding, [last.createdAt, last.id])
            : null,
        total: await this.admins.count(tx, filters),
      };
    });
  }

  create(command: AdminCommand, input: CreateAdmin): Promise<AdminCard> {
    return this.commands.run(
      command,
      {
        name: 'super-admin.admins.create',
        method: 'POST',
        resource: '/super-admin/admins',
        successStatus: 201,
      },
      input,
      async (tx, actor) => {
        const role = await this.roles.lock(tx, input.roleId, 'share');
        if (!role) throw new DomainError('ROLE_NOT_FOUND', { field: 'roleId' });
        const areas = await this.areaGrants(tx, input.areaIds);
        const principal = await this.identity.resolveVerifiedPhone(
          tx,
          input.phone,
        );
        // Never ACCOUNT_UNAVAILABLE here: clients treat it as the caller's own session ending.
        if (!principal)
          throw new DomainError('USER_NOT_FOUND', { field: 'phone' });
        const userId = principal.userId;
        if (
          principal.roles.includes('super_admin') ||
          (await this.admins.lock(tx, userId))
        )
          throw new DomainError('ADMIN_EXISTS');
        const now = this.clock.now();
        await this.admins.insert(tx, {
          userId,
          displayName: input.displayName,
          emailCiphertext: this.projection.encryptEmail(userId, input.email),
          roleId: role.id,
          createdBy: actor.userId,
          now,
        });
        await this.admins.replacePermissions(tx, userId, role.permissions);
        await this.admins.replaceAreaGrants(
          tx,
          userId,
          areas.map((area) => ({ ...area, id: this.ids.uuidv7() })),
        );
        await this.userRoles.assignApprovedRole(
          { userId, role: 'admin', sourceId: userId, caller: 'admin' },
          tx,
        );
        const created = await this.mustRead(tx, userId);
        await this.audit.record(tx, {
          actor,
          action: 'admin.created',
          entityType: 'admin_account',
          entityId: userId,
          relatedScopes: this.scopes(areas),
          summary: `Created admin account with role "${role.name}"`,
          before: null,
          after: snapshot(created),
          fields: AUDIT_FIELDS,
          correlationId: command.correlationId,
        });
        await this.events.scopeChanged(
          tx,
          { userId, change: 'created', version: created.account.version },
          command.correlationId,
        );
        return this.card(tx, actor, created);
      },
      this.cardReceipt(),
    );
  }

  impact(ctx: AdminReadContext, userId: string): Promise<AdminImpact> {
    if (!ctx.isSuper) throw new DomainError('COMMON_FORBIDDEN');
    return this.uow.run(async (tx) => {
      const grants = await this.admins.read(tx, userId);
      if (!grants) throw new DomainError('COMMON_NOT_FOUND');
      const covered = new Set(
        await this.admins.coveredAreas(tx, grants.areaGrants, userId),
      );
      return {
        adminId: userId,
        areasLeftWithoutActiveAdmin: await this.geo.describeAreas(
          grants.areaGrants
            .map((grant) => grant.areaId)
            .filter((id) => !covered.has(id)),
          tx,
        ),
        // No Orders/Reviews/Reports owner port exists yet: unavailable, not 0.
        openCasesInScope: null,
        unavailable: ['openCasesInScope'],
      };
    });
  }

  setStatus(
    command: AdminCommand,
    userId: string,
    input: SetAdminStatus,
  ): Promise<AdminCard> {
    return this.mutate(
      command,
      userId,
      'status',
      'POST',
      input,
      async (tx, actor, current) => {
        if (userId === actor.userId) throw new DomainError('ADMIN_SELF_ACTION');
        if (current.account.status === input.status) return null;
        const version = await this.admins.update(
          tx,
          userId,
          { status: input.status },
          this.clock.now(),
        );
        // Deactivation takes effect immediately: sessions revoked in this transaction.
        if (input.status === 'inactive')
          await this.sessions.revokeUserSessions({ userId }, tx);
        await this.events.statusChanged(
          tx,
          { userId, status: input.status, version },
          command.correlationId,
        );
        return {
          action: 'admin.status_changed',
          summary:
            input.status === 'inactive'
              ? 'Deactivated admin account and revoked sessions'
              : 'Reactivated admin account',
        };
      },
    );
  }

  setAreas(
    command: AdminCommand,
    userId: string,
    input: SetAdminAreas,
  ): Promise<AdminCard> {
    return this.mutate(
      command,
      userId,
      'areas',
      'PUT',
      input,
      async (tx, _actor, current) => {
        const areas = await this.areaGrants(tx, input.areaIds);
        const before = current.areaGrants.map((grant) => grant.areaId).sort();
        const next = areas.map((area) => area.areaId).sort();
        if (before.join() === next.join()) return null;
        await this.admins.replaceAreaGrants(
          tx,
          userId,
          areas.map((area) => ({ ...area, id: this.ids.uuidv7() })),
        );
        const version = await this.admins.update(
          tx,
          userId,
          {},
          this.clock.now(),
        );
        await this.events.scopeChanged(
          tx,
          { userId, change: 'areas', version },
          command.correlationId,
        );
        return {
          action: 'admin.areas_changed',
          summary: `Changed admin area assignment (${before.length} to ${next.length} areas)`,
          relatedScopes: this.scopes([...current.areaGrants, ...areas]),
        };
      },
    );
  }

  setPermissions(
    command: AdminCommand,
    userId: string,
    input: SetAdminPermissions,
  ): Promise<AdminCard> {
    return this.mutate(
      command,
      userId,
      'permissions',
      'PUT',
      input,
      async (tx, _actor, current) => {
        const next = normalizePermissions(
          input.permissions,
          current.permissions,
        );
        if (JSON.stringify(next) === JSON.stringify(current.permissions))
          return null;
        await this.admins.replacePermissions(tx, userId, next);
        const version = await this.admins.update(
          tx,
          userId,
          {},
          this.clock.now(),
        );
        await this.events.scopeChanged(
          tx,
          { userId, change: 'permissions', version },
          command.correlationId,
        );
        return {
          action: 'admin.permissions_changed',
          summary: 'Changed admin permissions',
        };
      },
    );
  }

  setRole(
    command: AdminCommand,
    userId: string,
    input: SetAdminRole,
  ): Promise<AdminCard> {
    return this.mutate(
      command,
      userId,
      'role',
      'PUT',
      input,
      async (tx, _actor, current) => {
        const role = await this.roles.lock(tx, input.roleId, 'share');
        if (!role) throw new DomainError('ROLE_NOT_FOUND', { field: 'roleId' });
        const reseed =
          input.reseedPermissions &&
          JSON.stringify(PermissionMatrixSchema.parse(role.permissions)) !==
            JSON.stringify(current.permissions);
        if (role.id === current.account.roleId && !reseed) return null;
        // Reseeding copies module permissions only; geography and
        // communication scopes are never expanded by a role.
        if (reseed)
          await this.admins.replacePermissions(tx, userId, role.permissions);
        const version = await this.admins.update(
          tx,
          userId,
          { roleId: role.id },
          this.clock.now(),
        );
        await this.events.scopeChanged(
          tx,
          { userId, change: 'role', version },
          command.correlationId,
        );
        return {
          action: 'admin.role_changed',
          summary: `Assigned role "${role.name}"${reseed ? ' and reseeded permissions' : ''}`,
        };
      },
    );
  }

  /**
   * Locked, version-checked admin edit with transactional before/after
   * audit. `change` returns null when nothing changed (no audit/event).
   */
  private mutate(
    command: AdminCommand,
    userId: string,
    name: 'status' | 'areas' | 'permissions' | 'role',
    method: 'POST' | 'PUT',
    input: { expectedVersion: number },
    change: (
      tx: TxContext,
      actor: SuperActor,
      current: AdminGrants,
    ) => Promise<{
      action: string;
      summary: string;
      relatedScopes?: ReturnType<AdminAccountsService['scopes']>;
    } | null>,
  ): Promise<AdminCard> {
    return this.commands.run(
      command,
      {
        name: `super-admin.admins.${name}`,
        method,
        resource: `/super-admin/admins/${userId}/${name}`,
        successStatus: 200,
      },
      input,
      async (tx, actor) => {
        const current = await this.admins.lock(tx, userId);
        if (!current) throw new DomainError('COMMON_NOT_FOUND');
        if (current.account.version !== input.expectedVersion)
          throw new DomainError('ADMIN_VERSION_CONFLICT');
        const result = await change(tx, actor, current);
        if (!result) return this.card(tx, actor, current);
        const updated = await this.mustRead(tx, userId);
        await this.audit.record(tx, {
          actor,
          action: result.action,
          entityType: 'admin_account',
          entityId: userId,
          relatedScopes:
            result.relatedScopes ?? this.scopes(updated.areaGrants),
          summary: result.summary,
          before: snapshot(current),
          after: snapshot(updated),
          fields: AUDIT_FIELDS,
          correlationId: command.correlationId,
        });
        return this.card(tx, actor, updated);
      },
      this.cardReceipt(userId),
    );
  }

  private async areaGrants(
    tx: TxContext,
    areaIds: readonly string[],
  ): Promise<AreaGrant[]> {
    const areas = await this.geo.describeAreas(areaIds, tx);
    if (areas.length !== new Set(areaIds).size)
      throw new DomainError('AREA_NOT_FOUND', { field: 'areaIds' });
    return areas.map((area) => ({ areaId: area.id, cityId: area.cityId }));
  }

  private scopes(areas: readonly AreaGrant[]) {
    const unique = new Map(areas.map((area) => [area.areaId, area]));
    return [...unique.values()].map((area) => ({
      cityId: area.cityId,
      areaId: area.areaId,
    }));
  }

  private async mustRead(tx: TxContext, userId: string): Promise<AdminGrants> {
    const grants = await this.admins.read(tx, userId);
    if (!grants) throw new Error('ADMIN_ACCOUNT_MISSING');
    return grants;
  }

  private async card(
    tx: TxContext,
    actor: SuperActor,
    grants: AdminGrants,
  ): Promise<AdminCard> {
    const [card] = await this.projection.cards(tx, superContext(actor), [
      grants,
    ]);
    if (!card) throw new Error('ADMIN_CARD_MISSING');
    return card;
  }

  /** Receipts hold only the admin ID; replay re-reads the current card. */
  private cardReceipt(expectedId?: string) {
    return {
      store: (result: AdminCard): JsonValue => ({ id: result.id }),
      replay: async (
        tx: TxContext,
        stored: JsonValue,
        actor: SuperActor,
      ): Promise<AdminCard> => {
        const { id } = receiptSchema.parse(stored);
        if (expectedId !== undefined && id !== expectedId)
          throw new Error('INVALID_ADMIN_RECEIPT');
        return this.card(tx, actor, await this.mustRead(tx, id));
      },
    };
  }
}
