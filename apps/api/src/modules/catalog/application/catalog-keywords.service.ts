import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  KeywordMappingDeletedSchema,
  KeywordMappingPageSchema,
  KeywordMappingSchema,
  type CreateKeywordMapping,
  type ExpectedVersionBody,
  type KeywordMapping,
  type KeywordMappingDeleted,
  type KeywordMappingPage,
  type KeywordTarget,
  type KeywordTargetInput,
  type UpdateKeywordMapping,
} from '@apnatown/shared/catalog';
import { IdSchema, type PageQuery } from '@apnatown/shared/wire';
import { z } from 'zod';
import type { AdminReadContext } from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import {
  CURSOR_CODEC,
  CursorCodec,
  type CursorBinding,
} from '../../../shared/pagination/cursor';
import {
  UNIT_OF_WORK,
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
  AdminCommands,
  type AdminCommand,
  type SuperActor,
} from '../../admin/application/admin-command';
import {
  AUDIT_WRITER,
  type AuditSnapshot,
  type AuditWriter,
} from '../../audit/application/audit-writer.port';
import {
  KEYWORD_MAPPING_REPOSITORY,
  TAXONOMY_REPOSITORY,
  type KeywordMappingRepository,
  type KeywordTermRow,
  type StoredKeywordMapping,
  type TaxonomyRepository,
} from '../domain/catalog.repository';
import { CatalogEvents } from './catalog-events';
import { receipt } from './catalog-mappers';
import { assertCatalogReader } from './catalog-taxonomy.service';
import { TaxonomyWriter } from './taxonomy-writer';

const positionSchema = z.tuple([IdSchema]);
const MAPPING_AUDIT_FIELDS = [
  'canonicalTerm',
  'synonyms',
  'targets',
  'enabled',
  'version',
] as const;

function mappingDto(row: StoredKeywordMapping): KeywordMapping {
  return KeywordMappingSchema.parse({
    id: row.id,
    canonicalTerm: row.canonicalTerm,
    synonyms: row.synonyms,
    targets: row.targets,
    enabled: row.enabled,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function mappingSnapshot(row: StoredKeywordMapping): AuditSnapshot {
  return {
    canonicalTerm: row.canonicalTerm,
    synonyms: row.synonyms,
    targets: row.targets as JsonValue,
    enabled: row.enabled,
    version: row.version,
  };
}

const targetKey = (target: KeywordTarget) =>
  target.kind === 'category'
    ? `c:${target.categoryId}`
    : target.kind === 'subcategory'
      ? `s:${target.subcategoryId}`
      : `t:${target.productTag}`;

/**
 * Search keyword mappings (F-AD-015, F-SA-008): one primary term plus
 * EN/HI/Hinglish/typo variants, each an indexed normalized term row, with
 * typed category/subcategory/product-tag targets. Reads need catalog:view
 * (or super_admin); writes are super_admin only until Q-39 is resolved.
 */
@Injectable()
export class CatalogKeywordsService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(KEYWORD_MAPPING_REPOSITORY)
    private readonly mappings: KeywordMappingRepository,
    @Inject(TAXONOMY_REPOSITORY)
    private readonly taxonomy: TaxonomyRepository,
    @Inject(AUDIT_WRITER) private readonly audit: AuditWriter,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    private readonly commands: AdminCommands,
    private readonly writer: TaxonomyWriter,
    private readonly events: CatalogEvents,
  ) {}

  async list(
    ctx: AdminReadContext,
    query: PageQuery,
  ): Promise<KeywordMappingPage> {
    assertCatalogReader(ctx);
    const binding: CursorBinding = {
      operation: 'admin.catalog.keyword-mappings',
      sort: 'id',
      filters: null,
      scope: { actor: ctx.actorUserId, revision: ctx.scopeRevision },
    };
    let afterId: string | undefined;
    if (query.cursor) {
      const parsed = positionSchema.safeParse(
        this.cursors.decode(query.cursor, binding),
      );
      if (!parsed.success)
        throw new DomainError('VALIDATION_ERROR', { field: 'cursor' });
      afterId = parsed.data[0];
    }
    const rows = await this.uow.run((tx) =>
      this.mappings.page(tx, {
        limit: query.limit,
        ...(afterId ? { afterId } : {}),
      }),
    );
    const items = rows.slice(0, query.limit).map(mappingDto);
    const last = items.at(-1);
    return KeywordMappingPageSchema.parse({
      items,
      nextCursor:
        rows.length > query.limit && last
          ? this.cursors.encode(binding, [last.id])
          : null,
    });
  }

  create(
    command: AdminCommand,
    input: CreateKeywordMapping,
  ): Promise<KeywordMapping> {
    return this.commands.run(
      command,
      {
        name: 'super-admin.catalog.keyword-mapping.create',
        method: 'POST',
        resource: '/catalog/admin/keyword-mappings',
        successStatus: 201,
      },
      input,
      async (tx, actor) => {
        const id = this.ids.uuidv7();
        const at = this.clock.now();
        const terms = await this.terms(tx, input.canonicalTerm, input.synonyms);
        const targets = await this.targets(tx, input.targets);
        await this.assertTermsFree(tx, terms);
        await this.mappings.insert(tx, { id, at });
        await this.saveTerms(tx, id, terms, at);
        await this.saveTargets(tx, id, targets);
        const created = (await this.mappings.find(tx, id))!;
        await this.record(tx, actor, command, 'created', null, created);
        return mappingDto(created) as KeywordMapping & JsonValue;
      },
      receipt(KeywordMappingSchema),
    );
  }

  update(
    command: AdminCommand,
    mappingId: string,
    input: UpdateKeywordMapping,
  ): Promise<KeywordMapping> {
    return this.commands.run(
      command,
      {
        name: 'super-admin.catalog.keyword-mapping.update',
        method: 'PATCH',
        resource: `/catalog/admin/keyword-mappings/${mappingId}`,
        successStatus: 200,
      },
      input,
      async (tx, actor) => {
        const before = await this.lock(tx, mappingId, input.expectedVersion);
        const at = this.clock.now();
        if (input.canonicalTerm !== undefined || input.synonyms !== undefined) {
          const terms = await this.terms(
            tx,
            input.canonicalTerm ?? before.canonicalTerm,
            input.synonyms ?? before.synonyms,
          );
          await this.assertTermsFree(tx, terms, mappingId);
          await this.saveTerms(tx, mappingId, terms, at);
        }
        if (input.targets !== undefined)
          await this.saveTargets(
            tx,
            mappingId,
            await this.targets(tx, input.targets),
          );
        if (
          !(await this.mappings.touch(tx, {
            id: mappingId,
            expectedVersion: input.expectedVersion,
            at,
          }))
        )
          throw new DomainError('CATALOG_VERSION_CONFLICT');
        const after = (await this.mappings.find(tx, mappingId))!;
        await this.record(tx, actor, command, 'updated', before, after);
        return mappingDto(after) as KeywordMapping & JsonValue;
      },
      receipt(KeywordMappingSchema),
    );
  }

  remove(
    command: AdminCommand,
    mappingId: string,
    input: ExpectedVersionBody,
  ): Promise<KeywordMappingDeleted> {
    return this.commands.run(
      command,
      {
        name: 'super-admin.catalog.keyword-mapping.delete',
        method: 'DELETE',
        resource: `/catalog/admin/keyword-mappings/${mappingId}`,
        successStatus: 200,
      },
      input,
      async (tx, actor) => {
        const before = await this.lock(tx, mappingId, input.expectedVersion);
        if (
          !(await this.mappings.delete(tx, {
            id: mappingId,
            expectedVersion: input.expectedVersion,
          }))
        )
          throw new DomainError('CATALOG_VERSION_CONFLICT');
        await this.record(tx, actor, command, 'deleted', before, null);
        return KeywordMappingDeletedSchema.parse({
          id: mappingId,
          deleted: true,
        }) as KeywordMappingDeleted & JsonValue;
      },
      receipt(KeywordMappingDeletedSchema),
    );
  }

  private async lock(
    tx: TxContext,
    mappingId: string,
    expectedVersion: number,
  ): Promise<StoredKeywordMapping> {
    const mapping = await this.mappings.find(tx, mappingId, true);
    if (!mapping) throw new DomainError('KEYWORD_MAPPING_NOT_FOUND');
    if (mapping.version !== expectedVersion)
      throw new DomainError('CATALOG_VERSION_CONFLICT');
    return mapping;
  }

  /** One primary + synonyms; normalized forms must be distinct and non-empty. */
  private async terms(
    tx: TxContext,
    canonicalTerm: string,
    synonyms: readonly string[],
  ): Promise<KeywordTermRow[]> {
    const raw = [canonicalTerm, ...synonyms].map((term) => term.trim());
    const normalized = await this.writer.normalize(tx, raw);
    if (
      normalized.some((term) => !term) ||
      new Set(normalized).size !== normalized.length
    )
      throw new DomainError('VALIDATION_ERROR', { field: 'synonyms' });
    return raw.map((term, index) => ({
      term,
      normalizedTerm: normalized[index]!,
      kind: index === 0 ? 'primary' : 'synonym',
    }));
  }

  private async assertTermsFree(
    tx: TxContext,
    terms: readonly KeywordTermRow[],
    excludeMappingId?: string,
  ): Promise<void> {
    const taken = await this.mappings.takenTerms(
      tx,
      terms.map((term) => term.normalizedTerm),
      excludeMappingId,
    );
    if (taken.length)
      throw new DomainError('KEYWORD_MAPPING_CONFLICT', { field: 'synonyms' });
  }

  private async saveTerms(
    tx: TxContext,
    mappingId: string,
    terms: readonly KeywordTermRow[],
    at: Date,
  ): Promise<void> {
    if (
      !(await this.mappings.replaceTerms(tx, {
        mappingId,
        terms: terms.map((term) => ({ ...term, id: this.ids.uuidv7() })),
        at,
      }))
    )
      // A concurrent mapping claimed one of the normalized terms.
      throw new DomainError('KEYWORD_MAPPING_CONFLICT', { field: 'synonyms' });
  }

  private saveTargets(
    tx: TxContext,
    mappingId: string,
    targets: readonly KeywordTarget[],
  ): Promise<void> {
    return this.mappings.replaceTargets(tx, {
      mappingId,
      targets: targets.map((target) => ({ ...target, id: this.ids.uuidv7() })),
    });
  }

  /** Active catalog targets; product tags are normalized text targets. */
  private async targets(
    tx: TxContext,
    input: readonly KeywordTargetInput[],
  ): Promise<KeywordTarget[]> {
    const tags = input.flatMap((target) =>
      target.kind === 'product_tag' ? [target.productTag] : [],
    );
    const normalizedTags = await this.writer.normalize(tx, tags);
    let tagIndex = 0;
    const targets: KeywordTarget[] = input.map((target) =>
      target.kind === 'product_tag'
        ? { kind: 'product_tag', productTag: normalizedTags[tagIndex++]! }
        : target,
    );
    if (
      targets.some(
        (target) => target.kind === 'product_tag' && !target.productTag,
      ) ||
      new Set(targets.map(targetKey)).size !== targets.length
    )
      throw new DomainError('VALIDATION_ERROR', { field: 'targets' });
    const categoryIds = targets.flatMap((target) =>
      target.kind === 'category' ? [target.categoryId] : [],
    );
    const subcategoryIds = targets.flatMap((target) =>
      target.kind === 'subcategory' ? [target.subcategoryId] : [],
    );
    const [categories, subcategories] = await Promise.all([
      categoryIds.length
        ? this.taxonomy.listCategories(tx, {
            activeOnly: true,
            ids: categoryIds,
          })
        : [],
      subcategoryIds.length
        ? this.taxonomy.listSubcategories(tx, {
            activeOnly: true,
            ids: subcategoryIds,
          })
        : [],
    ]);
    if (
      categories.length !== categoryIds.length ||
      subcategories.length !== subcategoryIds.length
    )
      throw new DomainError('KEYWORD_TARGET_INVALID', { field: 'targets' });
    return targets;
  }

  private async record(
    tx: TxContext,
    actor: SuperActor,
    command: AdminCommand,
    change: 'created' | 'updated' | 'deleted',
    before: StoredKeywordMapping | null,
    after: StoredKeywordMapping | null,
  ): Promise<void> {
    const mapping = (after ?? before)!;
    await this.audit.record(tx, {
      actor,
      action: `catalog.keyword_mapping.${change}`,
      entityType: 'keyword_mapping',
      entityId: mapping.id,
      summary: `Keyword mapping ${change}`,
      before: before ? mappingSnapshot(before) : null,
      after: after ? mappingSnapshot(after) : null,
      fields: MAPPING_AUDIT_FIELDS,
      correlationId: command.correlationId,
    });
    await this.events.keywordMappingChanged(
      tx,
      {
        mappingId: mapping.id,
        change,
        version: after ? after.version : mapping.version + 1,
      },
      command.correlationId,
    );
  }
}
