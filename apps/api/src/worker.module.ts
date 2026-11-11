import { Module, type DynamicModule } from '@nestjs/common';
import type { RuntimeConfig } from './shared/config/config';
import { RuntimeModule } from './shared/health/runtime.module';

@Module({})
export class WorkerModule {
  static forRoot(config: RuntimeConfig): DynamicModule {
    return { module: WorkerModule, imports: [RuntimeModule.forRoot(config)] };
  }
}
