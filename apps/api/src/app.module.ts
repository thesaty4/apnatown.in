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
import { CatalogModule } from './modules/catalog/catalog.module';
import { BusinessContextModule } from './modules/businesses/business-context.module';
import {
  MediaModule,
  MediaStorageModule,
} from './modules/media-videos/media.module';
import { GeoAdminModule } from './modules/geo/geo-admin.module';
import { GeoModule } from './modules/geo/geo.module';
import { MaintenanceGuard } from './modules/settings/application/maintenance.guard';
import { SettingsModule } from './modules/settings/settings.module';
import { UsersModule } from './modules/users/users.module';
import { EngagementModule } from './modules/engagement/engagement.module';
import { SearchModule } from './modules/search/search.module';
import { ProductsModule } from './modules/products/products.module';
import { ServicesModule } from './modules/services/services.module';
import { BusinessPublicModule } from './modules/businesses/business-public.module';
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
    const geoAdmin = GeoAdminModule.forRoot(runtime, audit, admin, settings);
    const mediaStorage = MediaStorageModule.forRoot(runtime);
    const businessContext = BusinessContextModule.forRoot(runtime, users);
    const catalog = CatalogModule.forRoot(
      runtime,
      users,
      audit,
      admin,
      businessContext,
      mediaStorage,
    );
    const media = MediaModule.forRoot([
      runtime,
      users,
      audit,
      admin,
      settings,
      mediaStorage,
      catalog,
      businessContext,
    ]);
    const engagement = EngagementModule.forRoot(
      runtime,
      admin,
      audit,
      settings,
      media,
      businessContext,
    );
    return {
      module: AppModule,
      imports: [
        runtime,
        AuthModule.forRoot(runtime, config, users),
        geo,
        audit,
        admin,
        settings,
        geoAdmin,
        catalog,
        media,
        engagement,
        SearchModule.forRoot(runtime, catalog, businessContext),
        ProductsModule.forRoot(runtime),
        ServicesModule.forRoot(runtime),
        BusinessPublicModule.forRoot(runtime),
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
