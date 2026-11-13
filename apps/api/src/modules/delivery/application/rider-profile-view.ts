import { Inject, Injectable } from '@nestjs/common';
import type { Principal } from '@apnatown/shared/auth';
import {
  RiderProfileSchema,
  type RiderProfile,
} from '@apnatown/shared/delivery';
import type { TxContext } from '../../../shared/persistence/ports';
import {
  GEO_SCOPE,
  type GeoScopePort,
} from '../../geo/application/geo-scope.port';
import {
  RIDER_EDITABLE,
  RIDER_REPOSITORY,
  RIDER_REQUIRED_FIELDS,
  missingRiderFields,
  type RiderRepository,
  type StoredRider,
} from '../domain/rider';
import {
  RIDER_REQUIREMENTS,
  type RiderRequirementsPort,
  type RiderRequirementsSnapshot,
} from './delivery-ports';
import { RiderPayoutCipher } from './rider-payout';

/**
 * RiderProfileDTO projection. A user without a row sees the empty first
 * draft (version 0, status draft). Capabilities are server-derived from the
 * live status, live rider role and the requirement policy.
 */
@Injectable()
export class RiderProfileView {
  constructor(
    @Inject(RIDER_REPOSITORY) private readonly riders: RiderRepository,
    @Inject(RIDER_REQUIREMENTS)
    private readonly requirements: RiderRequirementsPort,
    @Inject(GEO_SCOPE) private readonly geo: GeoScopePort,
    private readonly payout: RiderPayoutCipher,
  ) {}

  async build(
    tx: TxContext,
    principal: Principal,
    rider: StoredRider | null,
  ): Promise<RiderProfile> {
    const policy = await this.requirements.current(tx);
    const requirements = {
      availability: policy.availability,
      ...(policy.version ? { version: policy.version } : {}),
      requiredFields: [...RIDER_REQUIRED_FIELDS],
      requiredDocumentKinds: [...policy.requiredDocumentKinds],
    };
    if (!rider)
      return RiderProfileSchema.parse({
        version: 0,
        status: 'draft',
        profile: { fullName: null, cityId: null, areaId: null },
        documents: [],
        requirements,
        capabilities: {
          canEdit: true,
          canSubmit: false,
          canGoOnline: false,
          canWork: false,
        },
      });
    const documents = await this.riders.documents(tx, rider.userId);
    const masked = this.payout.masked(rider);
    return RiderProfileSchema.parse({
      version: rider.version,
      status: rider.status,
      ...(rider.decisionReason ? { reason: rider.decisionReason } : {}),
      profile: {
        fullName: rider.fullName,
        cityId: rider.cityId,
        areaId: rider.areaId,
        ...(await this.names(tx, rider)),
      },
      ...(rider.vehicleType
        ? { vehicle: { type: rider.vehicleType, number: rider.vehicleNumber } }
        : {}),
      ...(masked ? { payoutMasked: masked } : {}),
      documents: documents.map((doc) => ({
        kind: doc.kind,
        assetId: doc.assetId,
        uploadedAt: doc.createdAt,
      })),
      requirements,
      capabilities: this.capabilities(principal, rider, policy, documents),
    });
  }

  private capabilities(
    principal: Principal,
    rider: StoredRider,
    policy: RiderRequirementsSnapshot,
    documents: readonly { kind: string }[],
  ) {
    const editable = RIDER_EDITABLE.includes(rider.status);
    const approved =
      rider.status === 'approved' && principal.roles.includes('rider');
    return {
      canEdit: editable,
      canSubmit:
        editable &&
        policy.availability === 'available' &&
        missingRiderFields(rider).length === 0 &&
        policy.requiredDocumentKinds.every((kind) =>
          documents.some((doc) => doc.kind === kind),
        ),
      canGoOnline: approved,
      canWork: approved && rider.isOnline,
    };
  }

  /** Display names in the rider's locale; omitted when Geo has no row. */
  private async names(tx: TxContext, rider: StoredRider) {
    const hi = rider.preferredLocale === 'hi';
    const [city] = rider.cityId
      ? await this.geo.describeCities([rider.cityId], tx)
      : [];
    const [area] = rider.areaId
      ? await this.geo.describeAreas([rider.areaId], tx)
      : [];
    return {
      ...(city ? { cityName: hi ? city.nameHi : city.nameEn } : {}),
      ...(area ? { areaName: hi ? area.nameHi : area.nameEn } : {}),
    };
  }
}
