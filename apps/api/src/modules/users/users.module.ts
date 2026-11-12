import { Module, type DynamicModule } from '@nestjs/common';
import { USERS_REPOSITORY } from './domain/identity';
import { USER_IDENTITY } from './application/identity-port';
import { IdentityService } from './application/identity.service';
import { ProfileService } from './application/profile.service';
import { PrismaUsersRepository } from './infrastructure/users.repository';
import { UsersController } from './presentation/users.controller';
import { ADDRESS_REPOSITORY } from './domain/address';
import { USERS_ADDRESS } from './application/address-port';
import { AddressService } from './application/address.service';
import { AddressAccess } from './application/address-access';
import { AddressCommands } from './application/address-command';
import { AddressProjection } from './application/address-projection';
import { PrismaAddressRepository } from './infrastructure/address.repository';
import { AddressesController } from './presentation/addresses.controller';
import { CONSENT_REPOSITORY } from './domain/consent';
import { CONSENT_READ, CONSENT_WRITE } from './application/consent-port';
import { ConsentService } from './application/consent.service';
import { PrismaConsentRepository } from './infrastructure/consent.repository';
import { ConsentsController } from './presentation/consents.controller';
import { AnonymousConsentsController } from './presentation/anonymous-consents.controller';

@Module({})
export class UsersModule {
  static forRoot(runtime: DynamicModule, geo: DynamicModule): DynamicModule {
    return {
      module: UsersModule,
      imports: [runtime, geo],
      controllers: [
        UsersController,
        AddressesController,
        ConsentsController,
        AnonymousConsentsController,
      ],
      providers: [
        { provide: USERS_REPOSITORY, useClass: PrismaUsersRepository },
        IdentityService,
        ProfileService,
        { provide: USER_IDENTITY, useExisting: IdentityService },
        { provide: ADDRESS_REPOSITORY, useClass: PrismaAddressRepository },
        AddressAccess,
        AddressCommands,
        AddressProjection,
        AddressService,
        { provide: USERS_ADDRESS, useExisting: AddressService },
        { provide: CONSENT_REPOSITORY, useClass: PrismaConsentRepository },
        ConsentService,
        { provide: CONSENT_READ, useExisting: ConsentService },
        { provide: CONSENT_WRITE, useExisting: ConsentService },
      ],
      exports: [USER_IDENTITY, USERS_ADDRESS, CONSENT_READ, CONSENT_WRITE],
    };
  }
}
