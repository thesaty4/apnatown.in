import { Module, type DynamicModule } from '@nestjs/common';
import { RUNTIME_CONFIG, type RuntimeConfig } from '../config/config';
import { PostgresReadinessRepository } from '../persistence/readiness-repository';
import { READINESS_REPOSITORY, ReadinessService } from './readiness';
import { RuntimePrimitivesModule } from '../runtime/providers';
import { CURSOR_CODEC, CursorCodec } from '../pagination/cursor';
import { createLogger, RUNTIME_LOGGER } from '../logger/logger';
import { EVENT_FACTORY, SystemEventFactory } from '../events/event-factory';
import { OUTBOX_WRITER } from '../events/ports';
import { PrismaDatabase } from '../persistence/prisma-database';
import { PrismaUnitOfWork } from '../persistence/unit-of-work';
import { COMMAND_UNIT_OF_WORK, UNIT_OF_WORK } from '../persistence/ports';
import { PrismaCommandUnitOfWork } from '../persistence/command-unit-of-work';
import {
  COMMAND_CONTEXT_FACTORY,
  HttpCommandContextFactory,
} from '../idempotency/context';
import { PrismaOutboxWriter } from '../persistence/outbox-writer';
import { OutboxRelayStore } from '../persistence/outbox-relay-store';
import { RuntimeCleanupStore } from '../persistence/runtime-cleanup-store';
import {
  RATE_LIMIT_REPOSITORY,
  PostgresRateLimitRepository,
} from '../rate-limit/repository';

@Module({})
export class RuntimeModule {
  static forRoot(config: RuntimeConfig): DynamicModule {
    return {
      module: RuntimeModule,
      imports: [RuntimePrimitivesModule],
      providers: [
        { provide: RUNTIME_CONFIG, useValue: config },
        {
          provide: RUNTIME_LOGGER,
          useFactory: () => createLogger(config.LOG_LEVEL),
        },
        {
          provide: CURSOR_CODEC,
          useFactory: () => new CursorCodec(config.CURSOR_SIGNING_KEY),
        },
        {
          provide: COMMAND_CONTEXT_FACTORY,
          useFactory: () =>
            new HttpCommandContextFactory(config.IDEMPOTENCY_HASH_KEY),
        },
        { provide: EVENT_FACTORY, useClass: SystemEventFactory },
        {
          provide: PrismaDatabase,
          useFactory: () =>
            new PrismaDatabase({ connectionString: config.DATABASE_URL }),
        },
        {
          provide: UNIT_OF_WORK,
          useFactory: (database: PrismaDatabase) =>
            new PrismaUnitOfWork(database),
          inject: [PrismaDatabase],
        },
        PrismaCommandUnitOfWork,
        {
          provide: COMMAND_UNIT_OF_WORK,
          useExisting: PrismaCommandUnitOfWork,
        },
        {
          provide: OUTBOX_WRITER,
          useFactory: (database: PrismaDatabase) =>
            new PrismaOutboxWriter(database),
          inject: [PrismaDatabase],
        },
        OutboxRelayStore,
        RuntimeCleanupStore,
        {
          provide: RATE_LIMIT_REPOSITORY,
          useClass: PostgresRateLimitRepository,
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
        RUNTIME_LOGGER,
        EVENT_FACTORY,
        COMMAND_CONTEXT_FACTORY,
        COMMAND_UNIT_OF_WORK,
        UNIT_OF_WORK,
        OUTBOX_WRITER,
        OutboxRelayStore,
        RuntimeCleanupStore,
        PrismaDatabase,
        RATE_LIMIT_REPOSITORY,
      ],
    };
  }
}
