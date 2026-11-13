import { Inject, Injectable } from '@nestjs/common';
import {
  SESSION_ACCESS,
  type SessionAccess,
  type SessionBinding,
} from '../../../shared/auth';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import { USERS_REPOSITORY, type UsersRepository } from '../domain/identity';
import {
  ADDRESS_REPOSITORY,
  type AddressRepository,
  type StoredAddress,
} from '../domain/address';

@Injectable()
export class AddressAccess {
  constructor(
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(USERS_REPOSITORY) private readonly users: UsersRepository,
    @Inject(ADDRESS_REPOSITORY) private readonly addresses: AddressRepository,
  ) {}
  async own(
    tx: TxContext,
    binding: SessionBinding,
    actorId?: string,
  ): Promise<string> {
    const principal = await this.sessions.requirePrincipal(tx, binding);
    if (actorId !== undefined && actorId !== principal.userId)
      throw new DomainError('COMMON_FORBIDDEN');
    await this.lockUser(tx, principal.userId);
    return principal.userId;
  }
  /** Serializes default switches, edits and deletion across all of this user's sessions. */
  async lockUser(tx: TxContext, userId: string): Promise<void> {
    const user = await this.users.lock(tx, userId);
    if (!user) throw new DomainError('USER_NOT_FOUND');
    if (user.accountStatus !== 'active' || user.deletedAt)
      throw new DomainError('ACCOUNT_UNAVAILABLE');
  }
  async address(
    tx: TxContext,
    userId: string,
    id: string,
    tombstone = false,
  ): Promise<StoredAddress> {
    const row = await this.addresses.lock(tx, id);
    if (!row) throw new DomainError('ADDRESS_NOT_FOUND');
    if (row.userId !== userId) throw new DomainError('ADDRESS_OUT_OF_SCOPE');
    if (row.deletedAt && !tombstone) throw new DomainError('ADDRESS_NOT_FOUND');
    return row;
  }
}
