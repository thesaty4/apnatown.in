import { Module, type DynamicModule } from '@nestjs/common';
import { RUNTIME_CONFIG, type RuntimeConfig } from '../config/config';
import { PostgresReadinessRepository } from '../persistence/readiness-repository';
import { READINESS_REPOSITORY, ReadinessService } from './readiness';
import { RuntimePrimitivesModule } from '../runtime/providers';

@Module({})
export class RuntimeModule {
  static forRoot(config: RuntimeConfig): DynamicModule {
    return {
      module: RuntimeModule,
      imports: [RuntimePrimitivesModule],
      providers: [
        { provide: RUNTIME_CONFIG, useValue: config },
        {
          provide: READINESS_REPOSITORY,
          useFactory: () => new PostgresReadinessRepository(config),
        },
        ReadinessService,
      ],
      exports: [
        RUNTIME_CONFIG,
        READINESS_REPOSITORY,
        ReadinessService,
        RuntimePrimitivesModule,
      ],
    };
  }
}
