import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  RiderProfileSchema,
  type RiderDraftWrite,
  type RiderProfile,
} from '@apnatown/shared/delivery';
import { DomainError } from '../../../shared/errors/errors';
import {
  COMMAND_CONTEXT_FACTORY,
  HttpCommandContextFactory,
} from '../../../shared/idempotency/context';
import {
  COMMAND_UNIT_OF_WORK,
  UNIT_OF_WORK,
  type CommandUnitOfWork,
  type TxContext,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import { receipt } from '../../catalog/application/catalog-mappers';
import {
  GEO_SCOPE,
  type GeoScopePort,
} from '../../geo/application/geo-scope.port';
import {
  USER_IDENTITY,
  type UserIdentityPort,
} from '../../users/application/identity-port';
import {
  RIDER_EDITABLE,
  RIDER_REPOSITORY,
  missingRiderFields,
  type RiderDraftChanges,
  type RiderRepository,
  type StoredRider,
} from '../domain/rider';
import {
  RIDER_REQUIREMENTS,
  type RiderRequirementsPort,
} from './delivery-ports';
import {
  RiderAccess,
  type RiderCommand,
  type RiderRequest,
} from './rider-access';
import { RiderEvents } from './rider-events';
import { RiderPayoutCipher } from './rider-payout';
import { RiderProfileView } from './rider-profile-view';

// Local retry horizon, not a retention policy (mirrors Businesses).
const RECEIPT_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Rider application (F-RD-001/F-RD-008, ST-approval). Any authenticated user
 * may own one application; no role, status or online field is accepted. The
 * draft write, submit transition and outbox event share one idempotent UoW,
 * so a rejected submit commits nothing.
 */
@Injectable()
export class RiderProfileService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY)
    private readonly contexts: HttpCommandContextFactory,
    @Inject(RIDER_REPOSITORY) private readonly riders: RiderRepository,
    @Inject(RIDER_REQUIREMENTS)
    private readonly requirements: RiderRequirementsPort,
    @Inject(GEO_SCOPE) private readonly geo: GeoScopePort,
    @Inject(USER_IDENTITY) private readonly identity: UserIdentityPort,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly access: RiderAccess,
    private readonly payout: RiderPayoutCipher,
    private readonly view: RiderProfileView,
    private readonly events: RiderEvents,
  ) {}

  me(request: RiderRequest): Promise<RiderProfile> {
    return this.uow.run(async (tx) => {
      const principal = await this.access.principal(tx, request);
      return this.view.build(
        tx,
        principal,
        await this.riders.find(tx, principal.userId),
      );
    });
  }

  save(request: RiderCommand, input: RiderDraftWrite): Promise<RiderProfile> {
    return this.commands.run(
      this.command(request, input),
      async (tx) => {
        const principal = await this.access.principal(tx, request);
        const userId = principal.userId;
        const current = await this.riders.find(tx, userId, true);
        if ((current?.version ?? 0) !== input.expectedVersion)
          throw new DomainError('DELIVERY_VERSION_CONFLICT');
        if (current && !RIDER_EDITABLE.includes(current.status))
          throw new DomainError('RIDER_STATE_CONFLICT');
        // Typed KYC attachment needs Media's private kyc_document purpose (Q-05).
        if (input.documents?.length)
          throw new DomainError('RIDER_REQUIREMENTS_UNAVAILABLE', {
            field: 'documents',
          });
        const changes = await this.changes(tx, userId, current, input);
        await this.write(tx, userId, current, changes);
        let after = (await this.riders.find(tx, userId, true))!;
        if (input.submit)
          after = await this.submit(tx, after, request.correlationId);
        return (await this.view.build(tx, principal, after)) as RiderProfile &
          JsonValue;
      },
      receipt(RiderProfileSchema),
    );
  }

  /** Supplied steps only; later-step fields stay untouched. */
  private async changes(
    tx: TxContext,
    userId: string,
    current: StoredRider | null,
    input: RiderDraftWrite,
  ): Promise<RiderDraftChanges> {
    const changes: RiderDraftChanges = {};
    if (input.profile) {
      changes.fullName = input.profile.fullName;
      Object.assign(changes, await this.scope(tx, current, input.profile));
    }
    if (input.vehicle) {
      changes.vehicleType = input.vehicle.type;
      changes.vehicleNumber = input.vehicle.number ?? null;
    }
    if (input.payout) {
      changes.payoutUpiCiphertext = this.payout.encryptUpi(userId, input.payout.upi);
      changes.payoutBankCiphertext = input.payout.bankAccount
        ? this.payout.encryptBank(userId, input.payout.bankAccount)
        : null;
    }
    return changes;
  }

  /** Geo-validated city/area; an area implies its own city. */
  private async scope(
    tx: TxContext,
    current: StoredRider | null,
    profile: NonNullable<RiderDraftWrite['profile']>,
  ): Promise<Pick<RiderDraftChanges, 'cityId' | 'areaId'>> {
    if (profile.areaId) {
      const resolved = await this.geo.resolve({ areaId: profile.areaId }, tx);
      if (profile.cityId && profile.cityId !== resolved.cityId)
        throw new DomainError('COMMON_VALIDATION_FAILED', {
          field: 'profile.cityId',
        });
      return { cityId: resolved.cityId, areaId: resolved.areaId };
    }
    if (!profile.cityId || profile.cityId === current?.cityId) return {};
    await this.geo.assertAreasInCity({ cityId: profile.cityId, areaIds: [] }, tx);
    // A new city drops the previous city's area.
    return { cityId: profile.cityId, areaId: null };
  }

  private async write(
    tx: TxContext,
    userId: string,
    current: StoredRider | null,
    changes: RiderDraftChanges,
  ): Promise<void> {
    const at = this.clock.now();
    if (!current) {
      const [profile] = await this.identity.describe(tx, [userId]);
      if (
        !(await this.riders.insertDraft(tx, {
          userId,
          locale: profile?.locale ?? 'en',
          changes,
          at,
        }))
      )
        throw new DomainError('DELIVERY_VERSION_CONFLICT');
      return;
    }
    if (!Object.keys(changes).length) return;
    if (
      !(await this.riders.updateDraft(tx, {
        userId,
        expectedVersion: current.version,
        changes,
        at,
      }))
    )
      throw new DomainError('DELIVERY_VERSION_CONFLICT');
  }

  /** Full requirement check, then editable -> pending with the outbox event. */
  private async submit(
    tx: TxContext,
    rider: StoredRider,
    correlationId: string,
  ): Promise<StoredRider> {
    const missing = missingRiderFields(rider);
    if (missing.length)
      throw new DomainError('COMMON_VALIDATION_FAILED', { fields: missing });
    if (!(await this.identity.verifiedPhone(tx, rider.userId)))
      throw new DomainError('COMMON_FORBIDDEN');
    const policy = await this.requirements.current(tx);
    if (policy.availability !== 'available')
      throw new DomainError('RIDER_REQUIREMENTS_UNAVAILABLE', {
        field: 'documents',
      });
    const documents = await this.riders.documents(tx, rider.userId);
    const absent = policy.requiredDocumentKinds.filter(
      (kind) => !documents.some((doc) => doc.kind === kind),
    );
    if (absent.length)
      throw new DomainError('COMMON_VALIDATION_FAILED', { field: 'documents' });
    const at = this.clock.now();
    if (
      !(await this.riders.transition(tx, {
        userId: rider.userId,
        expectedVersion: rider.version,
        status: 'pending',
        reason: null,
        submittedAt: at,
        at,
      }))
    )
      throw new DomainError('DELIVERY_VERSION_CONFLICT');
    const after = (await this.riders.find(tx, rider.userId))!;
    await this.events.submitted(tx, after, correlationId);
    return after;
  }

  private command(request: RiderCommand, input: RiderDraftWrite) {
    return this.contexts.create(
      {
        name: 'delivery.rider.application.save',
        method: 'PUT',
        scope: 'principal',
        successStatus: 200,
      },
      {
        actorId: request.actorId,
        correlationId: request.correlationId,
        resource: '/delivery/riders/me',
        business: null,
        expiresAt: new Date(this.clock.now().getTime() + RECEIPT_TTL_MS),
      },
      {
        key: request.key,
        // Payout values are part of the request hash (keyed), never stored.
        payload: JSON.parse(JSON.stringify(input)) as JsonValue,
      },
    );
  }
}
