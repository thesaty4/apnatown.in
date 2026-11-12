import { Module, type DynamicModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import type { RuntimeConfig } from './shared/config/config';
import { ErrorFilter } from './shared/errors/exception-filter';
import { HealthController } from './shared/health/health.controller';
import { AuthGuard } from './shared/auth/auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { GeoModule } from './modules/geo/geo.module';
import { UsersModule } from './modules/users/users.module';
import { RuntimeModule } from './shared/health/runtime.module';
import { RateLimitGuard } from './shared/rate-limit/rate-limit';

@Module({})
export class AppModule {
  static forRoot(config: RuntimeConfig): DynamicModule {
    const runtime = RuntimeModule.forRoot(config);
    const geo = GeoModule.forRoot(runtime);
    const users = UsersModule.forRoot(runtime, geo);
    return {
      module: AppModule,
      imports: [runtime, AuthModule.forRoot(runtime, config, users), geo],
      controllers: [HealthController],
      providers: [
        { provide: APP_PIPE, useClass: ZodValidationPipe },
        { provide: APP_FILTER, useClass: ErrorFilter },
        { provide: APP_GUARD, useClass: AuthGuard },
        { provide: APP_GUARD, useClass: RateLimitGuard },
      ],
    };
  }
}
