import { Module, type DynamicModule } from '@nestjs/common';
import { ADMIN_SCOPE } from '../../shared/auth/ports';
import { ADMIN_REPOSITORY, ROLE_REPOSITORY } from './domain/admin';
import { AdminAccountsService } from './application/admin-accounts.service';
import { AdminCommands } from './application/admin-command';
import { AdminEvents } from './application/admin-events';
import { AdminProjection } from './application/admin-projection';
import { ADMIN_RECIPIENTS } from './application/admin-recipients.port';
import { AdminScopeService } from './application/admin-scope.service';
import { AdminScopedActor } from './application/admin-scoped-actor';
import { RolesService } from './application/roles.service';
import { PrismaAdminRepository } from './infrastructure/prisma-admin.repository';
import { PrismaRoleRepository } from './infrastructure/prisma-role.repository';
import { AdminMeController } from './presentation/admin-me.controller';
import { SuperAdminAdminsController } from './presentation/super-admin-admins.controller';
import { SuperAdminRolesController } from './presentation/super-admin-roles.controller';

/**
 * Admin RBAC foundation (BR-13): admin accounts, roles, the shared
 * authorization predicate (ADMIN_SCOPE) and recipient resolution.
 */
@Module({})
export class AdminModule {
  static forRoot(
    runtime: DynamicModule,
    geo: DynamicModule,
    users: DynamicModule,
    audit: DynamicModule,
  ): DynamicModule {
    return {
      module: AdminModule,
      imports: [runtime, geo, users, audit],
      controllers: [
        AdminMeController,
        SuperAdminAdminsController,
        SuperAdminRolesController,
      ],
      providers: [
        { provide: ADMIN_REPOSITORY, useClass: PrismaAdminRepository },
        { provide: ROLE_REPOSITORY, useClass: PrismaRoleRepository },
        AdminScopeService,
        { provide: ADMIN_SCOPE, useExisting: AdminScopeService },
        { provide: ADMIN_RECIPIENTS, useExisting: AdminScopeService },
        AdminCommands,
        AdminScopedActor,
        AdminEvents,
        AdminProjection,
        AdminAccountsService,
        RolesService,
      ],
      // AdminCommands is the shared super-admin command boundary (Settings);
      // AdminScopedActor the scoped-admin command actor (Listings, Products).
      exports: [ADMIN_SCOPE, ADMIN_RECIPIENTS, AdminCommands, AdminScopedActor],
    };
  }
}
