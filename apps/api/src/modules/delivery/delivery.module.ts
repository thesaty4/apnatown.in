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
import { UnconfiguredRiderRequirements } from './infrastructure/unshipped-delivery-sources';
import { PrismaDeliveryJobReadRepository } from './infrastructure/prisma-delivery-job-read.repository';
import { OwnerDispatchService } from './application/owner-dispatch.service';
import { RiderJobCommands } from './application/rider-job-commands';
import { RiderJobCompleteService } from './application/rider-job-complete.service';
import { RiderJobProgressService } from './application/rider-job-progress.service';
import { RiderJobView } from './application/rider-job-view';
import { RiderOfferService } from './application/rider-offer.service';
import { DispatchController } from './presentation/dispatch.controller';
import { RiderJobController } from './presentation/rider-job.controller';
import { HandoverController } from './presentation/handover.controller';
import { RiderAdminController } from './presentation/rider-admin.controller';
import { RiderMeController } from './presentation/rider-me.controller';
import { RiderWorkController } from './presentation/rider-work.controller';

/**
 * Delivery API (specs/delivery/be/delivery.md): rider application/approval,
 * availability/location, platform rider dispatch (owner request/candidates/
 * directed offer, rider accept/reject, job events, OTP completion with the
 * earned snapshot), summary/history/earnings over persisted jobs, jobless
 * support disputes, customer handover codes and jobless self-delivery /
 * pickup handover. Customer live tracking, masked calls and admin live
 * views are not wired. Imports must provide runtime, Geo, Users, Audit,
 * Admin (ADMIN_SCOPE, AdminScopedActor), Settings (SUPPORT_INTAKE),
 * BusinessContext (ApprovedSellerAccess), Orders (ORDERS_FULFILMENT),
 * Payments (PAYMENT_ORDER), DeliveryCodesModule, DeliveryAssignmentModule
 * and DeliveryDispatchModule.
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
        DispatchController,
        RiderJobController,
      ],
      providers: [
        // API-only: needs SESSION_ACCESS, which the worker does not provide.
        ApprovedSellerAccess,
        { provide: RIDER_REPOSITORY, useClass: PrismaRiderRepository },
        { provide: DELIVERY_JOB_READ, useClass: PrismaDeliveryJobReadRepository },
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
        RiderJobView,
        RiderJobCommands,
        OwnerDispatchService,
        RiderOfferService,
        RiderJobProgressService,
        RiderJobCompleteService,
      ],
      exports: [RIDER_APPLICATIONS_READ],
    };
  }
}
