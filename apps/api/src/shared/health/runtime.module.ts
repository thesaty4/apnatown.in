import { Module, type DynamicModule } from '@nestjs/common';
import { RUNTIME_CONFIG, type RuntimeConfig } from '../config/config';
import { PostgresReadinessRepository } from '../persistence/readiness-repository';
import { READINESS_REPOSITORY, ReadinessService } from './readiness';
import { RuntimePrimitivesModule } from '../runtime/providers';
import { CURSOR_CODEC, CursorCodec } from '../pagination/cursor';

@Module({})
export class RuntimeModule {
  static forRoot(config: RuntimeConfig): DynamicModule {
    return {
      module: RuntimeModule,
      imports: [RuntimePrimitivesModule],
      providers: [
        { provide: RUNTIME_CONFIG, useValue: config },
        {
          provide: CURSOR_CODEC,
          useFactory: () => new CursorCodec(config.CURSOR_SIGNING_KEY),
        },
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
        CURSOR_CODEC,
      ],
    };
  }
}
