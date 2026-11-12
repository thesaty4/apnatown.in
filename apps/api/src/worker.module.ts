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
  PG_BOSS_FACTORY,
  OutboxQueue,
  type PgBossFactory,
} from './shared/jobs/outbox-queue';
import { OutboxRelay } from './shared/jobs/outbox-relay';
import { OutboxConsumer } from './shared/jobs/outbox-consumer';
import { DataRequestProcessor } from './modules/users/application/data-request-processor';
import { UsersDataWorkerModule } from './modules/users/users-data-worker.module';

@Module({})
export class WorkerModule {
  static forRoot(config: RuntimeConfig): DynamicModule {
    const runtime = RuntimeModule.forRoot(config);
    return {
      module: WorkerModule,
      imports: [runtime, UsersDataWorkerModule.forRoot(runtime, config)],
      providers: [
        {
          provide: PG_BOSS_FACTORY,
          useFactory: async (
            dispatcher: OutboxDispatcher,
          ): Promise<PgBossFactory> => {
            const { PgBoss } = await import('pg-boss');
            return async () =>
              new PgBoss({
                connectionString: config.DATABASE_URL,
                connectionTimeoutMillis: 2000,
                max: 10,
                application_name: 'apnatown-outbox',
                schema: 'pgboss',
                migrate: false,
                createSchema: false,
                schedule: false,
                supervise: dispatcher.handlerCount > 0,
                reindex: false,
                persistQueueStats: false,
                persistWarnings: false,
              });
          },
          inject: [OutboxDispatcher],
        },
        OutboxQueue,
        OutboxRelay,
        OutboxConsumer,
        RuntimeCleanup,
        { provide: EVENT_CONSUMER, useClass: TransactionalEventConsumer },
        {
          provide: OUTBOX_HANDLERS,
          useFactory: (dataRequests: DataRequestProcessor) =>
            Object.freeze<OutboxHandler[]>([dataRequests]),
          inject: [DataRequestProcessor],
        },
        OutboxDispatcher,
      ],
      exports: [
        OutboxQueue,
        OutboxRelay,
        OutboxConsumer,
        RuntimeCleanup,
        EVENT_CONSUMER,
        OutboxDispatcher,
      ],
    };
  }
}
