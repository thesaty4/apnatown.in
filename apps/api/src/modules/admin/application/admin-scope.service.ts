import { Inject, Injectable } from '@nestjs/common';
import {
  AdminModuleSchema,
  ScopeRefSchema,
  type AdminAction,
  type AdminModule,
  type ScopeRef,
} from '@apnatown/shared/admin';
import { IdSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import type {
  AdminReadContext,
  AdminScopePort,
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
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
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
  type AdminGrants,
  type AdminRepository,
} from '../domain/admin';
import type {
  AdminRecipient,
  AdminRecipientsPort,
} from './admin-recipients.port';

/** Exact area grant or explicit whole-city grant; global needs super_admin. */
export function scopeAllowed(grants: AdminGrants, scope: ScopeRef): boolean {
  if (scope.cityId === null) return false;
  if (grants.cityWideIds.includes(scope.cityId)) return true;
  return (
    scope.areaId !== null &&
    grants.areaGrants.some(
      (grant) => grant.areaId === scope.areaId && grant.cityId === scope.cityId,
    )
  );
}

// [phase (0 super admins, 1 admins), started (0|1), last user ID]
const recipientCursor = z.tuple([
  z.union([z.literal(0), z.literal(1)]),
  z.union([z.literal(0), z.literal(1)]),
  IdSchema,
]);

@Injectable()
export class AdminScopeService implements AdminScopePort, AdminRecipientsPort {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(ADMIN_REPOSITORY) private readonly admins: AdminRepository,
    @Inject(USER_ROLES) private readonly roles: UserRolePort,
    @Inject(USER_IDENTITY) private readonly identity: UserIdentityPort,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  authorize(
    input: {
      actorUserId: string;
      module: AdminModule | null;
      action: AdminAction | null;
      scopes: readonly ScopeRef[];
    },
    tx?: TxContext,
  ): Promise<AdminReadContext> {
    if ((input.module === null) !== (input.action === null))
      throw new Error('INVALID_ADMIN_PERMISSION');
    const scopes = input.scopes.map((scope) => ScopeRefSchema.parse(scope));
    const permission =
      input.module && input.action
        ? { module: input.module, action: input.action }
        : null;
    const authorize = async (
      transaction: TxContext,
    ): Promise<AdminReadContext> => {
      const actorUserId = input.actorUserId;
      const [profile] = await this.identity.describe(transaction, [
        actorUserId,
      ]);
      const locale = profile?.locale ?? 'en';
      // Grants are read on every call; super_admin is platform-wide.
      if (
        await this.roles.hasActiveRole(
          { userId: actorUserId, role: 'super_admin' },
          transaction,
        )
      )
        return {
          actorUserId,
          isSuper: true,
          permission,
          scope: { platformWide: true, cityWideIds: [], areaIds: [] },
          scopeRevision: 'platform',
          locale,
        };
      const grants = (await this.roles.hasActiveRole(
        { userId: actorUserId, role: 'admin' },
        transaction,
      ))
        ? await this.admins.read(transaction, actorUserId)
        : null;
      if (!grants) throw new DomainError('COMMON_FORBIDDEN');
      if (grants.account.status !== 'active')
        throw new DomainError('ADMIN_INACTIVE');
      if (
        permission &&
        !grants.permissions[permission.module].includes(permission.action)
      )
        throw new DomainError('COMMON_FORBIDDEN');
      if (!scopes.every((scope) => scopeAllowed(grants, scope)))
        throw new DomainError('ADMIN_SCOPE_FORBIDDEN');
      await this.admins.touchLastActive(
        transaction,
        actorUserId,
        this.clock.now(),
      );
      return {
        actorUserId,
        isSuper: false,
        permission,
        scope: {
          platformWide: false,
          cityWideIds: [...grants.cityWideIds],
          areaIds: grants.areaGrants.map((grant) => grant.areaId),
        },
        scopeRevision: `v${grants.account.version}`,
        locale,
      };
    };
    return tx ? authorize(tx) : this.uow.run(authorize);
  }

  list(
    input: {
      module: AdminModule;
      action: 'view';
      scope: ScopeRef;
      cursor?: string;
      limit: number;
    },
    tx?: TxContext,
  ): Promise<{ items: AdminRecipient[]; nextCursor: string | null }> {
    const module = AdminModuleSchema.parse(input.module);
    const scope = ScopeRefSchema.parse(input.scope);
    if (
      input.action !== 'view' ||
      !Number.isSafeInteger(input.limit) ||
      input.limit < 1 ||
      input.limit > 500
    )
      throw new DomainError('VALIDATION_ERROR');
    const binding: CursorBinding = {
      operation: 'admin.recipients',
      sort: 'role-userId-asc',
      filters: { module, action: 'view', scope },
      scope: {},
    };
    let position: z.infer<typeof recipientCursor> | null = null;
    if (input.cursor) {
      const parsed = recipientCursor.safeParse(
        this.cursors.decode(input.cursor, binding),
      );
      if (!parsed.success) throw new DomainError('VALIDATION_ERROR');
      position = parsed.data;
    }
    const read = async (transaction: TxContext) => {
      const limit = input.limit;
      const items: AdminRecipient[] = [];
      const cursor = (phase: 0 | 1, started: 0 | 1, id: string) =>
        this.cursors.encode(binding, [phase, started, id]);
      if (!position || position[0] === 0) {
        const supers = await this.roles.activeHolders(
          {
            role: 'super_admin',
            afterUserId: position?.[2],
            limit: limit + 1,
          },
          transaction,
        );
        for (const userId of supers.slice(0, limit))
          items.push({ userId, audienceRole: 'super_admin' });
        const last = items.at(-1)?.userId;
        if (supers.length > limit && last)
          return { items, nextCursor: cursor(0, 1, last) };
        // Global/unresolved scope never fans out to area admins.
        if (scope.cityId === null) return { items, nextCursor: null };
        if (items.length === limit && last)
          return { items, nextCursor: cursor(1, 0, last) };
      }
      if (scope.cityId === null) return { items, nextCursor: null };
      const remaining = limit - items.length;
      const afterUserId =
        position?.[0] === 1 && position[1] === 1 ? position[2] : undefined;
      const admins = await this.admins.authorizedAdmins(transaction, {
        grant: { module, action: 'view' },
        scopes: [scope],
        afterUserId,
        limit: remaining + 1,
      });
      for (const userId of admins.slice(0, remaining))
        items.push({ userId, audienceRole: 'admin' });
      const last = items.at(-1)?.userId;
      return {
        items,
        nextCursor:
          admins.length > remaining && last ? cursor(1, 1, last) : null,
      };
    };
    return tx ? read(tx) : this.uow.run(read);
  }
}
