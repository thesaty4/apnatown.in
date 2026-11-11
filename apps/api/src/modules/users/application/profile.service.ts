import { Inject, Injectable } from '@nestjs/common';
import type {
  Profile,
  UpdateProfile,
  UpdatePreferences,
} from '@apnatown/shared/users';
import {
  SESSION_ACCESS,
  type SessionAccess,
  type SessionBinding,
} from '../../../shared/auth';
import {
  IDENTITY_CRYPTO,
  type IdentityCrypto,
} from '../../../shared/auth/crypto';
import { DomainError } from '../../../shared/errors/errors';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
  type TxContext,
} from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import {
  USERS_REPOSITORY,
  type UsersRepository,
  type UserIdentity,
} from '../domain/identity';

@Injectable()
export class ProfileService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(USERS_REPOSITORY) private readonly users: UsersRepository,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(IDENTITY_CRYPTO) private readonly crypto: IdentityCrypto,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}
  profile(binding: SessionBinding): Promise<Profile> {
    return this.uow.run(async (tx) =>
      this.present(await this.own(tx, binding)),
    );
  }
  updateProfile(
    binding: SessionBinding,
    input: UpdateProfile,
  ): Promise<Profile> {
    return this.uow.run(async (tx) => {
      const user = await this.own(tx, binding);
      const patch: { displayName?: string; emailCiphertext?: string | null } =
        {};
      if (input.displayName !== undefined)
        patch.displayName = input.displayName;
      if (input.email !== undefined)
        patch.emailCiphertext =
          input.email === null
            ? null
            : this.crypto.encrypt(input.email, `user:${user.id}:email`);
      return this.present(
        await this.users.updateProfile(tx, user.id, patch, this.clock.now()),
      );
    });
  }
  preferences(binding: SessionBinding) {
    return this.uow.run(
      async (tx) => (await this.own(tx, binding)).preferences,
    );
  }
  updatePreferences(binding: SessionBinding, input: UpdatePreferences) {
    return this.uow.run(async (tx) => {
      const user = await this.own(tx, binding);
      // PATCH is naturally idempotent, including the version bookkeeping.
      if (
        (input.locale ?? user.preferences.locale) === user.preferences.locale &&
        (input.theme ?? user.preferences.theme) === user.preferences.theme
      )
        return user.preferences;
      return this.users.updatePreferences(
        tx,
        user.id,
        {
          ...(input.locale !== undefined ? { locale: input.locale } : {}),
          ...(input.theme !== undefined ? { theme: input.theme } : {}),
        },
        this.clock.now(),
      );
    });
  }
  private async own(
    tx: TxContext,
    binding: SessionBinding,
  ): Promise<UserIdentity> {
    const principal = await this.sessions.requirePrincipal(tx, binding);
    const user = await this.users.lock(tx, principal.userId);
    if (!user) throw new DomainError('USER_NOT_FOUND');
    if (user.accountStatus !== 'active' || user.deletedAt)
      throw new DomainError('ACCOUNT_UNAVAILABLE');
    return user;
  }
  private present(user: UserIdentity): Profile {
    if (!user.phoneCiphertext) throw new DomainError('ACCOUNT_UNAVAILABLE');
    return {
      userId: user.id,
      phone: this.crypto.decrypt(user.phoneCiphertext, `user:${user.id}:phone`),
      displayName: user.displayName,
      email: user.emailCiphertext
        ? this.crypto.decrypt(user.emailCiphertext, `user:${user.id}:email`)
        : null,
      version: user.version,
    };
  }
}
