import { Module, type DynamicModule } from '@nestjs/common';
import { ADMIN_REPOSITORY } from './domain/admin';
import { ADMIN_RECIPIENTS } from './application/admin-recipients.port';
import { AdminScopeService } from './application/admin-scope.service';
import { PrismaAdminRepository } from './infrastructure/prisma-admin.repository';

/**
 * Worker-side composition of the Admin recipient-resolution port (live
 * active admins by module/scope) for event consumers. No controllers.
 */
@Module({})
export class AdminRecipientsWorkerModule {
  static forRoot(runtime: DynamicModule, users: DynamicModule): DynamicModule {
    return {
      module: AdminRecipientsWorkerModule,
      imports: [runtime, users],
      providers: [
        { provide: ADMIN_REPOSITORY, useClass: PrismaAdminRepository },
        AdminScopeService,
        { provide: ADMIN_RECIPIENTS, useExisting: AdminScopeService },
      ],
      exports: [ADMIN_RECIPIENTS],
    };
  }
}
