import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  AdminHomeSectionListSchema,
  AdminHomeSectionSchema,
  CATALOG_HOME_SECTION_LIMIT,
  CatalogHomeSectionSchema,
  HomeSectionRemovedSchema,
  type AdminHomeSection,
  type AdminHomeSectionList,
  type CatalogHomeSection,
  type CreateHomeSection,
  type ExpectedVersionBody,
  type HomeSectionRemoved,
  type HomeSectionStatus,
  type UpdateHomeSection,
} from '@apnatown/shared/catalog';
import type { AdminReadContext } from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
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
  HOME_SECTION_REPOSITORY,
  TAXONOMY_REPOSITORY,
  type HomeSectionContent,
  type HomeSectionRepository,
  type StoredCategory,
  type StoredHomeSection,
  type StoredSubcategory,
  type TaxonomyRepository,
} from '../domain/catalog.repository';
import { CatalogEvents } from './catalog-events';
import {
  categoryDto,
  imagesFor,
  receipt,
  subcategoryDto,
} from './catalog-mappers';
import {
  CATALOG_MEDIA_ASSETS,
  type CatalogHomeReadPort,
  type CatalogMediaAssetPort,
} from './catalog-ports';

const SECTION_AUDIT_FIELDS = [
  'kind',
  'contentKind',
  'categoryId',
  'headingEn',
  'headingHi',
  'supportingTextEn',
  'supportingTextHi',
  'categories',
  'initialCategoryId',
  'position',
  'active',
  'removed',
  'version',
] as const;
type SectionChange =
  'created' | 'updated' | 'activated' | 'deactivated' | 'removed';

function sectionDto(row: StoredHomeSection): AdminHomeSection {
  return AdminHomeSectionSchema.parse({
    id: row.id,
    kind: row.kind,
    contentKind: row.contentKind,
    categoryId: row.categoryId,
    headingEn: row.headingEn,
    headingHi: row.headingHi,
    supportingTextEn: row.supportingTextEn,
    supportingTextHi: row.supportingTextHi,
    categories: row.categories,
    initialCategoryId: row.initialCategoryId,
    position: row.position,
    active: row.active,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function sectionSnapshot(row: StoredHomeSection): AuditSnapshot {
  return {
    kind: row.kind,
    contentKind: row.contentKind,
    categoryId: row.categoryId,
    headingEn: row.headingEn,
    headingHi: row.headingHi,
    supportingTextEn: row.supportingTextEn,
    supportingTextHi: row.supportingTextHi,
    categories: row.categories.map((pill) => ({
      categoryId: pill.categoryId,
      position: pill.position,
    })),
    initialCategoryId: row.initialCategoryId,
    position: row.position,
    active: row.active,
    removed: row.removedAt !== null,
    version: row.version,
  };
}

const invalid = (field: string) =>
  new DomainError('CATALOG_HOME_SECTION_INVALID', { field });

/**
 * Super-admin Home sections (F-HM-003/004): `single_category` and
 * `curated_categories` only, no scheduling/page-builder fields. POST creates
 * an inactive draft; activation is an explicit status command that rechecks
 * the active category/subcategory set. Also serves CatalogHomeReadPort.
 */
@Injectable()
export class CatalogHomeSectionsService implements CatalogHomeReadPort {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(HOME_SECTION_REPOSITORY)
    private readonly sections: HomeSectionRepository,
    @Inject(TAXONOMY_REPOSITORY)
    private readonly taxonomy: TaxonomyRepository,
    @Inject(CATALOG_MEDIA_ASSETS)
    private readonly media: CatalogMediaAssetPort,
    @Inject(AUDIT_WRITER) private readonly audit: AuditWriter,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    private readonly commands: AdminCommands,
    private readonly events: CatalogEvents,
  ) {}

  list(input: {
    at: Date;
    locale: 'en' | 'hi';
  }): Promise<CatalogHomeSection[]> {
    // No validity windows exist (spec: no scheduling); `at` is the read time.
    return this.uow.run(async (tx) => {
      const sections = await this.sections.list(tx, {
        activeOnly: true,
        limit: CATALOG_HOME_SECTION_LIMIT,
      });
      const categoryIds = [
        ...new Set(
          sections.flatMap((section) => [
            ...(section.categoryId ? [section.categoryId] : []),
            ...section.categories.map((pill) => pill.categoryId),
          ]),
        ),
      ];
      if (!categoryIds.length) return [];
      const [categories, subcategories] = await Promise.all([
        this.taxonomy.listCategories(tx, {
          activeOnly: true,
          ids: categoryIds,
        }),
        this.taxonomy.listSubcategories(tx, { activeOnly: true, categoryIds }),
      ]);
      const images = await imagesFor(this.media, tx, [
        ...categories,
        ...subcategories,
      ]);
      const byId = new Map(categories.map((row) => [row.id, row]));
      const childrenOf = (id: string) =>
        subcategories
          .filter((row) => row.categoryId === id)
          .map((row) => subcategoryDto(row, images));
      const text = (en: string | null, hi: string | null) =>
        (input.locale === 'hi' ? hi : en) ?? null;
      const result: CatalogHomeSection[] = [];
      for (const section of sections) {
        if (section.kind === 'single_category') {
          const category = byId.get(section.categoryId!);
          const children = category ? childrenOf(category.id) : [];
          if (!category || !children.length) continue;
          result.push(
            CatalogHomeSectionSchema.parse({
              id: section.id,
              kind: section.kind,
              contentKind: section.contentKind,
              category: categoryDto(category, images),
              heading:
                input.locale === 'hi' ? category.nameHi : category.nameEn,
              supportingText: text(
                section.supportingTextEn,
                section.supportingTextHi,
              ),
              subcategories: children,
              position: section.position,
            }),
          );
          continue;
        }
        const pills = section.categories.flatMap((pill) => {
          const category = byId.get(pill.categoryId);
          return category
            ? [
                {
                  category: categoryDto(category, images),
                  position: pill.position,
                  subcategories: childrenOf(category.id),
                },
              ]
            : [];
        });
        if (!pills.length) continue;
        result.push(
          CatalogHomeSectionSchema.parse({
            id: section.id,
            kind: section.kind,
            contentKind: section.contentKind,
            heading: text(section.headingEn, section.headingHi),
            supportingText: text(
              section.supportingTextEn,
              section.supportingTextHi,
            ),
            categories: pills,
            // Inactive initial pill: the first remaining active pill.
            initialCategoryId: pills.some(
              (pill) => pill.category.id === section.initialCategoryId,
            )
              ? section.initialCategoryId
              : pills[0]!.category.id,
            position: section.position,
          }),
        );
      }
      return result;
    });
  }

  adminList(ctx: AdminReadContext): Promise<AdminHomeSectionList> {
    if (!ctx.isSuper) throw new DomainError('COMMON_FORBIDDEN');
    return this.uow.run(async (tx) =>
      AdminHomeSectionListSchema.parse({
        items: (
          await this.sections.list(tx, {
            activeOnly: false,
            limit: CATALOG_HOME_SECTION_LIMIT,
          })
        ).map(sectionDto),
      }),
    );
  }

  create(
    command: AdminCommand,
    input: CreateHomeSection,
  ): Promise<AdminHomeSection> {
    return this.commands.run(
      command,
      {
        name: 'super-admin.catalog.home-section.create',
        method: 'POST',
        resource: '/catalog/admin/home-sections',
        successStatus: 201,
      },
      input,
      async (tx, actor) => {
        const content: HomeSectionContent =
          input.kind === 'single_category'
            ? {
                categoryId: input.categoryId,
                headingEn: null,
                headingHi: null,
                supportingTextEn: input.supportingTextEn ?? null,
                supportingTextHi: input.supportingTextHi ?? null,
                initialCategoryId: null,
                position: input.position,
                categories: [],
              }
            : {
                categoryId: null,
                headingEn: input.headingEn,
                headingHi: input.headingHi,
                supportingTextEn: input.supportingTextEn ?? null,
                supportingTextHi: input.supportingTextHi ?? null,
                initialCategoryId: input.initialCategoryId,
                position: input.position,
                categories: input.categories,
              };
        await this.validate(tx, input.kind, input.contentKind, content);
        const id = this.ids.uuidv7();
        if (
          !(await this.sections.insert(tx, {
            ...content,
            id,
            kind: input.kind,
            contentKind: input.contentKind,
            actorId: actor.userId,
            at: this.clock.now(),
          }))
        )
          throw new DomainError('CATALOG_HOME_SECTION_CONFLICT', {
            field: 'categoryId',
          });
        const created = (await this.sections.find(tx, id))!;
        await this.record(tx, actor, command, 'created', null, created);
        return sectionDto(created) as AdminHomeSection & JsonValue;
      },
      receipt(AdminHomeSectionSchema),
    );
  }

  update(
    command: AdminCommand,
    sectionId: string,
    input: UpdateHomeSection,
  ): Promise<AdminHomeSection> {
    return this.commands.run(
      command,
      {
        name: 'super-admin.catalog.home-section.update',
        method: 'PATCH',
        resource: `/catalog/admin/home-sections/${sectionId}`,
        successStatus: 200,
      },
      input,
      async (tx, actor) => {
        const before = await this.lock(tx, sectionId, input.expectedVersion);
        const single = before.kind === 'single_category';
        // `kind`/`contentKind` are immutable; fields must fit the stored kind.
        if (single) {
          for (const field of [
            'headingEn',
            'headingHi',
            'categories',
            'initialCategoryId',
          ] as const)
            if (input[field] !== undefined) throw invalid(field);
        } else if (input.categoryId !== undefined) throw invalid('categoryId');
        const content: HomeSectionContent = {
          categoryId: input.categoryId ?? before.categoryId,
          headingEn: input.headingEn ?? before.headingEn,
          headingHi: input.headingHi ?? before.headingHi,
          supportingTextEn:
            input.supportingTextEn !== undefined
              ? input.supportingTextEn
              : before.supportingTextEn,
          supportingTextHi:
            input.supportingTextHi !== undefined
              ? input.supportingTextHi
              : before.supportingTextHi,
          initialCategoryId:
            input.initialCategoryId ?? before.initialCategoryId,
          position: input.position ?? before.position,
          categories: input.categories ?? before.categories,
        };
        await this.validate(tx, before.kind, before.contentKind, content);
        // A live section never loses eligibility through an edit.
        if (before.active && !(await this.eligible(tx, before.kind, content)))
          throw invalid('categories');
        const outcome = await this.sections.update(tx, {
          ...content,
          id: sectionId,
          expectedVersion: input.expectedVersion,
          actorId: actor.userId,
          at: this.clock.now(),
        });
        if (outcome === 'conflict')
          throw new DomainError('CATALOG_HOME_SECTION_CONFLICT', {
            field: 'categoryId',
          });
        if (outcome === 'stale')
          throw new DomainError('CATALOG_VERSION_CONFLICT');
        const after = (await this.sections.find(tx, sectionId))!;
        await this.record(tx, actor, command, 'updated', before, after);
        return sectionDto(after) as AdminHomeSection & JsonValue;
      },
      receipt(AdminHomeSectionSchema),
    );
  }

  setStatus(
    command: AdminCommand,
    sectionId: string,
    input: HomeSectionStatus,
  ): Promise<AdminHomeSection> {
    return this.commands.run(
      command,
      {
        name: 'super-admin.catalog.home-section.status',
        method: 'POST',
        resource: `/catalog/admin/home-sections/${sectionId}/status`,
        successStatus: 200,
      },
      input,
      async (tx, actor) => {
        const before = await this.lock(tx, sectionId, input.expectedVersion);
        const activate = input.event === 'activate';
        if (before.active === activate)
          throw new DomainError('CATALOG_HOME_SECTION_STATE_INVALID', {
            field: 'event',
          });
        if (activate) {
          // Recheck stored content and the live taxonomy before publishing.
          await this.validate(tx, before.kind, before.contentKind, before);
          if (!(await this.eligible(tx, before.kind, before)))
            throw new DomainError('CATALOG_HOME_SECTION_STATE_INVALID', {
              field: 'event',
            });
        }
        if (
          !(await this.sections.setState(tx, {
            id: sectionId,
            expectedVersion: input.expectedVersion,
            active: activate,
            removed: false,
            actorId: actor.userId,
            at: this.clock.now(),
          }))
        )
          throw new DomainError('CATALOG_VERSION_CONFLICT');
        const after = (await this.sections.find(tx, sectionId))!;
        await this.record(
          tx,
          actor,
          command,
          activate ? 'activated' : 'deactivated',
          before,
          after,
        );
        return sectionDto(after) as AdminHomeSection & JsonValue;
      },
      receipt(AdminHomeSectionSchema),
    );
  }

  remove(
    command: AdminCommand,
    sectionId: string,
    input: ExpectedVersionBody,
  ): Promise<HomeSectionRemoved> {
    return this.commands.run(
      command,
      {
        name: 'super-admin.catalog.home-section.remove',
        method: 'DELETE',
        resource: `/catalog/admin/home-sections/${sectionId}`,
        successStatus: 200,
      },
      input,
      async (tx, actor) => {
        const before = await this.lock(tx, sectionId, input.expectedVersion);
        if (
          !(await this.sections.setState(tx, {
            id: sectionId,
            expectedVersion: input.expectedVersion,
            active: false,
            removed: true,
            actorId: actor.userId,
            at: this.clock.now(),
          }))
        )
          throw new DomainError('CATALOG_VERSION_CONFLICT');
        const after: StoredHomeSection = {
          ...before,
          active: false,
          removedAt: this.clock.now().toISOString(),
          version: before.version + 1,
        };
        await this.record(tx, actor, command, 'removed', before, after);
        return HomeSectionRemovedSchema.parse({
          id: sectionId,
          removed: true,
          version: after.version,
        }) as HomeSectionRemoved & JsonValue;
      },
      receipt(HomeSectionRemovedSchema),
    );
  }

  private async lock(
    tx: TxContext,
    sectionId: string,
    expectedVersion: number,
  ): Promise<StoredHomeSection> {
    const section = await this.sections.find(tx, sectionId, true);
    if (!section) throw new DomainError('CATALOG_HOME_SECTION_NOT_FOUND');
    if (section.version !== expectedVersion)
      throw new DomainError('CATALOG_VERSION_CONFLICT');
    return section;
  }

  /** Shape rules: existing same-kind categories; curated initial is linked. */
  private async validate(
    tx: TxContext,
    kind: StoredHomeSection['kind'],
    contentKind: StoredHomeSection['contentKind'],
    content: HomeSectionContent,
  ): Promise<void> {
    if (
      (content.supportingTextEn === null) !==
      (content.supportingTextHi === null)
    )
      throw invalid('supportingTextHi');
    if (kind === 'single_category') {
      const [category] = await this.taxonomy.listCategories(tx, {
        activeOnly: false,
        ids: [content.categoryId!],
      });
      if (category?.kind !== contentKind) throw invalid('categoryId');
      return;
    }
    if (!content.headingEn || !content.headingHi) throw invalid('headingHi');
    const ids = content.categories.map((pill) => pill.categoryId);
    if (!ids.length) throw invalid('categories');
    const categories = await this.taxonomy.listCategories(tx, {
      activeOnly: false,
      ids,
    });
    if (
      categories.length !== ids.length ||
      categories.some((category) => category.kind !== contentKind)
    )
      throw invalid('categories');
    if (!content.initialCategoryId || !ids.includes(content.initialCategoryId))
      throw invalid('initialCategoryId');
  }

  /**
   * Publishable now: a dedicated section needs an active category with an
   * active subcategory; a curated one needs at least one such linked pill.
   */
  private async eligible(
    tx: TxContext,
    kind: StoredHomeSection['kind'],
    content: HomeSectionContent,
  ): Promise<boolean> {
    const ids =
      kind === 'single_category'
        ? [content.categoryId!]
        : content.categories.map((pill) => pill.categoryId);
    const [categories, subcategories]: [StoredCategory[], StoredSubcategory[]] =
      await Promise.all([
        this.taxonomy.listCategories(tx, { activeOnly: true, ids }),
        this.taxonomy.listSubcategories(tx, {
          activeOnly: true,
          categoryIds: ids,
        }),
      ]);
    return categories.some((category) =>
      subcategories.some((row) => row.categoryId === category.id),
    );
  }

  private async record(
    tx: TxContext,
    actor: SuperActor,
    command: AdminCommand,
    change: SectionChange,
    before: StoredHomeSection | null,
    after: StoredHomeSection,
  ): Promise<void> {
    await this.audit.record(tx, {
      actor,
      action: `catalog.home_section.${change}`,
      entityType: 'catalog_home_section',
      entityId: after.id,
      summary: `Home section ${change}`,
      before: before ? sectionSnapshot(before) : null,
      after: sectionSnapshot(after),
      fields: SECTION_AUDIT_FIELDS,
      correlationId: command.correlationId,
    });
    await this.events.homeSectionsChanged(
      tx,
      { sectionId: after.id, change, version: after.version },
      command.correlationId,
    );
  }
}
