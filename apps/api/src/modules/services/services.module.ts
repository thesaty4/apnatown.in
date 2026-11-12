import { Module, type DynamicModule } from '@nestjs/common';
import { SERVICE_READ, ServiceReadService } from './application/service-read.service';
import { PrismaServiceReadRepository } from './infrastructure/service-read.repository';
import { ServicePublicController } from './presentation/service-public.controller';
import { SERVICE_SAVED_CARDS, ServiceSavedCardsService } from './application/service-saved-cards';
@Module({})
export class ServicesModule {
  static forRoot(runtime: DynamicModule): DynamicModule {
    return { module: ServicesModule, imports: [runtime], controllers: [ServicePublicController],
      providers: [ServiceReadService,{ provide: SERVICE_READ, useClass: PrismaServiceReadRepository },
        { provide: SERVICE_SAVED_CARDS,useClass: ServiceSavedCardsService }],
      exports: [SERVICE_SAVED_CARDS] };
  }
}
