import { Module, type DynamicModule } from '@nestjs/common';
import { GeoAdminService } from './application/geo-admin.service';
import { GEO_DELIVERY } from './application/geo-delivery.port';
import { GeoDeliveryService } from './application/geo-delivery.service';
import { GeoEvents } from './application/geo-events';
import { GEO_ADMIN_REPOSITORY } from './domain/geo-admin.repository';
import { GEO_LOCATION_REPOSITORY } from './domain/geo-location.repository';
import { PrismaGeoAdminRepository } from './infrastructure/prisma-geo-admin.repository';
import { PrismaGeoLocationRepository } from './infrastructure/prisma-geo-location.repository';
import { SuperAdminGeoController } from './presentation/super-admin-geo.controller';

/**
 * Super-admin cities/zones/fee slabs and the delivery-fee port. Separate
 * from GeoModule because it needs AdminCommands, AUDIT_WRITER and
 * SETTINGS_READ, whose modules themselves depend on GeoModule.
 */
@Module({})
export class GeoAdminModule {
  static forRoot(
    runtime: DynamicModule,
    audit: DynamicModule,
    admin: DynamicModule,
    settings: DynamicModule,
  ): DynamicModule {
    return {
      module: GeoAdminModule,
      imports: [runtime, audit, admin, settings],
      controllers: [SuperAdminGeoController],
      providers: [
        GeoAdminService,
        GeoEvents,
        GeoDeliveryService,
        { provide: GEO_ADMIN_REPOSITORY, useClass: PrismaGeoAdminRepository },
        {
          provide: GEO_LOCATION_REPOSITORY,
          useClass: PrismaGeoLocationRepository,
        },
        { provide: GEO_DELIVERY, useExisting: GeoDeliveryService },
      ],
      exports: [GEO_DELIVERY],
    };
  }
}
