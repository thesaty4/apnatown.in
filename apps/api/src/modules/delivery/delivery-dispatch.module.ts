import { Module, type DynamicModule } from '@nestjs/common';
import { BusinessContextModule } from '../businesses/business-context.module';
import { BusinessCartReadModule } from '../businesses/business-cart-read.module';
import { OrdersNotificationReadModule } from '../orders/orders-notification-read.module';
import { UsersReadWorkerModule } from '../users/users-read-worker.module';
import { DELIVERY_DISPATCH } from './application/delivery-dispatch-port';
import { DispatchAssignment } from './application/dispatch-assignment';
import { DispatchEvents } from './application/dispatch-events';
import { DispatchProjection } from './application/dispatch-projection';
import { DispatchService } from './application/dispatch.service';
import { OfferExpiryScheduler } from './application/offer-expiry.scheduler';
import { DELIVERY_JOB_REPOSITORY, DELIVERY_OFFER_REPOSITORY } from './domain/delivery-job';
import { PrismaDeliveryJobRepository } from './infrastructure/prisma-delivery-job.repository';
import { PrismaDeliveryOfferRepository } from './infrastructure/prisma-delivery-offer.repository';

/**
 * Worker-safe rider assignment core (rule 2): job/offer repositories,
 * offer/expiry lifecycle, dispatch events and the order projection. Needs
 * only runtime, BusinessContext (owner hint routing) and Orders' worker-safe
 * ORDER_PARTIES; never SESSION_ACCESS.
 */
@Module({})
export class DeliveryAssignmentModule {
  static forRoot(runtime: DynamicModule, businessContext: DynamicModule, orderParties: DynamicModule): DynamicModule {
    return {
      module: DeliveryAssignmentModule,
      imports: [runtime, businessContext, orderParties],
      providers: [
        { provide: DELIVERY_JOB_REPOSITORY, useClass: PrismaDeliveryJobRepository },
        { provide: DELIVERY_OFFER_REPOSITORY, useClass: PrismaDeliveryOfferRepository },
        DispatchEvents,
        DispatchAssignment,
        DispatchProjection,
      ],
      exports: [DELIVERY_JOB_REPOSITORY, DELIVERY_OFFER_REPOSITORY, DispatchEvents, DispatchAssignment, DispatchProjection],
    };
  }
}

/**
 * Orders-facing DELIVERY_DISPATCH (job creation at platform `ready` + the
 * order projection) in the caller's UoW. Imports Settings (rider_earning)
 * and Businesses' checkout projection (shop location).
 */
@Module({})
export class DeliveryDispatchModule {
  static forRoot(
    runtime: DynamicModule,
    settings: DynamicModule,
    assignment: DynamicModule,
  ): DynamicModule {
    return {
      module: DeliveryDispatchModule,
      imports: [runtime, settings, BusinessCartReadModule.forRoot(runtime), assignment],
      providers: [DispatchService, { provide: DELIVERY_DISPATCH, useExisting: DispatchService }],
      exports: [DELIVERY_DISPATCH, DispatchService],
    };
  }
}

/** Worker composition: the 5 s offer-expiry sweep. */
@Module({})
export class DeliveryWorkerModule {
  static forRoot(runtime: DynamicModule): DynamicModule {
    const users = UsersReadWorkerModule.forRoot(runtime);
    const assignment = DeliveryAssignmentModule.forRoot(
      runtime,
      BusinessContextModule.forRoot(runtime, users),
      OrdersNotificationReadModule.forRoot(runtime),
    );
    return {
      module: DeliveryWorkerModule,
      imports: [runtime, assignment],
      providers: [OfferExpiryScheduler],
    };
  }
}
