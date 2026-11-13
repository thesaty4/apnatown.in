import { ApprovedSellerAccess } from '../businesses/application/approved-seller-access';
import { Module, type DynamicModule } from '@nestjs/common';
import {
  DELIVERY_JOB_READ,
  RIDER_APPLICATIONS_READ,
  RIDER_REQUIREMENTS,
} from './application/delivery-ports';
import { CustomerCodeService } from './application/customer-code.service';
import { HandoverSupport } from './application/handover-support';
import { HandoverVerifier } from './application/handover-verifier';
import { HandoverService } from './application/handover.service';
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
import { HandoverController } from './presentation/handover.controller';
import { RiderAdminController } from './presentation/rider-admin.controller';
import { RiderMeController } from './presentation/rider-me.controller';
import { RiderWorkController } from './presentation/rider-work.controller';

/**
 * Delivery rider side (specs/delivery/be/delivery.md): application/approval,
 * availability, latest location, summary/history/earnings reads and jobless
 * support disputes, plus customer handover codes and jobless self-delivery /
 * pickup handover (Orders fulfilment port + Payments cash collection).
 * Platform rider jobs, offers, tracking and admin live views are not wired;
 * DELIVERY_JOB_READ is the empty adapter until then. Imports must provide
 * runtime, Geo, Users, Audit, Admin (ADMIN_SCOPE, AdminScopedActor),
 * Settings (SUPPORT_INTAKE), BusinessContext (ApprovedSellerAccess), Orders
 * (ORDERS_FULFILMENT), Payments (PAYMENT_ORDER) and DeliveryCodesModule.
 */
@Module({})
export class DeliveryModule {
  static forRoot(imports: readonly DynamicModule[]): DynamicModule {
    return {
      module: DeliveryModule,
      imports: [...imports],
      controllers: [
        RiderMeController,
        RiderWorkController,
        RiderAdminController,
        HandoverController,
      ],
      providers: [
        // API-only: needs SESSION_ACCESS, which the worker does not provide.
        ApprovedSellerAccess,
        { provide: RIDER_REPOSITORY, useClass: PrismaRiderRepository },
        { provide: DELIVERY_JOB_READ, useClass: NoDeliveryJobs },
        {
          provide: RIDER_REQUIREMENTS,
          useClass: UnconfiguredRiderRequirements,
        },
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
        {
          provide: RIDER_APPLICATIONS_READ,
          useExisting: RiderAdminReadService,
        },
        HandoverSupport,
        HandoverVerifier,
        HandoverService,
        CustomerCodeService,
      ],
      exports: [RIDER_APPLICATIONS_READ],
    };
  }
}
