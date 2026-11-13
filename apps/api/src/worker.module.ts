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
import { MediaStorageModule } from './modules/media-videos/media.module';
import {
  NOTIFICATION_OUTBOX_HANDLERS,
  NotificationsWorkerModule,
} from './modules/notifications/notifications-worker.module';
import { CartWorkerModule } from './modules/cart-checkout/cart-worker.module';

@Module({})
export class WorkerModule {
  static forRoot(config: RuntimeConfig): DynamicModule {
    const runtime = RuntimeModule.forRoot(config);
    const mediaStorage = MediaStorageModule.forRoot(runtime, true);
    return {
      module: WorkerModule,
      imports: [runtime, UsersDataWorkerModule.forRoot(runtime, config), mediaStorage, NotificationsWorkerModule.forRoot(runtime, mediaStorage), CartWorkerModule.forRoot(runtime)],
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
          useFactory: (
            dataRequests: DataRequestProcessor,
            notifications: readonly OutboxHandler[],
          ) => Object.freeze<OutboxHandler[]>([dataRequests, ...notifications]),
          inject: [DataRequestProcessor, NOTIFICATION_OUTBOX_HANDLERS],
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
