import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import type { ScopeRef } from '@apnatown/shared/admin';
import type { BusinessKind } from '@apnatown/shared/businesses';
import {
  AdminSuggestionPageSchema,
  SUGGESTION_CANDIDATE_LIMIT,
  SuggestionDuplicateResultSchema,
  SuggestionPageSchema,
  SuggestionSchema,
  type AdminSuggestionPage,
  type AdminSuggestionQuery,
  type DecideSuggestion,
  type SuggestSubcategory,
  type Suggestion,
  type SuggestionCandidate,
  type SuggestionDuplicateCheck,
  type SuggestionDuplicateResult,
  type SuggestionPage,
} from '@apnatown/shared/catalog';
import {
  IdSchema,
  TimestampSchema,
  type PageQuery,
} from '@apnatown/shared/wire';
import { z } from 'zod';
import type { SessionBinding } from '../../../shared/auth';
import {
  ADMIN_SCOPE,
  SESSION_ACCESS,
  type AdminReadContext,
  type AdminScopePort,
  type SessionAccess,
} from '../../../shared/auth/ports';
import { ScopeRegistry } from '../../../shared/auth/scope-registry';
import { DomainError } from '../../../shared/errors/errors';
import {
  COMMAND_CONTEXT_FACTORY,
  HttpCommandContextFactory,
} from '../../../shared/idempotency/context';
import {
  CURSOR_CODEC,
  CursorCodec,
  type CursorBinding,
} from '../../../shared/pagination/cursor';
import {
  COMMAND_UNIT_OF_WORK,
  UNIT_OF_WORK,
  type CommandUnitOfWork,
  type TxContext,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import {
  CLOCK,
  ID_PROVIDER,
  type Clock,
  type IdProvider,
} from '../../../shared/runtime/providers';
import {
  AUDIT_WRITER,
  type AuditActor,
  type AuditSnapshot,
  type AuditWriter,
} from '../../audit/application/audit-writer.port';
import {
  USER_IDENTITY,
  type UserIdentityPort,
} from '../../users/application/identity-port';
import {
  SUGGESTION_REPOSITORY,
  TAXONOMY_REPOSITORY,
  type StoredCategory,
  type StoredSuggestion,
  type SuggestionPosition,
  type SuggestionRepository,
  type TaxonomyRepository,
} from '../domain/catalog.repository';
import { CatalogEvents } from './catalog-events';
import { receipt } from './catalog-mappers';
import {
  CATALOG_BUSINESS_CONTEXT,
  type CatalogBusinessContextPort,
  type SuggesterContext,
} from './catalog-ports';
import { assertCatalogReader } from './catalog-taxonomy.service';
import { TaxonomyWriter } from './taxonomy-writer';

/** Owner suggestion abuse limit (per principal). */
export const SUGGESTION_SUBMIT_LIMIT = {
  key: 'catalog.suggestion.submit',
  maximumHits: 10,
  windowSeconds: 3600,
} as const;
// Local retry horizon, not a retention policy (mirrors AdminCommands).
const RECEIPT_TTL_MS = 24 * 60 * 60 * 1000;
const positionSchema = z.tuple([TimestampSchema, IdSchema]);
const SUGGESTION_AUDIT_FIELDS = [
  'status',
  'categoryId',
  'nameEn',
  'nameHi',
  'rejectionReason',
  'subcategoryId',
  'mergedIntoSubcategoryId',
  'version',
] as const;

export interface CatalogCommand {
  session: SessionBinding;
  actorId: string;
  correlationId: string;
  key: unknown;
  /** Owner routes: `X-Business-Kind` context (selects, never grants). */
  businessKind?: BusinessKind;
}
export interface OwnerRequest {
  session: SessionBinding;
  actorId: string;
  businessKind?: BusinessKind;
}

function suggestionDto(row: StoredSuggestion): Suggestion {
  return SuggestionSchema.parse({
    id: row.id,
    businessId: row.businessId,
    cityId: row.cityId,
    areaId: row.areaId,
    categoryId: row.categoryId,
    nameEn: row.nameEn,
    nameHi: row.nameHi,
    reason: row.reason,
    status: row.status,
    rejectionReason: row.rejectionReason,
    subcategoryId: row.subcategoryId,
    mergedIntoSubcategoryId: row.mergedIntoSubcategoryId,
    reviewedAt: row.reviewedAt,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function suggestionSnapshot(row: StoredSuggestion): AuditSnapshot {
  return {
    status: row.status,
    categoryId: row.categoryId,
    nameEn: row.nameEn,
    nameHi: row.nameHi,
    rejectionReason: row.rejectionReason,
    subcategoryId: row.subcategoryId,
    mergedIntoSubcategoryId: row.mergedIntoSubcategoryId,
    version: row.version,
  };
}

/**
 * Owner subcategory suggestions (F-VD-006) and the scoped admin review queue
 * (F-AD-006). Business, submitter, city and area always come from trusted
 * context (CatalogBusinessContextPort), never from the request body. Decisions
 * follow ST-subcategory-suggestion (pending -> approved|rejected|merged) and
 * commit the decision, audit and outbox event atomically.
 */
@Injectable()
export class CatalogSuggestionsService implements OnModuleInit {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY)
    private readonly contexts: HttpCommandContextFactory,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(ADMIN_SCOPE) private readonly adminScope: AdminScopePort,
    @Inject(USER_IDENTITY) private readonly identity: UserIdentityPort,
    @Inject(SUGGESTION_REPOSITORY)
    private readonly suggestions: SuggestionRepository,
    @Inject(TAXONOMY_REPOSITORY)
    private readonly taxonomy: TaxonomyRepository,
    @Inject(CATALOG_BUSINESS_CONTEXT)
    private readonly business: CatalogBusinessContextPort,
    @Inject(AUDIT_WRITER) private readonly audit: AuditWriter,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    private readonly registry: ScopeRegistry,
    private readonly writer: TaxonomyWriter,
    private readonly events: CatalogEvents,
  ) {}

  onModuleInit(): void {
    // The suggestion's stored area is its review authorization scope.
    this.registry.register('catalog.suggestion', async (id, tx) => {
      const row = await (tx
        ? this.suggestions.find(tx, id)
        : this.uow.run((t) => this.suggestions.find(t, id)));
      if (!row) throw new DomainError('SUGGESTION_NOT_FOUND');
      return [{ cityId: row.cityId, areaId: row.areaId }];
    });
  }

  duplicateCheck(
    request: OwnerRequest,
    input: SuggestionDuplicateCheck,
  ): Promise<SuggestionDuplicateResult> {
    return this.uow.run(async (tx) => {
      await this.suggester(tx, request);
      const category = await this.category(tx, input.categoryId);
      const check = await this.matches(tx, category, input);
      return SuggestionDuplicateResultSchema.parse({
        exact: check.exact,
        exactSubcategory: check.exactSubcategory,
        candidates: check.candidates,
      });
    });
  }

  submit(
    request: CatalogCommand,
    input: SuggestSubcategory,
  ): Promise<Suggestion> {
    return this.commands.run(
      this.command(request, {
        name: 'catalog.suggestion.create',
        method: 'POST',
        resource: '/catalog/subcategory-suggestions',
        successStatus: 201,
        // Owner context is part of the fingerprint: same key, other kind = 409.
        payload: { ...input, businessKind: request.businessKind ?? null },
      }),
      async (tx) => {
        const owner = await this.suggester(tx, request);
        // Category row lock serializes duplicate checks within the category.
        const category = await this.category(tx, input.categoryId, true);
        const check = await this.matches(tx, category, input);
        if (check.exact)
          throw new DomainError('SUGGESTION_DUPLICATE', { field: 'nameEn' });
        if (check.candidates.length && !input.allowSimilar)
          throw new DomainError('SUGGESTION_SIMILARITY_WARNING', {
            field: 'nameEn',
          });
        const id = this.ids.uuidv7();
        if (
          !(await this.suggestions.insert(tx, {
            id,
            businessId: owner.businessId,
            submitterUserId: request.actorId,
            cityId: owner.cityId,
            areaId: owner.areaId,
            categoryId: category.id,
            nameEn: input.nameEn,
            nameHi: input.nameHi ?? null,
            normalizedName: check.normalizedName,
            reason: input.reason ?? null,
            at: this.clock.now(),
          }))
        )
          throw new DomainError('SUGGESTION_DUPLICATE', { field: 'nameEn' });
        const created = (await this.suggestions.find(tx, id))!;
        await this.events.suggestion(
          tx,
          this.eventPayload(created),
          request.correlationId,
        );
        return suggestionDto(created) as Suggestion & JsonValue;
      },
      {
        ...receipt(SuggestionSchema),
        // Replay rechecks the live session and owner capability.
        replay: async (tx, stored) => {
          await this.suggester(tx, request);
          return SuggestionSchema.parse(stored) as Suggestion & JsonValue;
        },
      },
    );
  }

  mine(request: OwnerRequest, query: PageQuery): Promise<SuggestionPage> {
    const binding: CursorBinding = {
      operation: 'catalog.suggestions.mine',
      sort: 'createdAt-id-desc',
      filters: null,
      scope: { actor: request.actorId, revision: 'owner' },
    };
    const after = this.position(query.cursor, binding);
    return this.uow.run(async (tx) => {
      const owner = await this.suggester(tx, request);
      const rows = await this.suggestions.businessPage(tx, {
        businessId: owner.businessId,
        limit: query.limit,
        ...(after ? { after } : {}),
      });
      const items = rows.slice(0, query.limit).map(suggestionDto);
      const last = items.at(-1);
      return SuggestionPageSchema.parse({
        items,
        nextCursor:
          rows.length > query.limit && last
            ? this.cursors.encode(binding, [last.createdAt, last.id])
            : null,
      });
    });
  }

  adminList(
    ctx: AdminReadContext,
    query: AdminSuggestionQuery,
  ): Promise<AdminSuggestionPage> {
    assertCatalogReader(ctx);
    const binding: CursorBinding = {
      operation: 'admin.catalog.suggestions',
      sort: 'createdAt-id',
      filters: { status: query.status },
      scope: { actor: ctx.actorUserId, revision: ctx.scopeRevision },
    };
    const after = this.position(query.cursor, binding);
    return this.uow.run(async (tx) => {
      const rows = await this.suggestions.scopedPage(tx, {
        status: query.status,
        visibility: {
          platformWide: ctx.isSuper || ctx.scope.platformWide,
          cityIds: ctx.scope.cityWideIds,
          areaIds: ctx.scope.areaIds,
        },
        limit: query.limit,
        ...(after ? { after } : {}),
      });
      const page = rows.slice(0, query.limit);
      const items = [];
      for (const row of page)
        items.push({
          ...suggestionDto(row),
          candidates: await this.candidates(
            tx,
            row.categoryId,
            row.normalizedName,
          ),
        });
      const last = page.at(-1);
      return AdminSuggestionPageSchema.parse({
        items,
        nextCursor:
          rows.length > query.limit && last
            ? this.cursors.encode(binding, [last.createdAt, last.id])
            : null,
      });
    });
  }

  decide(
    request: CatalogCommand,
    suggestionId: string,
    input: DecideSuggestion,
  ): Promise<Suggestion> {
    return this.commands.run(
      this.command(request, {
        name: 'admin.catalog.suggestion.decide',
        method: 'POST',
        resource: `/catalog/admin/subcategory-suggestions/${suggestionId}/decision`,
        successStatus: 200,
        payload: input,
      }),
      async (tx) => {
        const found = await this.suggestions.find(tx, suggestionId);
        if (!found) throw new DomainError('SUGGESTION_NOT_FOUND');
        // Lock order: category, then suggestion (same as approval inserts).
        const category = (await this.taxonomy.findCategory(
          tx,
          found.categoryId,
          true,
        ))!;
        const before = (await this.suggestions.find(tx, suggestionId, true))!;
        const actor = await this.reviewer(tx, request, before);
        if (before.version !== input.expectedVersion)
          throw new DomainError('CATALOG_VERSION_CONFLICT');
        if (before.status !== 'pending')
          throw new DomainError('SUGGESTION_STATE_INVALID');
        let subcategoryId: string | null = null;
        let mergedIntoSubcategoryId: string | null = null;
        if (input.action === 'approve') {
          const nameHi = input.approvalNameHi ?? before.nameHi;
          // Never auto-translate or copy English into the Hindi name.
          if (!nameHi)
            throw new DomainError('VALIDATION_ERROR', {
              field: 'approvalNameHi',
            });
          subcategoryId = (
            await this.writer.createSubcategory(tx, {
              category,
              nameEn: before.nameEn,
              nameHi,
              serviceTypes: [],
              imageAssetId: null,
              actor,
              correlationId: request.correlationId,
              duplicate: 'SUGGESTION_DUPLICATE',
            })
          ).id;
        } else if (input.action === 'merge') {
          const target = await this.taxonomy.findSubcategory(
            tx,
            input.targetSubcategoryId,
          );
          if (!target?.active || target.categoryId !== before.categoryId)
            throw new DomainError('SUGGESTION_MERGE_TARGET_INVALID', {
              field: 'targetSubcategoryId',
            });
          mergedIntoSubcategoryId = target.id;
        }
        const status =
          input.action === 'approve'
            ? 'approved'
            : input.action === 'reject'
              ? 'rejected'
              : 'merged';
        if (
          !(await this.suggestions.decide(tx, {
            id: suggestionId,
            expectedVersion: input.expectedVersion,
            status,
            reviewedBy: actor.userId!,
            rejectionReason: input.action === 'reject' ? input.reason : null,
            subcategoryId,
            mergedIntoSubcategoryId,
            at: this.clock.now(),
          }))
        )
          throw new DomainError('CATALOG_VERSION_CONFLICT');
        const after = (await this.suggestions.find(tx, suggestionId))!;
        await this.audit.record(tx, {
          actor,
          action: `catalog.suggestion.${status}`,
          entityType: 'subcategory_suggestion',
          entityId: suggestionId,
          cityId: after.cityId,
          areaId: after.areaId,
          summary: `Subcategory suggestion ${status}`,
          before: suggestionSnapshot(before),
          after: suggestionSnapshot(after),
          fields: SUGGESTION_AUDIT_FIELDS,
          correlationId: request.correlationId,
        });
        await this.events.suggestion(
          tx,
          this.eventPayload(after),
          request.correlationId,
        );
        return suggestionDto(after) as Suggestion & JsonValue;
      },
      {
        ...receipt(SuggestionSchema),
        // Replay rechecks the reviewer's current access to the suggestion.
        replay: async (tx, stored) => {
          const row = await this.suggestions.find(tx, suggestionId);
          if (!row) throw new DomainError('SUGGESTION_NOT_FOUND');
          await this.reviewer(tx, request, row);
          return SuggestionSchema.parse(stored) as Suggestion & JsonValue;
        },
      },
    );
  }

  private command(
    request: CatalogCommand,
    operation: {
      name: string;
      method: 'POST';
      resource: string;
      successStatus: number;
      payload: object;
    },
  ) {
    return this.contexts.create(
      {
        name: operation.name,
        method: operation.method,
        scope: 'principal',
        successStatus: operation.successStatus,
      },
      {
        actorId: request.actorId,
        correlationId: request.correlationId,
        resource: operation.resource,
        business: null,
        expiresAt: new Date(this.clock.now().getTime() + RECEIPT_TTL_MS),
      },
      {
        key: request.key,
        payload: JSON.parse(JSON.stringify(operation.payload)) as JsonValue,
      },
    );
  }

  /** Live session + trusted owned business with the suggest capability. */
  private async suggester(
    tx: TxContext,
    request: OwnerRequest,
  ): Promise<SuggesterContext> {
    const principal = await this.sessions.requirePrincipal(tx, request.session);
    if (principal.userId !== request.actorId)
      throw new DomainError('SESSION_EXPIRED');
    return this.business.resolveSuggester(tx, {
      userId: principal.userId,
      ...(request.businessKind ? { businessKind: request.businessKind } : {}),
    });
  }

  /**
   * In-transaction reviewer check: live session, admin/super_admin role and
   * `catalog:edit` over the suggestion's stored city/area.
   */
  private async reviewer(
    tx: TxContext,
    request: CatalogCommand,
    suggestion: StoredSuggestion,
  ): Promise<AuditActor & { userId: string }> {
    const principal = await this.sessions.requirePrincipal(tx, request.session);
    if (
      principal.userId !== request.actorId ||
      !principal.roles.some(
        (role) => role === 'admin' || role === 'super_admin',
      )
    )
      throw new DomainError('COMMON_FORBIDDEN');
    const scopes: ScopeRef[] = [
      { cityId: suggestion.cityId, areaId: suggestion.areaId },
    ];
    let ctx: AdminReadContext;
    try {
      ctx = await this.adminScope.authorize(
        {
          actorUserId: principal.userId,
          module: 'catalog',
          action: 'edit',
          scopes,
        },
        tx,
      );
    } catch (error) {
      if (
        error instanceof DomainError &&
        error.code === 'ADMIN_SCOPE_FORBIDDEN'
      )
        throw new DomainError('SUGGESTION_SCOPE_DENIED');
      throw error;
    }
    const [profile] = await this.identity.describe(tx, [principal.userId]);
    return {
      userId: principal.userId,
      role: ctx.isSuper ? 'super_admin' : 'admin',
      label: profile?.displayName ?? (ctx.isSuper ? 'Super admin' : 'Admin'),
    };
  }

  private async category(
    tx: TxContext,
    categoryId: string,
    lock = false,
  ): Promise<StoredCategory> {
    const category = await this.taxonomy.findCategory(tx, categoryId, lock);
    if (!category?.active)
      throw new DomainError('CATEGORY_NOT_FOUND', { field: 'categoryId' });
    return category;
  }

  /** Exact normalized EN/HI duplicates and ranked fuzzy candidates. */
  private async matches(
    tx: TxContext,
    category: StoredCategory,
    input: { nameEn: string; nameHi?: string | undefined },
  ): Promise<{
    normalizedName: string;
    exact: boolean;
    exactSubcategory: SuggestionCandidate | null;
    candidates: SuggestionCandidate[];
  }> {
    const names = await this.writer.normalize(tx, [
      input.nameEn,
      ...(input.nameHi ? [input.nameHi] : []),
    ]);
    const normalizedName = names[0]!;
    const existing = await this.taxonomy.findSubcategoryClash(tx, {
      categoryId: category.id,
      normalizedNames: names,
    });
    const pending = existing
      ? null
      : await this.suggestions.findPendingByName(tx, category.id, names);
    const candidates = await this.candidates(tx, category.id, normalizedName);
    return {
      normalizedName,
      exact: Boolean(existing ?? pending),
      exactSubcategory: existing
        ? {
            subcategoryId: existing.id,
            slug: existing.slug,
            nameEn: existing.nameEn,
            nameHi: existing.nameHi,
            similarity: 1,
          }
        : null,
      candidates: existing
        ? candidates.filter((item) => item.subcategoryId !== existing.id)
        : candidates,
    };
  }

  private async candidates(
    tx: TxContext,
    categoryId: string,
    normalizedName: string,
  ): Promise<SuggestionCandidate[]> {
    const rows = await this.taxonomy.similarSubcategories(
      tx,
      categoryId,
      normalizedName,
      SUGGESTION_CANDIDATE_LIMIT,
    );
    return rows.map((row) => ({
      subcategoryId: row.id,
      slug: row.slug,
      nameEn: row.nameEn,
      nameHi: row.nameHi,
      similarity: Math.min(1, Math.max(0, Number(row.similarity))),
    }));
  }

  private position(
    cursor: string | undefined,
    binding: CursorBinding,
  ): SuggestionPosition | undefined {
    if (!cursor) return undefined;
    const parsed = positionSchema.safeParse(
      this.cursors.decode(cursor, binding),
    );
    if (!parsed.success)
      throw new DomainError('VALIDATION_ERROR', { field: 'cursor' });
    return { createdAt: parsed.data[0], id: parsed.data[1] };
  }

  private eventPayload(row: StoredSuggestion) {
    return {
      suggestionId: row.id,
      categoryId: row.categoryId,
      businessId: row.businessId,
      submitterUserId: row.submitterUserId,
      cityId: row.cityId,
      areaId: row.areaId,
      status: row.status,
      version: row.version,
      subcategoryId: row.subcategoryId,
      mergedIntoSubcategoryId: row.mergedIntoSubcategoryId,
    };
  }
}
