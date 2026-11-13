import { Inject, Injectable } from '@nestjs/common';
import {
  OrderDeliveryBlockSchema,
  type DeliveryRiderPublic,
  type OrderDeliveryBlock,
} from '@apnatown/shared/delivery';
import type { TxContext } from '../../../shared/persistence/ports';
import {
  DELIVERY_JOB_REPOSITORY,
  DELIVERY_OFFER_REPOSITORY,
  vehicleLabel,
  type DeliveryJobRepository,
  type DeliveryOfferRepository,
} from '../domain/delivery-job';

/**
 * Nonsecret job projection for `OrderDetailDTO.delivery` (customer/owner/
 * admin). Rider identity appears only once assigned; the live offer
 * countdown is shown to owner/admin only. No phone, location or code.
 */
@Injectable()
export class DispatchProjection {
  constructor(
    @Inject(DELIVERY_JOB_REPOSITORY) private readonly jobs: DeliveryJobRepository,
    @Inject(DELIVERY_OFFER_REPOSITORY) private readonly offers: DeliveryOfferRepository,
  ) {}

  async orderBlock(
    tx: TxContext,
    orderId: string,
    viewer: 'customer' | 'business' | 'admin',
    now: Date,
  ): Promise<OrderDeliveryBlock | null> {
    const job = await this.jobs.byOrder(tx, orderId);
    if (!job) return null;
    const live =
      viewer !== 'customer' && job.assignmentState === 'offered'
        ? await this.offers.liveForJob(tx, job.id)
        : null;
    return OrderDeliveryBlockSchema.parse({
      jobId: job.id,
      jobVersion: job.version,
      jobStatus: job.status,
      assignmentState: job.assignmentState,
      rider: job.riderUserId ? await this.rider(tx, job.riderUserId) : null,
      offerExpiresAt: live && live.expiresAt > now ? live.expiresAt.toISOString() : null,
      failReason: job.failReason,
    });
  }

  async rider(tx: TxContext, riderUserId: string): Promise<DeliveryRiderPublic | null> {
    const row = await this.offers.riderPublic(tx, riderUserId);
    if (!row?.fullName) return null;
    return {
      displayName: row.fullName,
      vehicleLabel: vehicleLabel(row.vehicleType, row.vehicleNumber),
      // TODO(verify): rider ratings are not published (Reviews RV-Q3).
      ratingAverage: null,
      ratingCount: 0,
    };
  }
}
