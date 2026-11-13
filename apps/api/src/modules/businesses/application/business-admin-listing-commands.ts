import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import type { ScopeRef } from '@apnatown/shared/admin';
import {
  BusinessStatusSchema,
  type BusinessKind,
} from '@apnatown/shared/businesses';
import { IdSchema, VersionSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import {
  COMMAND_CONTEXT_FACTORY,
  HttpCommandContextFactory,
} from '../../../shared/idempotency/context';
import { RECEIPT_TTL_MS } from '../../../shared/idempotency/receipt-ttl';
import {
  COMMAND_UNIT_OF_WORK,
  type CommandUnitOfWork,
  type TxContext,
} from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import {
  AUDIT_WRITER,
  type AuditWriter,
} from '../../audit/application/audit-writer.port';
import {
  BUSINESS_REPOSITORY,
  type BusinessRepository,
  type StoredBusiness,
} from '../domain/business';
import type {
  BusinessAdminListingCommand as Command,
  BusinessAdminListingResult,
} from './business-admin-listing-ports';
import { BUSINESS_AUDIT_FIELDS, businessSnapshot } from './business-mappers';
import {
  BusinessReviewer,
  businessScope,
  type ReviewerActor,
} from './business-reviewer';

const ResultSchema = z.strictObject({
  businessId: IdSchema,
  status: BusinessStatusSchema,
  deleted: z.boolean(),
  version: VersionSchema,
});
const TYPE_FOR_KIND = { shop: 'business', provider: 'provider' } as const;
const AUDIT_FIELDS = [
  ...BUSINESS_AUDIT_FIELDS,
  'nameHi',
  'phoneE164',
  'adminNote',
] as const;

export type ListingVerb = 'update' | 'remove';
export type StoredListingResult = BusinessAdminListingResult & JsonValue;

export function listingResult(business: StoredBusiness): StoredListingResult {
  return ResultSchema.parse({
    businessId: business.id,
    status: business.status,
    deleted: business.deletedAt !== null,
    version: business.version,
  });
}

function snapshot(business: StoredBusiness, note: string | null) {
  // Phone values are redacted by the audit writer; the diff records the change.
  return {
    ...businessSnapshot(business),
    nameHi: business.nameHi,
    phoneE164: business.phoneE164,
    adminNote: note,
  };
}

/**
 * Idempotent command envelope (replay rechecks current `catalog:edit`, plus
 * `approvals:edit` when the command carried a `statusAction`) and
 * audit entry shared by the Admin Listings update/remove commands.
 */
@Injectable()
export class BusinessAdminListingCommands {
  constructor(
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY)
    private readonly contexts: HttpCommandContextFactory,
    @Inject(BUSINESS_REPOSITORY)
    private readonly businesses: BusinessRepository,
    @Inject(AUDIT_WRITER) private readonly audit: AuditWriter,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly reviewer: BusinessReviewer,
  ) {}

  run(
    request: Command,
    verb: ListingVerb,
    method: 'PATCH' | 'DELETE',
    input: { businessId: string; kind: BusinessKind },
    payload: object,
    work: (tx: TxContext) => Promise<StoredListingResult>,
  ): Promise<BusinessAdminListingResult> {
    const resource = `/admin/listings/${TYPE_FOR_KIND[input.kind]}/${input.businessId}`;
    const command = this.contexts.create(
      {
        name: `business.listing.${verb}`,
        method,
        scope: 'principal',
        successStatus: 200,
      },
      {
        actorId: request.actorId,
        correlationId: request.correlationId,
        resource,
        business: null,
        expiresAt: new Date(this.clock.now().getTime() + RECEIPT_TTL_MS),
      },
      {
        key: request.key,
        payload: JSON.parse(JSON.stringify(payload)) as JsonValue,
      },
    );
    return this.commands.run(command, work, {
      store: (stored) => stored,
      // Replay rechecks the caller's current catalog:edit over the listing.
      replay: async (tx, stored) => {
        const current = await this.businesses.find(tx, input.businessId);
        // A vanished listing is unresolved scope: super_admin only.
        const scopes: ScopeRef[] = [
          current ? businessScope(current) : { cityId: null, areaId: null },
        ];
        const actor = await this.reviewer.require(tx, request, {
          module: 'catalog',
          action: 'edit',
          scopes,
        });
        // The key is bound to this payload, so it equals the stored command's.
        if ('statusAction' in payload && payload.statusAction !== undefined)
          await this.reviewer.authorize(tx, actor.userId, {
            module: 'approvals',
            action: 'edit',
            scopes,
          });
        return ResultSchema.parse(stored) as StoredListingResult;
      },
    });
  }

  record(
    tx: TxContext,
    request: Command,
    actor: ReviewerActor,
    verb: ListingVerb,
    change: { before: StoredBusiness; after: StoredBusiness; note?: string },
    scopes: readonly ScopeRef[],
  ): Promise<void> {
    const { before, after } = change;
    return this.audit.record(tx, {
      actor,
      action: `business.listing.${verb}`,
      entityType: 'business',
      entityId: after.id,
      cityId: after.cityId,
      areaId: after.areaId,
      relatedScopes: scopes.filter((scope) => scope.areaId !== after.areaId),
      summary: `Admin listing ${verb}`,
      before: snapshot(before, null),
      after: snapshot(after, change.note ?? null),
      fields: AUDIT_FIELDS,
      correlationId: request.correlationId,
    });
  }
}
