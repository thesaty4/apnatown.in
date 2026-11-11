import { Module, type DynamicModule } from '@nestjs/common';
import { USERS_REPOSITORY } from './domain/identity';
import { USER_IDENTITY } from './application/identity-port';
import { IdentityService } from './application/identity.service';
import { ProfileService } from './application/profile.service';
import { PrismaUsersRepository } from './infrastructure/users.repository';
import { UsersController } from './presentation/users.controller';

@Module({})
export class UsersModule {
  static forRoot(runtime: DynamicModule): DynamicModule {
    return {
      module: UsersModule,
      imports: [runtime],
      controllers: [UsersController],
      providers: [
        { provide: USERS_REPOSITORY, useClass: PrismaUsersRepository },
        IdentityService,
        ProfileService,
        { provide: USER_IDENTITY, useExisting: IdentityService },
      ],
      exports: [USER_IDENTITY],
    };
  }
}
