import { Inject, Injectable } from '@nestjs/common';
import type { UserRole } from '@apnatown/shared/users';
import { IdSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import type { AdminReadContext } from '../../../shared/auth/ports';
import {
  IDENTITY_CRYPTO,
  type IdentityCrypto,
} from '../../../shared/auth/crypto';
import { DomainError } from '../../../shared/errors/errors';
import {
  UNIT_OF_WORK,
  type TxContext,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import {
  USER_ROLES_REPOSITORY,
  type UserRolesRepository,
} from '../domain/user-roles';
import type {
  ApprovedRoleCaller,
  UserAdminReadPort,
  UserRolePort,
} from './user-role-port';

const ALLOWED: Readonly<Record<ApprovedRoleCaller, readonly UserRole[]>> =
  Object.freeze({
    admin: ['admin', 'super_admin'],
    businesses: ['vendor', 'provider'],
    delivery: ['rider'],
  });
const ContactIdsSchema = z
  .array(IdSchema)
  .max(50)
  .refine((ids) => new Set(ids).size === ids.length);

@Injectable()
export class UserRolesService implements UserRolePort, UserAdminReadPort {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(USER_ROLES_REPOSITORY) private readonly roles: UserRolesRepository,
    @Inject(IDENTITY_CRYPTO) private readonly crypto: IdentityCrypto,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async assignApprovedRole(
    input: {
      userId: string;
      role: UserRole;
      sourceId: string;
      caller: ApprovedRoleCaller;
    },
    tx: TxContext,
  ): Promise<void> {
    if (
      !ALLOWED[input.caller]?.includes(input.role) ||
      !IdSchema.safeParse(input.userId).success ||
      !IdSchema.safeParse(input.sourceId).success
    )
      throw new Error('ROLE_GRANT_NOT_ALLOWED');
    await this.roles.insert(tx, input.userId, input.role, this.clock.now());
  }

  hasActiveRole(
    input: { userId: string; role: UserRole },
    tx?: TxContext,
  ): Promise<boolean> {
    const read = (transaction: TxContext) =>
      this.roles.hasActive(transaction, input.userId, input.role);
    return tx ? read(tx) : this.uow.run(read);
  }

  activeHolders(
    input: {
      role: 'admin' | 'super_admin';
      afterUserId?: string | undefined;
      limit: number;
    },
    tx?: TxContext,
  ): Promise<string[]> {
    const read = (transaction: TxContext) =>
      this.roles.activeHolders(transaction, input.role, {
        afterUserId: input.afterUserId,
        limit: input.limit,
      });
    return tx ? read(tx) : this.uow.run(read);
  }

  adminContacts(
    ctx: AdminReadContext,
    input: { userIds: readonly string[] },
    tx?: TxContext,
  ): Promise<{ userId: string; phoneE164: string }[]> {
    const parsed = ContactIdsSchema.safeParse(input.userIds);
    if (!parsed.success) throw new DomainError('VALIDATION_ERROR');
    const read = async (transaction: TxContext) => {
      // Recheck the current grant; the context alone is not authority.
      if (
        !ctx.isSuper ||
        !(await this.roles.hasActive(
          transaction,
          ctx.actorUserId,
          'super_admin',
        ))
      )
        throw new DomainError('COMMON_FORBIDDEN');
      const rows = await this.roles.contacts(transaction, 'admin', parsed.data);
      return rows.flatMap((row) =>
        row.phoneCiphertext
          ? [
              {
                userId: row.userId,
                phoneE164: this.crypto.decrypt(
                  row.phoneCiphertext,
                  `user:${row.userId}:phone`,
                ),
              },
            ]
          : [],
      );
    };
    return tx ? read(tx) : this.uow.run(read);
  }
}
