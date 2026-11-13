import { Module, type DynamicModule } from '@nestjs/common';
import { RealtimeController } from './realtime.controller';
import { RealtimeHub } from './realtime-hub';
import { RealtimeStreamService } from './realtime-stream.service';

/**
 * API-only real-time push: LISTEN hub + SSE endpoint. Never import this in
 * the worker (producers there only need REALTIME_SIGNAL from RuntimeModule).
 * SESSION_ACCESS comes from the global Auth module.
 */
@Module({})
export class RealtimeModule {
  static forRoot(runtime: DynamicModule): DynamicModule {
    return {
      module: RealtimeModule,
      imports: [runtime],
      controllers: [RealtimeController],
      providers: [RealtimeHub, RealtimeStreamService],
      exports: [RealtimeHub],
    };
  }
}
