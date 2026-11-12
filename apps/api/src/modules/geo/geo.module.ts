import { Module, type DynamicModule } from '@nestjs/common';
import { GEO_READ_REPOSITORY } from './domain/geo-read.repository';
import { GeoReadService } from './application/geo-read.service';
import { PrismaGeoReadRepository } from './infrastructure/prisma-geo-read.repository';
import { GeoController } from './presentation/geo.controller';
import { GEO_SCOPE } from './application/geo-scope.port';
import { GeoScopeService } from './application/geo-scope.service';
import { GEO_SCOPE_REPOSITORY } from './domain/geo-scope.repository';
import { PrismaGeoScopeRepository } from './infrastructure/prisma-geo-scope.repository';

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
        GeoScopeService,
        { provide: GEO_SCOPE_REPOSITORY, useClass: PrismaGeoScopeRepository },
        { provide: GEO_SCOPE, useExisting: GeoScopeService },
      ],
      exports: [GEO_SCOPE],
    };
  }
}
