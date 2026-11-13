import { Inject, Injectable } from '@nestjs/common';
import {
  ServiceOwnerPageSchema,
  type ServiceOwner,
  type ServiceOwnerListQuery,
  type ServiceOwnerPage,
} from '@apnatown/shared/services';
import {
  FEATURED_ENTITLEMENT_READ,
  type FeaturedEntitlementReadPort,
} from '../../../shared/entitlements/featured-entitlement';
import { DomainError } from '../../../shared/errors/errors';
import {
  CURSOR_CODEC,
  CursorCodec,
  type CursorBinding,
} from '../../../shared/pagination/cursor';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import {
  EnquiryOwnerAccess,
  type EnquiryOwnerRequest,
} from './enquiry-owner-access';
import { serviceOwnerDto } from './service-owner-common';
import {
  SERVICE_OWNER_REPOSITORY,
  type ServiceOwnerRepository,
  type ServicePosition,
} from './service-owner-ports';

/**
 * Owner service manager reads (F-VD-014, F-PV-003; S-VEND-13, S-PROV-08).
 * Scoped to the caller's own business resolved from the session; another
 * business's service is indistinguishable from a missing one.
 */
@Injectable()
export class ServiceOwnerService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(SERVICE_OWNER_REPOSITORY)
    private readonly services: ServiceOwnerRepository,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    private readonly access: EnquiryOwnerAccess,
    @Inject(FEATURED_ENTITLEMENT_READ)
    private readonly entitlements: FeaturedEntitlementReadPort,
  ) {}

  /** Non-deleted services, newest first, optional allow-listed status. */
  list(
    request: EnquiryOwnerRequest,
    input: ServiceOwnerListQuery,
  ): Promise<ServiceOwnerPage> {
    return this.uow.run(async (tx) => {
      const business = await this.access.resolve(tx, request);
      const binding: CursorBinding = {
        operation: 'services.owner.list',
        sort: 'createdAt-desc-id-desc',
        filters: { status: input.status ?? null },
        scope: { businessId: business.id },
      };
      const after = this.position(input.cursor, binding);
      const rows = await this.services.page(tx, {
        businessId: business.id,
        ...(input.status ? { status: input.status } : {}),
        ...(after ? { after } : {}),
        limit: input.limit,
      });
      const entitled = await this.entitlements.isPremium(business.id, tx);
      const page = rows.slice(0, input.limit);
      const last = page.at(-1);
      return ServiceOwnerPageSchema.parse({
        items: page.map((row) => serviceOwnerDto(row, business, entitled)),
        nextCursor:
          rows.length > input.limit && last
            ? this.cursors.encode(binding, [
                last.createdAt.toISOString(),
                last.id,
              ])
            : null,
      });
    });
  }

  detail(
    request: EnquiryOwnerRequest,
    serviceId: string,
  ): Promise<ServiceOwner> {
    return this.uow.run(async (tx) => {
      const business = await this.access.resolve(tx, request);
      const row = await this.services.find(tx, {
        businessId: business.id,
        serviceId,
      });
      if (!row) throw new DomainError('COMMON_NOT_FOUND');
      const entitled = await this.entitlements.isPremium(business.id, tx);
      return serviceOwnerDto(row, business, entitled);
    });
  }

  private position(
    cursor: string | undefined,
    binding: CursorBinding,
  ): ServicePosition | undefined {
    if (!cursor) return undefined;
    const [createdAt, id] = this.cursors.decode(cursor, binding);
    if (typeof createdAt !== 'string' || typeof id !== 'string')
      throw new DomainError('COMMON_VALIDATION_FAILED');
    return { createdAt, id };
  }
}
