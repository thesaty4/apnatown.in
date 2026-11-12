import { Module, type DynamicModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import type { RuntimeConfig } from './shared/config/config';
import { ErrorFilter } from './shared/errors/exception-filter';
import { HealthController } from './shared/health/health.controller';
import { AuthGuard } from './shared/auth/auth.guard';
import { AdminAccessGuard } from './shared/auth/admin-access.guard';
import { AdminModule } from './modules/admin/admin.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { GeoModule } from './modules/geo/geo.module';
import { MaintenanceGuard } from './modules/settings/application/maintenance.guard';
import { SettingsModule } from './modules/settings/settings.module';
import { UsersModule } from './modules/users/users.module';
import { RuntimeModule } from './shared/health/runtime.module';
import { RateLimitGuard } from './shared/rate-limit/rate-limit';

@Module({})
export class AppModule {
  static forRoot(config: RuntimeConfig): DynamicModule {
    const runtime = RuntimeModule.forRoot(config);
    const geo = GeoModule.forRoot(runtime);
    const users = UsersModule.forRoot(runtime, geo);
    const audit = AuditModule.forApi(runtime, users);
    const admin = AdminModule.forRoot(runtime, geo, users, audit);
    const settings = SettingsModule.forRoot(runtime, users, audit, admin);
    return {
      module: AppModule,
      imports: [
        runtime,
        AuthModule.forRoot(runtime, config, users),
        geo,
        audit,
        admin,
        settings,
      ],
      controllers: [HealthController],
      providers: [
        { provide: APP_PIPE, useClass: ZodValidationPipe },
        { provide: APP_FILTER, useClass: ErrorFilter },
        // Maintenance admission runs first so blocked routes do no other work.
        { provide: APP_GUARD, useExisting: MaintenanceGuard },
        { provide: APP_GUARD, useClass: AuthGuard },
        { provide: APP_GUARD, useClass: RateLimitGuard },
        // Role/permission/scope checks run after authentication and rate limits.
        { provide: APP_GUARD, useClass: AdminAccessGuard },
      ],
    };
  }
}
