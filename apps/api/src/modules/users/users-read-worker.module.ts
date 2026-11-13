import { Inject, Injectable, Module, type DynamicModule } from '@nestjs/common';
import { registeredConsentPair } from '@apnatown/shared/users';
import { IDENTITY_CRYPTO, type IdentityCrypto } from '../../shared/auth/crypto';
import type { TxContext } from '../../shared/persistence/ports';
import { CONSENT_REPOSITORY, type ConsentRepository } from './domain/consent';
import { USERS_REPOSITORY } from './domain/identity';
import { USER_ROLES_REPOSITORY } from './domain/user-roles';
import {
  CONSENT_READ,
  type ConsentChoiceKey,
  type ConsentReadPort,
} from './application/consent-port';
import { USER_IDENTITY } from './application/identity-port';
import { IdentityService } from './application/identity.service';
import { USER_ROLES } from './application/user-role-port';
import { UserRolesService } from './application/user-roles.service';
import { PrismaConsentRepository } from './infrastructure/consent.repository';
import { PrismaUsersRepository } from './infrastructure/users.repository';

/**
 * Notification consumers only read principals, locales, roles and admin
 * holders, none of which touch phone ciphertext. IdentityService and
 * UserRolesService still inject IDENTITY_CRYPTO, so this fail-closed stub
 * satisfies DI without loading PII_ENCRYPTION_KEY / PHONE_LOOKUP_HASH_KEY:
 * any phone path reached from this composition throws instead of decrypting.
 */
const NO_PII_CRYPTO: IdentityCrypto = Object.freeze({
  phoneHash: () => {
    throw new Error('IDENTITY_CRYPTO_UNAVAILABLE');
  },
  encrypt: () => {
    throw new Error('IDENTITY_CRYPTO_UNAVAILABLE');
  },
  decrypt: () => {
    throw new Error('IDENTITY_CRYPTO_UNAVAILABLE');
  },
});

/**
 * Worker-safe ConsentReadPort (latest evidence only; same semantics as
 * ConsentService.current). Absence of evidence or an unregistered pair is
 * never consent. Writes stay on the HTTP ConsentService.
 */
@Injectable()
class WorkerConsentRead implements ConsentReadPort {
  constructor(
    @Inject(CONSENT_REPOSITORY) private readonly consents: ConsentRepository,
  ) {}

  async current(
    input: ConsentChoiceKey,
    tx?: TxContext,
  ): Promise<{ granted: boolean; consentId?: string; recordedAt?: string }> {
    const pair = registeredConsentPair(input.purpose, input.channel);
    if (!pair || !tx) return { granted: false };
    const row = await this.consents.latest(
      tx,
      input.userId,
      pair.purpose,
      pair.channel,
    );
    return row
      ? { granted: row.granted, consentId: row.id, recordedAt: row.recordedAt }
      : { granted: false };
  }
}
import { PrismaUserRolesRepository } from './infrastructure/user-roles.repository';

/**
 * Worker-side read composition of the Users public ports (identity, live
 * roles, current consent) for event consumers such as Notifications. No controllers.
 */
@Module({})
export class UsersReadWorkerModule {
  static forRoot(runtime: DynamicModule): DynamicModule {
    return {
      module: UsersReadWorkerModule,
      imports: [runtime],
      providers: [
        { provide: IDENTITY_CRYPTO, useValue: NO_PII_CRYPTO },
        { provide: USERS_REPOSITORY, useClass: PrismaUsersRepository },
        { provide: USER_ROLES_REPOSITORY, useClass: PrismaUserRolesRepository },
        IdentityService,
        { provide: USER_IDENTITY, useExisting: IdentityService },
        UserRolesService,
        { provide: USER_ROLES, useExisting: UserRolesService },
        { provide: CONSENT_REPOSITORY, useClass: PrismaConsentRepository },
        { provide: CONSENT_READ, useClass: WorkerConsentRead },
      ],
      exports: [USER_IDENTITY, USER_ROLES, CONSENT_READ],
    };
  }
}
