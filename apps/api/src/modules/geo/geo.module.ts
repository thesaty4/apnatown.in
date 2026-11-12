import { Module, type DynamicModule } from '@nestjs/common';
import { GEO_READ_REPOSITORY } from './domain/geo-read.repository';
import { GeoReadService } from './application/geo-read.service';
import { PrismaGeoReadRepository } from './infrastructure/prisma-geo-read.repository';
import { GeoController } from './presentation/geo.controller';
import { GEO_SCOPE } from './application/geo-scope.port';
import { GeoScopeService } from './application/geo-scope.service';
import { GEO_TAX } from './application/geo-tax.port';
import { GEO_ADMIN_READ } from './application/geo-admin-read.port';
import { GeoAdminReadService } from './application/geo-admin-read.service';
import { GeoLocationService } from './application/geo-location.service';
import { GEO_SCOPE_REPOSITORY } from './domain/geo-scope.repository';
import { GEO_LOCATION_REPOSITORY } from './domain/geo-location.repository';
import { GEO_ADMIN_REPOSITORY } from './domain/geo-admin.repository';
import { PrismaGeoScopeRepository } from './infrastructure/prisma-geo-scope.repository';
import { PrismaGeoLocationRepository } from './infrastructure/prisma-geo-location.repository';
import { PrismaGeoAdminRepository } from './infrastructure/prisma-geo-admin.repository';

/**
 * Core Geo: public reads/resolve/waitlist and the internal scope, tax and
 * admin-read ports. Super-admin writes and the delivery-fee port live in
 * GeoAdminModule (they depend on Admin/Audit/Settings, which import Geo).
 */
@Module({})
export class GeoModule {
  static forRoot(runtime: DynamicModule): DynamicModule {
    return {
      module: GeoModule,
      imports: [runtime],
      controllers: [GeoController],
      providers: [
        GeoReadService,
        GeoLocationService,
        GeoAdminReadService,
        { provide: GEO_READ_REPOSITORY, useClass: PrismaGeoReadRepository },
        GeoScopeService,
        { provide: GEO_SCOPE_REPOSITORY, useClass: PrismaGeoScopeRepository },
        {
          provide: GEO_LOCATION_REPOSITORY,
          useClass: PrismaGeoLocationRepository,
        },
        { provide: GEO_ADMIN_REPOSITORY, useClass: PrismaGeoAdminRepository },
        { provide: GEO_SCOPE, useExisting: GeoScopeService },
        { provide: GEO_TAX, useExisting: GeoScopeService },
        { provide: GEO_ADMIN_READ, useExisting: GeoAdminReadService },
      ],
      exports: [GEO_SCOPE, GEO_TAX, GEO_ADMIN_READ],
    };
  }
}
