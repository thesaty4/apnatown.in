import { Injectable } from '@nestjs/common';
import type {
  RiderRequirementsPort,
  RiderRequirementsSnapshot,
} from '../application/delivery-ports';

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
