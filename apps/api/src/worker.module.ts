import { Module, type DynamicModule } from '@nestjs/common';
import type { RuntimeConfig } from './shared/config/config';
import { RuntimeModule } from './shared/health/runtime.module';
import { RuntimeCleanup } from './shared/jobs/runtime-cleanup';
import {
  EVENT_CONSUMER,
  TransactionalEventConsumer,
} from './shared/jobs/event-consumer';
import {
  OUTBOX_HANDLERS,
  OutboxDispatcher,
  type OutboxHandler,
} from './shared/jobs/outbox-dispatcher';
import {
  OutboxRelay,
  PG_BOSS_FACTORY,
  type PgBossFactory,
} from './shared/jobs/outbox-relay';

@Module({})
export class WorkerModule {
  static forRoot(config: RuntimeConfig): DynamicModule {
    return {
      module: WorkerModule,
      imports: [RuntimeModule.forRoot(config)],
      providers: [
        {
          provide: PG_BOSS_FACTORY,
          useFactory: async (): Promise<PgBossFactory> => {
            const { PgBoss } = await import('pg-boss');
            return async () =>
              new PgBoss({
                connectionString: config.DATABASE_URL,
                connectionTimeoutMillis: 2000,
                max: 10,
                application_name: 'apnatown-outbox-relay',
                schema: 'pgboss',
                migrate: false,
                createSchema: false,
                schedule: false,
                supervise: false,
              });
          },
        },
        OutboxRelay,
        RuntimeCleanup,
        { provide: EVENT_CONSUMER, useClass: TransactionalEventConsumer },
        {
          provide: OUTBOX_HANDLERS,
          useValue: Object.freeze<OutboxHandler[]>([]),
        },
        OutboxDispatcher,
      ],
      exports: [OutboxRelay, RuntimeCleanup, EVENT_CONSUMER, OutboxDispatcher],
    };
  }
}
