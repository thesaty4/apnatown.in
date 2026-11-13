import { Module, type DynamicModule } from '@nestjs/common';
import {
  DELIVERY_JOB_READ,
  RIDER_APPLICATIONS_READ,
  RIDER_REQUIREMENTS,
} from './application/delivery-ports';
import { RiderAccess } from './application/rider-access';
import { RiderAdminReadService } from './application/rider-admin-read.service';
import { RiderDecisionService } from './application/rider-decision.service';
import { RiderDisputeService } from './application/rider-dispute.service';
import { RiderEvents } from './application/rider-events';
import { RiderJobsService } from './application/rider-jobs.service';
import { RiderPayoutCipher } from './application/rider-payout';
import { RiderProfileService } from './application/rider-profile.service';
import { RiderProfileView } from './application/rider-profile-view';
import { RiderWorkService } from './application/rider-work.service';
import { RIDER_REPOSITORY } from './domain/rider';
import { PrismaRiderRepository } from './infrastructure/prisma-rider.repository';
import {
  NoDeliveryJobs,
  UnconfiguredRiderRequirements,
} from './infrastructure/unshipped-delivery-sources';
import { RiderAdminController } from './presentation/rider-admin.controller';
import { RiderMeController } from './presentation/rider-me.controller';
import { RiderWorkController } from './presentation/rider-work.controller';

/**
 * Delivery rider side (specs/delivery/be/delivery.md): application/approval,
 * availability, latest location, summary/history/earnings reads and jobless
 * support disputes. Jobs, offers, handover codes, tracking and admin live
 * views need Orders/Payments and are not wired; DELIVERY_JOB_READ is the
 * empty adapter until then. Imports must provide runtime, Geo, Users, Audit,
 * Admin (ADMIN_SCOPE, AdminScopedActor) and Settings (SUPPORT_INTAKE).
 */
@Module({})
export class DeliveryModule {
  static forRoot(imports: readonly DynamicModule[]): DynamicModule {
    return {
      module: DeliveryModule,
      imports: [...imports],
      controllers: [RiderMeController, RiderWorkController, RiderAdminController],
      providers: [
        { provide: RIDER_REPOSITORY, useClass: PrismaRiderRepository },
        { provide: DELIVERY_JOB_READ, useClass: NoDeliveryJobs },
        { provide: RIDER_REQUIREMENTS, useClass: UnconfiguredRiderRequirements },
        RiderAccess,
        RiderPayoutCipher,
        RiderEvents,
        RiderProfileView,
        RiderProfileService,
        RiderWorkService,
        RiderJobsService,
        RiderDisputeService,
        RiderAdminReadService,
        RiderDecisionService,
        { provide: RIDER_APPLICATIONS_READ, useExisting: RiderAdminReadService },
      ],
      exports: [RIDER_APPLICATIONS_READ],
    };
  }
}
