import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  normalizePermissions,
  RoleDeletedSchema,
  RoleSchema,
  RoleUpdateResultSchema,
  type CreateRole,
  type DeleteRoleQuery,
  type Role,
  type RoleDeleted,
  type RolePage,
  type RoleUpdateResult,
  type UpdateRole,
} from '@apnatown/shared/admin';
import type { PageQuery } from '@apnatown/shared/wire';
import { IdSchema } from '@apnatown/shared/wire';
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
  AUDIT_WRITER,
  type AuditWriter,
} from '../../audit/application/audit-writer.port';
import {
  ADMIN_REPOSITORY,
  ROLE_REPOSITORY,
  type AdminRepository,
  type RoleRepository,
  type RoleRow,
} from '../domain/admin';
import { AdminCommands, type AdminCommand } from './admin-command';
import { AdminEvents } from './admin-events';

const positionSchema = z.tuple([z.string().min(1).max(40), IdSchema]);
const ROLE_NAME_MAX = 40;
const AUDIT_FIELDS = ['name', 'description', 'permissions'] as const;

const toRole = (row: RoleRow): Role => RoleSchema.parse(row);
const summary = (row: RoleRow) => ({
  name: row.name,
  description: row.description,
  permissions: row.permissions,
});

@Injectable()
export class RolesService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(ADMIN_REPOSITORY) private readonly admins: AdminRepository,
    @Inject(AUDIT_WRITER) private readonly audit: AuditWriter,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    private readonly commands: AdminCommands,
    private readonly events: AdminEvents,
  ) {}

  list(ctx: AdminReadContext, query: PageQuery): Promise<RolePage> {
    if (!ctx.isSuper) throw new DomainError('COMMON_FORBIDDEN');
    const binding: CursorBinding = {
      operation: 'super-admin.roles',
      sort: 'name-id-asc',
      filters: {},
      scope: { actor: ctx.actorUserId },
    };
    let after: { name: string; id: string } | undefined;
    if (query.cursor) {
      const parsed = positionSchema.safeParse(
        this.cursors.decode(query.cursor, binding),
      );
      if (!parsed.success) throw new DomainError('VALIDATION_ERROR');
      after = { name: parsed.data[0], id: parsed.data[1] };
    }
    return this.uow.run(async (tx) => {
      const rows = await this.roles.page(tx, query.limit, after);
      const items = rows.slice(0, query.limit).map(toRole);
      const last = items.at(-1);
      return {
        items,
        nextCursor:
          rows.length > query.limit && last
            ? this.cursors.encode(binding, [last.name, last.id])
            : null,
      };
    });
  }

  create(command: AdminCommand, input: CreateRole): Promise<Role> {
    return this.commands.run(
      command,
      {
        name: 'super-admin.roles.create',
        method: 'POST',
        resource: '/super-admin/roles',
        successStatus: 201,
      },
      input,
      async (tx, actor) => {
        const row = await this.insert(tx, {
          name: input.name,
          description: input.description,
          permissions: normalizePermissions(input.permissions),
        });
        await this.audit.record(tx, {
          actor,
          action: 'role.created',
          entityType: 'role',
          entityId: row.id,
          summary: `Created role "${row.name}"`,
          before: null,
          after: summary(row),
          fields: AUDIT_FIELDS,
          correlationId: command.correlationId,
        });
        await this.events.roleUpdated(
          tx,
          {
            roleId: row.id,
            change: 'created',
            version: row.version,
            reassignedTo: null,
          },
          command.correlationId,
        );
        return toRole(row);
      },
      this.roleReceipt(),
    );
  }

  duplicate(command: AdminCommand, id: string): Promise<Role> {
    return this.commands.run(
      command,
      {
        name: 'super-admin.roles.duplicate',
        method: 'POST',
        resource: `/super-admin/roles/${id}/duplicate`,
        successStatus: 201,
      },
      {},
      async (tx, actor) => {
        const source = await this.roles.lock(tx, id, 'share');
        if (!source) throw new DomainError('ROLE_NOT_FOUND');
        const row = await this.insert(tx, {
          name: `Copy of ${source.name}`.slice(0, ROLE_NAME_MAX).trimEnd(),
          description: source.description,
          permissions: source.permissions,
        });
        await this.audit.record(tx, {
          actor,
          action: 'role.duplicated',
          entityType: 'role',
          entityId: row.id,
          summary: `Duplicated role "${source.name}" as "${row.name}"`,
          before: null,
          after: summary(row),
          fields: AUDIT_FIELDS,
          correlationId: command.correlationId,
        });
        await this.events.roleUpdated(
          tx,
          {
            roleId: row.id,
            change: 'created',
            version: row.version,
            reassignedTo: null,
          },
          command.correlationId,
        );
        return toRole(row);
      },
      this.roleReceipt(),
    );
  }

  update(
    command: AdminCommand,
    id: string,
    input: UpdateRole,
  ): Promise<RoleUpdateResult> {
    return this.commands.run(
      command,
      {
        name: 'super-admin.roles.update',
        method: 'PATCH',
        resource: `/super-admin/roles/${id}`,
        successStatus: 200,
      },
      input,
      async (tx, actor) => {
        await this.roles.lockNames(tx);
        const before = await this.roles.lock(tx, id, 'update');
        if (!before) throw new DomainError('ROLE_NOT_FOUND');
        if (before.isSystem) throw new DomainError('ROLE_SYSTEM_LOCKED');
        if (before.version !== input.expectedVersion)
          throw new DomainError('ROLE_VERSION_CONFLICT');
        const patch = {
          name: input.name,
          description: input.description,
          permissions: input.permissions
            ? normalizePermissions(input.permissions, before.permissions)
            : undefined,
        };
        if (
          patch.name !== undefined &&
          patch.name.toLowerCase() !== before.name.toLowerCase() &&
          (await this.roles.nameTaken(tx, patch.name, id))
        )
          throw new DomainError('ROLE_NAME_TAKEN', { field: 'name' });
        const next = {
          name: patch.name ?? before.name,
          description:
            patch.description === undefined
              ? before.description
              : patch.description,
          permissions: patch.permissions ?? before.permissions,
        };
        const changed =
          JSON.stringify(next) !== JSON.stringify(summary(before));
        if (!changed)
          return RoleUpdateResultSchema.parse({
            role: toRole(before),
            summary: { before: summary(before), after: next, changed },
          });
        // Existing admins keep their own permissions; role edits only seed.
        await this.roles.update(tx, id, patch, this.clock.now());
        const after = await this.mustRead(tx, id);
        await this.audit.record(tx, {
          actor,
          action: 'role.updated',
          entityType: 'role',
          entityId: id,
          summary: `Updated role "${after.name}"`,
          before: summary(before),
          after: summary(after),
          fields: AUDIT_FIELDS,
          correlationId: command.correlationId,
        });
        await this.events.roleUpdated(
          tx,
          {
            roleId: id,
            change: 'updated',
            version: after.version,
            reassignedTo: null,
          },
          command.correlationId,
        );
        return RoleUpdateResultSchema.parse({
          role: toRole(after),
          summary: { before: summary(before), after: summary(after), changed },
        });
      },
      {
        // Role summaries carry no PII; the result is stored as-is.
        store: (result) => result,
        replay: (_tx, stored) =>
          Promise.resolve(RoleUpdateResultSchema.parse(stored)),
      },
    );
  }

  delete(
    command: AdminCommand,
    id: string,
    query: DeleteRoleQuery,
  ): Promise<RoleDeleted> {
    return this.commands.run(
      command,
      {
        name: 'super-admin.roles.delete',
        method: 'DELETE',
        resource: `/super-admin/roles/${id}`,
        successStatus: 200,
      },
      { reassignTo: query.reassignTo ?? null },
      async (tx, actor) => {
        const role = await this.roles.lock(tx, id, 'update');
        if (!role) throw new DomainError('ROLE_NOT_FOUND');
        if (role.isSystem) throw new DomainError('ROLE_SYSTEM_LOCKED');
        let reassignedTo: string | null = null;
        let reassignedCount = 0;
        // adminCount is re-read under the role lock; assignments take a share lock.
        if (role.adminCount > 0) {
          if (!query.reassignTo || query.reassignTo === id)
            throw new DomainError('ROLE_IN_USE', { field: 'reassignTo' });
          const target = await this.roles.lock(tx, query.reassignTo, 'share');
          if (!target)
            throw new DomainError('ROLE_NOT_FOUND', { field: 'reassignTo' });
          const moved = await this.admins.reassignRole(
            tx,
            id,
            target.id,
            this.clock.now(),
          );
          for (const admin of moved)
            await this.events.scopeChanged(
              tx,
              { userId: admin.userId, change: 'role', version: admin.version },
              command.correlationId,
            );
          reassignedTo = target.id;
          reassignedCount = moved.length;
        }
        await this.roles.delete(tx, id);
        await this.audit.record(tx, {
          actor,
          action: 'role.deleted',
          entityType: 'role',
          entityId: id,
          summary:
            reassignedCount > 0
              ? `Deleted role "${role.name}" and reassigned ${reassignedCount} admins`
              : `Deleted role "${role.name}"`,
          before: { ...summary(role), adminCount: role.adminCount },
          after: null,
          fields: [...AUDIT_FIELDS, 'adminCount'],
          correlationId: command.correlationId,
        });
        await this.events.roleUpdated(
          tx,
          {
            roleId: id,
            change: 'deleted',
            version: role.version + 1,
            reassignedTo,
          },
          command.correlationId,
        );
        return RoleDeletedSchema.parse({
          id,
          deleted: true,
          reassignedTo,
          reassignedCount,
        });
      },
      {
        store: (result) => result,
        replay: (_tx, stored) =>
          Promise.resolve(RoleDeletedSchema.parse(stored)),
      },
    );
  }

  private async insert(
    tx: TxContext,
    role: {
      name: string;
      description: string | null;
      permissions: RoleRow['permissions'];
    },
  ): Promise<RoleRow> {
    await this.roles.lockNames(tx);
    if (await this.roles.nameTaken(tx, role.name))
      throw new DomainError('ROLE_NAME_TAKEN', { field: 'name' });
    const id = this.ids.uuidv7();
    await this.roles.insert(tx, { id, ...role, now: this.clock.now() });
    return this.mustRead(tx, id);
  }

  private async mustRead(tx: TxContext, id: string): Promise<RoleRow> {
    const row = await this.roles.read(tx, id);
    if (!row) throw new Error('ROLE_MISSING');
    return row;
  }

  /** Receipt is the role ID; replay re-projects the current role. */
  private roleReceipt() {
    return {
      store: (result: Role): JsonValue => ({ id: result.id }),
      replay: async (tx: TxContext, stored: JsonValue): Promise<Role> => {
        const { id } = z.strictObject({ id: IdSchema }).parse(stored);
        const row = await this.roles.read(tx, id);
        // A since-deleted role cannot be re-projected.
        if (!row) throw new DomainError('ROLE_NOT_FOUND');
        return toRole(row);
      },
    };
  }
}
