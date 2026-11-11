import { Inject, Injectable } from '@nestjs/common';
import type { Principal } from '@apnatown/shared/auth';
import { normalizePhone } from '@apnatown/shared/users';
import type { TxContext } from '../../../shared/persistence/ports';
import {
  IDENTITY_CRYPTO,
  type IdentityCrypto,
} from '../../../shared/auth/crypto';
import {
  CLOCK,
  ID_PROVIDER,
  type Clock,
  type IdProvider,
} from '../../../shared/runtime/providers';
import {
  USERS_REPOSITORY,
  type UsersRepository,
  type UserIdentity,
} from '../domain/identity';
import type { UserIdentityPort } from './identity-port';

@Injectable()
export class IdentityService implements UserIdentityPort {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly users: UsersRepository,
    @Inject(IDENTITY_CRYPTO) private readonly crypto: IdentityCrypto,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
  ) {}
  async resolveVerifiedPhone(
    tx: TxContext,
    phone: string,
  ): Promise<Principal | null> {
    const normalized = normalizePhone(phone);
    const hash = this.crypto.phoneHash(normalized);
    await this.users.lockPhone(tx, hash);
    let user = await this.users.findPhone(tx, hash);
    if (!user) {
      const id = this.ids.uuidv7();
      const now = this.clock.now();
      user = {
        id,
        phoneCiphertext: this.crypto.encrypt(normalized, `user:${id}:phone`),
        phoneLookupHash: hash,
        emailCiphertext: null,
        displayName: null,
        preferences: { locale: 'en', theme: 'light' },
        accountStatus: 'active',
        deletedAt: null,
        version: 1,
        roles: ['customer'],
        createdAt: now,
        updatedAt: now,
      };
      await this.users.insert(tx, user);
    }
    return this.principal(user);
  }
  async readPrincipal(
    tx: TxContext,
    userId: string,
  ): Promise<Principal | null> {
    return this.principal(await this.users.lock(tx, userId));
  }
  private principal(user: UserIdentity | null): Principal | null {
    if (!user || user.deletedAt || user.accountStatus !== 'active') return null;
    return {
      userId: user.id,
      roles: user.roles,
      accountStatus: user.accountStatus,
      // These states must be resolved through owner ports before privileged access exists.
      approvalStates: { businesses: 'unavailable', rider: 'unavailable' },
    };
  }
}
