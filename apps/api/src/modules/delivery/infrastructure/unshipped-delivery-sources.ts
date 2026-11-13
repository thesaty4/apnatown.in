import { Injectable } from '@nestjs/common';
import type {
  DeliveryJobReadPort,
  RiderRequirementsPort,
  RiderRequirementsSnapshot,
} from '../application/delivery-ports';

/**
 * DeliveryJobReadPort before Orders/Payments ship. `delivery_jobs`,
 * `delivery_offers` and `delivery_codes` FK `orders`, which does not exist,
 * so no job, offer or earning snapshot can exist: every read is empty/null.
 * Replace with the Prisma job adapter when the Orders ready event lands.
 */
@Injectable()
export class NoDeliveryJobs implements DeliveryJobReadPort {
  activeJobId(): Promise<string | null> {
    return Promise.resolve(null);
  }
  activeJob(): Promise<null> {
    return Promise.resolve(null);
  }
  currentOffer(): Promise<null> {
    return Promise.resolve(null);
  }
  completedTotals(): Promise<{ count: number; totalPaise: number }> {
    return Promise.resolve({ count: 0, totalPaise: 0 });
  }
  history(): Promise<[]> {
    return Promise.resolve([]);
  }
  historyDetail(): Promise<null> {
    return Promise.resolve(null);
  }
}

/**
 * Typed KYC requirements are not configured (Q-05) and Media has no private
 * `kyc_document` purpose yet: submission is gated, never a guessed exemption.
 */
@Injectable()
export class UnconfiguredRiderRequirements implements RiderRequirementsPort {
  current(): Promise<RiderRequirementsSnapshot> {
    return Promise.resolve({
      availability: 'unavailable',
      requiredDocumentKinds: [],
    });
  }
}
