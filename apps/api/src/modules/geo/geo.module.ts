import { Module, type DynamicModule } from '@nestjs/common';
import { GEO_READ_REPOSITORY } from './domain/geo-read.repository';
import { GeoReadService } from './application/geo-read.service';
import { PrismaGeoReadRepository } from './infrastructure/prisma-geo-read.repository';
import { GeoController } from './presentation/geo.controller';

@Module({})
export class GeoModule {
  static forRoot(runtime: DynamicModule): DynamicModule {
    return {
      module: GeoModule,
      imports: [runtime],
      controllers: [GeoController],
      providers: [
        GeoReadService,
        { provide: GEO_READ_REPOSITORY, useClass: PrismaGeoReadRepository },
      ],
    };
  }
}
