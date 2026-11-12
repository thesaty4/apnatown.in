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

@Module({})
export class UsersModule {
  static forRoot(runtime: DynamicModule, geo: DynamicModule): DynamicModule {
    return {
      module: UsersModule,
      imports: [runtime, geo],
      controllers: [UsersController, AddressesController],
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
      ],
      exports: [USER_IDENTITY, USERS_ADDRESS],
    };
  }
}
