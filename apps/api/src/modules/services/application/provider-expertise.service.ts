import { Inject, Injectable } from '@nestjs/common';
import {
  SERVICES_EVENT_TYPES,
  ProviderExpertiseChangedPayloadSchema,
} from '@apnatown/shared';
import {
  ProviderExpertiseSchema,
  PublicProviderExpertiseSchema,
  type ProviderExpertise,
  type ProviderExpertiseReplace,
  type PublicProviderExpertise,
} from '@apnatown/shared/services';
import type { SessionBinding } from '../../../shared/auth';
import {
  SESSION_ACCESS,
  type SessionAccess,
} from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import {
  EVENT_FACTORY,
  type EventFactory,
} from '../../../shared/events/event-factory';
import { OUTBOX_WRITER, type OutboxWriter } from '../../../shared/events/ports';
import {
  UNIT_OF_WORK,
  type TxContext,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import { BusinessOwnerContext } from '../../businesses/application/business-owner-context';
import {
  capabilities,
  type StoredBusiness,
} from '../../businesses/domain/business';
import {
  CATALOG_READ,
  type CatalogReadPort,
} from '../../catalog/application/catalog-ports';
import {
  PROVIDER_EXPERTISE_REPOSITORY,
  type ProviderExpertiseRepository,
} from './provider-expertise-ports';

/** Authenticated owner request; the business is always resolved server-side. */
export interface ExpertiseOwnerRequest {
  session: SessionBinding;
  actorId: string;
}

/**
 * Provider expertise use-cases (F-PV-002; S-PROV-01/09, S-CUST-07).
 * Owner access needs the caller's own PROVIDER business in a profile-editable
 * status (draft/pending/rejected/changes_requested/approved); it grants no
 * selling or listing-publication capability. Replacement is version-guarded
 * on the expertise aggregate, never the business profile version.
 */
@Injectable()
export class ProviderExpertiseService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(PROVIDER_EXPERTISE_REPOSITORY)
    private readonly expertise: ProviderExpertiseRepository,
    @Inject(CATALOG_READ) private readonly catalog: CatalogReadPort,
    @Inject(EVENT_FACTORY) private readonly events: EventFactory,
    @Inject(OUTBOX_WRITER) private readonly outbox: OutboxWriter,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly owners: BusinessOwnerContext,
  ) {}

  mine(request: ExpertiseOwnerRequest): Promise<ProviderExpertise> {
    return this.uow.run(async (tx) => {
      const business = await this.provider(tx, request, false);
      const current = await this.expertise.read(tx, business.id);
      return ProviderExpertiseSchema.parse({
        subcategoryIds: current.subcategoryIds,
        expertiseVersion: current.version,
      });
    });
  }

  async replace(
    request: ExpertiseOwnerRequest & { correlationId: string },
    input: ProviderExpertiseReplace,
  ): Promise<ProviderExpertise> {
    const ids = [...new Set(input.subcategoryIds)];
    // Catalog taxonomy is read outside the write transaction (as Businesses).
    await this.assertActiveServiceSubcategories(ids);
    return this.uow.run(async (tx) => {
      // Locks the business row so a concurrent suspension cannot interleave.
      const business = await this.provider(tx, request, true);
      const at = this.clock.now();
      const locked = await this.expertise.lockVersion(tx, business.id, at);
      if (locked !== input.expectedVersion)
        throw new DomainError('SERVICES_VERSION_CONFLICT');
      const version = await this.expertise.replace(tx, {
        businessId: business.id,
        subcategoryIds: ids,
        expectedVersion: input.expectedVersion,
        at,
      });
      if (version === null) throw new DomainError('SERVICES_VERSION_CONFLICT');
      await this.outbox.append(
        tx,
        this.events.create(
          SERVICES_EVENT_TYPES.providerExpertiseChanged,
          { type: 'provider_expertise', id: business.id, version },
          ProviderExpertiseChangedPayloadSchema.parse({
            businessId: business.id,
            expertiseVersion: version,
          }),
          request.correlationId,
        ),
      );
      return ProviderExpertiseSchema.parse({
        subcategoryIds: ids,
        expertiseVersion: version,
      });
    });
  }

  /** Active localized expertise of a public approved provider. */
  async publicBySlug(slug: string): Promise<PublicProviderExpertise> {
    const ids = await this.expertise.publicSubcategoryIds(slug);
    if (ids === null) throw new DomainError('COMMON_NOT_FOUND');
    if (!ids.length) return PublicProviderExpertiseSchema.parse({ items: [] });
    const taxonomy = await this.catalog.taxonomy({
      subcategoryIds: ids,
      kind: 'service',
      activeOnly: true,
    });
    const categoryOrder = new Map(
      taxonomy.categories
        .filter((category) => category.active && category.kind === 'service')
        .map((category) => [category.id, category.sortOrder]),
    );
    const items = taxonomy.subcategories
      .filter((row) => row.active && categoryOrder.has(row.categoryId))
      .sort(
        (a, b) =>
          categoryOrder.get(a.categoryId)! - categoryOrder.get(b.categoryId)! ||
          a.categoryId.localeCompare(b.categoryId) ||
          a.sortOrder - b.sortOrder ||
          a.id.localeCompare(b.id),
      )
      .map((row) => ({
        id: row.id,
        categoryId: row.categoryId,
        slug: row.slug,
        nameEn: row.nameEn,
        nameHi: row.nameHi,
      }));
    return PublicProviderExpertiseSchema.parse({ items });
  }

  /**
   * Live session + the caller's own provider business in an editable status.
   * A vendor-only caller, an applicant without a provider business, and a
   * suspended/inactive provider are all COMMON_FORBIDDEN.
   */
  private async provider(
    tx: TxContext,
    request: ExpertiseOwnerRequest,
    lock: boolean,
  ): Promise<StoredBusiness> {
    const principal = await this.sessions.requirePrincipal(tx, request.session);
    if (principal.userId !== request.actorId)
      throw new DomainError('SESSION_EXPIRED');
    let business: StoredBusiness;
    try {
      business = await this.owners.resolve(tx, {
        userId: principal.userId,
        kind: 'provider',
        lock,
      });
    } catch (error) {
      if (
        error instanceof DomainError &&
        (error.code === 'BUSINESS_NOT_FOUND' ||
          error.code === 'BUSINESS_NOT_OWNED')
      )
        throw new DomainError('COMMON_FORBIDDEN');
      throw error;
    }
    if (!capabilities(business, false).editProfile)
      throw new DomainError('COMMON_FORBIDDEN');
    return business;
  }

  private async assertActiveServiceSubcategories(
    ids: readonly string[],
  ): Promise<void> {
    if (!ids.length) return;
    const taxonomy = await this.catalog.taxonomy({
      subcategoryIds: ids,
      kind: 'service',
      activeOnly: true,
    });
    const parents = new Set(
      taxonomy.categories
        .filter((category) => category.active && category.kind === 'service')
        .map((category) => category.id),
    );
    const active = new Set(
      taxonomy.subcategories
        .filter((row) => row.active && parents.has(row.categoryId))
        .map((row) => row.id),
    );
    if (ids.some((id) => !active.has(id)))
      throw new DomainError('SERVICES_EXPERTISE_INVALID', {
        field: 'subcategoryIds',
      });
  }
}
