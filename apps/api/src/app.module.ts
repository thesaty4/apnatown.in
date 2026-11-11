import { Module, type DynamicModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import type { RuntimeConfig } from './shared/config/config';
import { ErrorFilter } from './shared/errors/exception-filter';
import { HealthController } from './shared/health/health.controller';
import { ProbeOnlyGuard } from './shared/health/probe-only.guard';
import { RuntimeModule } from './shared/health/runtime.module';

@Module({})
export class AppModule {
  static forRoot(config: RuntimeConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [RuntimeModule.forRoot(config)],
      controllers: [HealthController],
      providers: [
        { provide: APP_PIPE, useClass: ZodValidationPipe },
        { provide: APP_FILTER, useClass: ErrorFilter },
        { provide: APP_GUARD, useClass: ProbeOnlyGuard },
      ],
    };
  }
}
