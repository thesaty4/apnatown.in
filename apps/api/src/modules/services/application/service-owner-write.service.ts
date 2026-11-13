import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import { catalogSlug } from '@apnatown/shared/catalog';
import {
  SERVICE_STATUS_TRANSITIONS,
  ServiceOwnerDeletedSchema,
  ServiceOwnerSchema,
  type ServiceOwner,
  type ServiceOwnerCreate,
  type ServiceOwnerDelete,
  type ServiceOwnerDeleted,
  type ServiceOwnerPatch,
} from '@apnatown/shared/services';
import {
  FEATURED_ENTITLEMENT_READ,
  type FeaturedEntitlementReadPort,
} from '../../../shared/entitlements/featured-entitlement';
import { DomainError } from '../../../shared/errors/errors';
import {
  COMMAND_UNIT_OF_WORK,
  type CommandUnitOfWork,
  type TxContext,
} from '../../../shared/persistence/ports';
import {
  CLOCK,
  ID_PROVIDER,
  type Clock,
  type IdProvider,
} from '../../../shared/runtime/providers';
import { BusinessOwnerContext } from '../../businesses/application/business-owner-context';
import type { StoredBusiness } from '../../businesses/domain/business';
import {
  ServiceTaxonomyPolicy,
  assertServicePrice,
  createFields,
  mergeFields,
  serviceOwnerDto,
} from './service-owner-common';
import {
  SERVICE_OWNER_REPOSITORY,
  type ServiceOwnerRepository,
  type StoredService,
} from './service-owner-ports';
import {
  ServiceOwnerWriteSupport,
  type ServiceOwnerCommand,
} from './service-owner-write-support';

type Owned = ServiceOwner & JsonValue;
const ownedReceipt = {
  store: (result: Owned) => result,
  replay: (_tx: TxContext, stored: JsonValue) =>
    Promise.resolve(ServiceOwnerSchema.parse(stored) as Owned),
};
type Deleted = ServiceOwnerDeleted & JsonValue;
const deletedReceipt = {
  store: (result: Deleted) => result,
  replay: (_tx: TxContext, stored: JsonValue) =>
    Promise.resolve(ServiceOwnerDeletedSchema.parse(stored) as Deleted),
};

/**
 * Owner service writes (F-VD-014, F-PV-003; BR-06/08/16). Require the
 * caller's own APPROVED business with its live seller role; PATCH/DELETE are
 * version-guarded and scoped to that business. Status moves only along
 * SERVICE_STATUS_TRANSITIONS; a new featured selection needs current Premium
 * entitlement (fails closed). Events carry ids only.
 */
@Injectable()
export class ServiceOwnerWriteService {
  constructor(
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(SERVICE_OWNER_REPOSITORY)
    private readonly services: ServiceOwnerRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    private readonly taxonomy: ServiceTaxonomyPolicy,
    private readonly support: ServiceOwnerWriteSupport,
    @Inject(FEATURED_ENTITLEMENT_READ)
    private readonly entitlements: FeaturedEntitlementReadPort,
    private readonly businesses: BusinessOwnerContext,
  ) {}

  /** POST /businesses/me/services: idempotent, 201 with the owner DTO. */
  async create(
    request: ServiceOwnerCommand,
    input: ServiceOwnerCreate,
  ): Promise<ServiceOwner> {
    const fields = createFields(input);
    const command = this.support.command(
      request,
      'POST',
      '/businesses/me/services',
      201,
      input,
    );
    assertServicePrice(fields);
    // Catalog taxonomy is read before the write transaction.
    await this.taxonomy.assert(fields.categoryId, fields.subcategoryId);
    return this.commands.run(
      command,
      async (tx) => {
        const business = await this.support.approved(
          tx,
          request,
          'USERS_APPROVAL_REQUIRED',
        );
        const entitled = await this.entitlements.isPremium(business.id, tx);
        if (fields.featuredSelected && !entitled)
          throw new DomainError('FEATURED_ENTITLEMENT_UNAVAILABLE');
        const media = await this.support.media(
          tx,
          business,
          request,
          input.media ?? [],
        );
        // Gallery default comes from business settings (Q-50).
        const galleryVisible =
          input.galleryVisible ??
          (await this.businesses.galleryMediaDefault(tx, business.id));
        const base = catalogSlug(fields.nameEn).slice(0, 70).replace(/-+$/, '');
        const row = await this.services.insert(tx, {
          ...fields,
          media,
          galleryVisible,
          id: this.ids.uuidv7(),
          businessId: business.id,
          slug: await this.services.allocateSlug(tx, base || 'service'),
          at: this.clock.now(),
        });
        await this.support.changed(tx, request.correlationId, row, row, false);
        return serviceOwnerDto(row, business, entitled) as Owned;
      },
      ownedReceipt,
    );
  }

  /** PATCH: allow-listed fields + guarded status edge, version-checked. */
  update(
    request: ServiceOwnerCommand,
    serviceId: string,
    input: ServiceOwnerPatch,
  ): Promise<ServiceOwner> {
    const command = this.support.command(
      request,
      'PATCH',
      `/businesses/me/services/${serviceId}`,
      200,
      input,
    );
    return this.commands.run(
      command,
      async (tx) => {
        const { business, current } = await this.current(
          tx,
          request,
          serviceId,
          input.expectedVersion,
        );
        const media = input.media
          ? await this.support.media(tx, business, request, input.media)
          : current.media;
        const next = mergeFields(current, input, media);
        if (
          next.status !== current.status &&
          !SERVICE_STATUS_TRANSITIONS[current.status].includes(next.status)
        )
          throw new DomainError('SERVICES_INVALID_TRANSITION');
        assertServicePrice(next);
        if (input.categoryId !== undefined || input.subcategoryId !== undefined)
          await this.taxonomy.assert(next.categoryId, next.subcategoryId);
        const entitled = await this.entitlements.isPremium(business.id, tx);
        // Only a NEW selection needs entitlement; a retained one stays stored.
        if (next.featuredSelected && !current.featuredSelected && !entitled)
          throw new DomainError('FEATURED_ENTITLEMENT_UNAVAILABLE');
        const row = await this.services.update(tx, {
          businessId: business.id,
          serviceId,
          expectedVersion: input.expectedVersion,
          fields: next,
          at: this.clock.now(),
        });
        if (!row) throw new DomainError('SERVICES_VERSION_CONFLICT');
        await this.support.changed(
          tx,
          request.correlationId,
          current,
          row,
          false,
        );
        return serviceOwnerDto(row, business, entitled) as Owned;
      },
      ownedReceipt,
    );
  }

  /** DELETE: version-guarded soft delete; the slug stays reserved. */
  remove(
    request: ServiceOwnerCommand,
    serviceId: string,
    input: ServiceOwnerDelete,
  ): Promise<ServiceOwnerDeleted> {
    const command = this.support.command(
      request,
      'DELETE',
      `/businesses/me/services/${serviceId}`,
      200,
      input,
    );
    return this.commands.run(
      command,
      async (tx) => {
        const { business, current } = await this.current(
          tx,
          request,
          serviceId,
          input.expectedVersion,
        );
        const version = await this.services.softDelete(tx, {
          businessId: business.id,
          serviceId,
          expectedVersion: input.expectedVersion,
          at: this.clock.now(),
        });
        if (version === null)
          throw new DomainError('SERVICES_VERSION_CONFLICT');
        await this.support.changed(
          tx,
          request.correlationId,
          current,
          { ...current, version },
          true,
        );
        return ServiceOwnerDeletedSchema.parse({
          id: serviceId,
          version,
          deleted: true,
        }) as Deleted;
      },
      deletedReceipt,
    );
  }

  /** Locked approved business + its locked, version-matched service. */
  private async current(
    tx: TxContext,
    request: ServiceOwnerCommand,
    serviceId: string,
    expectedVersion: number,
  ): Promise<{ business: StoredBusiness; current: StoredService }> {
    const business = await this.support.approved(
      tx,
      request,
      'COMMON_FORBIDDEN',
    );
    const current = await this.services.find(tx, {
      businessId: business.id,
      serviceId,
      lock: true,
    });
    if (!current) throw new DomainError('COMMON_NOT_FOUND');
    if (current.version !== expectedVersion)
      throw new DomainError('SERVICES_VERSION_CONFLICT');
    return { business, current };
  }
}
