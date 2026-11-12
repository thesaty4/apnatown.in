import { Module, type DynamicModule } from '@nestjs/common';
import { SERVICE_READ, ServiceReadService } from './application/service-read.service';
import { PrismaServiceReadRepository } from './infrastructure/service-read.repository';
import { ServicePublicController } from './presentation/service-public.controller';
@Module({})
export class ServicesModule {
  static forRoot(runtime: DynamicModule): DynamicModule {
    return { module: ServicesModule, imports: [runtime], controllers: [ServicePublicController],
      providers: [ServiceReadService,{ provide: SERVICE_READ, useClass: PrismaServiceReadRepository }] };
  }
}
