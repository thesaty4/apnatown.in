import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  AdminCategorySchema,
  AdminCategoryTreeSchema,
  AdminSubcategorySchema,
  CategoryDetailSchema,
  CategoryListSchema,
  SubcategoryDetailSchema,
  type AdminCategory,
  type AdminCategoryTree,
  type AdminSubcategory,
  type CategoryDetail,
  type CategoryKind,
  type CategoryList,
  type CreateCategory,
  type CreateSubcategory,
  type SubcategoryDetail,
  type UpdateCategory,
  type UpdateSubcategory,
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
} from '../../admin/application/admin-command';
import {
  AUDIT_WRITER,
  type AuditWriter,
} from '../../audit/application/audit-writer.port';
import {
  TAXONOMY_REPOSITORY,
  type StoredCategory,
  type TaxonomyRepository,
} from '../domain/catalog.repository';
import { CatalogEvents } from './catalog-events';
import {
  CATEGORY_AUDIT_FIELDS,
  SUBCATEGORY_AUDIT_FIELDS,
  adminCategoryDto,
  adminSubcategoryDto,
  categoryDto,
  categorySnapshot,
  imagesFor,
  receipt,
  subcategoryDto,
  subcategorySnapshot,
} from './catalog-mappers';
import {
  CATALOG_MEDIA_ASSETS,
  type CatalogMediaAssetPort,
} from './catalog-ports';
import { TaxonomyWriter } from './taxonomy-writer';

/** Admin readers need catalog:view (guard) and an active assigned scope. */
export function assertCatalogReader(ctx: AdminReadContext): void {
  if (ctx.isSuper) return;
  if (
    ctx.permission?.module !== 'catalog' ||
    !(
      ctx.scope.platformWide ||
      ctx.scope.cityWideIds.length ||
      ctx.scope.areaIds.length
    )
  )
    throw new DomainError('COMMON_FORBIDDEN');
}

/**
 * Categories and subcategories: public active reads, the admin tree and
 * super-admin-only writes (BR-07; direct subcategory edits pending Q-39).
 * Each write commits the row, one audit entry and `catalog.taxonomy.changed`.
 */
@Injectable()
export class CatalogTaxonomyService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(TAXONOMY_REPOSITORY)
    private readonly taxonomy: TaxonomyRepository,
    @Inject(CATALOG_MEDIA_ASSETS)
    private readonly media: CatalogMediaAssetPort,
    @Inject(AUDIT_WRITER) private readonly audit: AuditWriter,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    private readonly commands: AdminCommands,
    private readonly writer: TaxonomyWriter,
    private readonly events: CatalogEvents,
  ) {}

  listCategories(kind?: CategoryKind): Promise<CategoryList> {
    return this.uow.run(async (tx) => {
      const rows = await this.taxonomy.listCategories(tx, {
        activeOnly: true,
        ...(kind ? { kind } : {}),
      });
      const images = await imagesFor(this.media, tx, rows);
      return CategoryListSchema.parse({
        items: rows.map((row) => categoryDto(row, images)),
      });
    });
  }

  category(slug: string): Promise<CategoryDetail> {
    return this.uow.run(async (tx) => {
      const category = await this.taxonomy.findCategoryBySlug(tx, slug);
      if (!category?.active) throw new DomainError('CATEGORY_NOT_FOUND');
      const subcategories = await this.taxonomy.listSubcategories(tx, {
        activeOnly: true,
        categoryIds: [category.id],
      });
      const images = await imagesFor(this.media, tx, [
        category,
        ...subcategories,
      ]);
      return CategoryDetailSchema.parse({
        category: categoryDto(category, images),
        subcategories: subcategories.map((row) => subcategoryDto(row, images)),
      });
    });
  }

  subcategory(
    slug: string,
    subcategorySlug: string,
  ): Promise<SubcategoryDetail> {
    return this.uow.run(async (tx) => {
      const category = await this.taxonomy.findCategoryBySlug(tx, slug);
      const subcategory = category?.active
        ? await this.taxonomy.findSubcategoryBySlug(
            tx,
            category.id,
            subcategorySlug,
          )
        : null;
      if (!category || !subcategory?.active)
        throw new DomainError('SUBCATEGORY_NOT_FOUND');
      const images = await imagesFor(this.media, tx, [category, subcategory]);
      return SubcategoryDetailSchema.parse({
        category: categoryDto(category, images),
        subcategory: subcategoryDto(subcategory, images),
        canonicalPath: `/category/${category.slug}/${subcategory.slug}`,
      });
    });
  }

  tree(ctx: AdminReadContext): Promise<AdminCategoryTree> {
    assertCatalogReader(ctx);
    return this.uow.run(async (tx) => {
      const [categories, subcategories, relations] = await Promise.all([
        this.taxonomy.listCategories(tx, { activeOnly: false }),
        this.taxonomy.listSubcategories(tx, { activeOnly: false }),
        this.taxonomy.relations(tx),
      ]);
      const images = await imagesFor(this.media, tx, [
        ...categories,
        ...subcategories,
      ]);
      return AdminCategoryTreeSchema.parse({
        items: categories.map((category) => ({
          ...adminCategoryDto(
            category,
            images,
            relations
              .filter((link) => link.sourceCategoryId === category.id)
              .map((link) => link.relatedCategoryId),
          ),
          subcategories: subcategories
            .filter((row) => row.categoryId === category.id)
            .map((row) => adminSubcategoryDto(row, images)),
        })),
      });
    });
  }

  createCategory(
    command: AdminCommand,
    input: CreateCategory,
  ): Promise<AdminCategory> {
    return this.commands.run(
      command,
      {
        name: 'super-admin.catalog.category.create',
        method: 'POST',
        resource: '/catalog/admin/categories',
        successStatus: 201,
      },
      input,
      async (tx, actor) => {
        await this.writer.assertImage(tx, input.imageAssetId, actor.userId);
        const id = this.ids.uuidv7();
        if (
          !(await this.taxonomy.insertCategory(tx, {
            id,
            kind: input.kind,
            slug: input.slug,
            nameEn: input.nameEn,
            nameHi: input.nameHi,
            icon: input.icon ?? null,
            imageAssetId: input.imageAssetId ?? null,
            active: true,
            sortOrder: input.sortOrder ?? 0,
            at: this.clock.now(),
          }))
        )
          throw new DomainError('CATEGORY_CONFLICT', { field: 'slug' });
        const created = (await this.taxonomy.findCategory(tx, id))!;
        await this.audit.record(tx, {
          actor,
          action: 'catalog.category.created',
          entityType: 'category',
          entityId: id,
          summary: 'Category created',
          before: null,
          after: categorySnapshot(created),
          fields: CATEGORY_AUDIT_FIELDS,
          correlationId: command.correlationId,
        });
        await this.categoryChanged(tx, created, 'created', command);
        return (await this.adminCategory(tx, created)) as AdminCategory &
          JsonValue;
      },
      receipt(AdminCategorySchema),
    );
  }

  updateCategory(
    command: AdminCommand,
    categoryId: string,
    input: UpdateCategory,
  ): Promise<AdminCategory> {
    return this.commands.run(
      command,
      {
        name: 'super-admin.catalog.category.update',
        method: 'PATCH',
        resource: `/catalog/admin/categories/${categoryId}`,
        successStatus: 200,
      },
      input,
      async (tx, actor) => {
        const before = await this.taxonomy.findCategory(tx, categoryId, true);
        if (!before) throw new DomainError('CATEGORY_NOT_FOUND');
        if (before.version !== input.expectedVersion)
          throw new DomainError('CATALOG_VERSION_CONFLICT');
        await this.writer.assertImage(tx, input.imageAssetId, actor.userId);
        const { expectedVersion, ...change } = input;
        if (
          !(await this.taxonomy.updateCategory(tx, {
            id: categoryId,
            expectedVersion,
            ...change,
            at: this.clock.now(),
          }))
        )
          throw new DomainError('CATALOG_VERSION_CONFLICT');
        const after = (await this.taxonomy.findCategory(tx, categoryId))!;
        await this.audit.record(tx, {
          actor,
          action: 'catalog.category.updated',
          entityType: 'category',
          entityId: categoryId,
          summary: 'Category updated',
          before: categorySnapshot(before),
          after: categorySnapshot(after),
          fields: CATEGORY_AUDIT_FIELDS,
          correlationId: command.correlationId,
        });
        await this.categoryChanged(tx, after, 'updated', command);
        return (await this.adminCategory(tx, after)) as AdminCategory &
          JsonValue;
      },
      receipt(AdminCategorySchema),
    );
  }

  createSubcategory(
    command: AdminCommand,
    categoryId: string,
    input: CreateSubcategory,
  ): Promise<AdminSubcategory> {
    return this.commands.run(
      command,
      {
        name: 'super-admin.catalog.subcategory.create',
        method: 'POST',
        resource: `/catalog/admin/categories/${categoryId}/subcategories`,
        successStatus: 201,
      },
      input,
      async (tx, actor) => {
        // Category row lock serializes duplicate checks within the category.
        const category = await this.taxonomy.findCategory(tx, categoryId, true);
        if (!category) throw new DomainError('CATEGORY_NOT_FOUND');
        if (
          input.expectedVersion !== undefined &&
          category.version !== input.expectedVersion
        )
          throw new DomainError('CATALOG_VERSION_CONFLICT');
        const created = await this.writer.createSubcategory(tx, {
          category,
          nameEn: input.nameEn,
          nameHi: input.nameHi,
          serviceTypes: input.serviceTypes ?? [],
          imageAssetId: input.imageAssetId ?? null,
          actor,
          correlationId: command.correlationId,
          duplicate: 'SUBCATEGORY_DUPLICATE',
        });
        const images = await imagesFor(this.media, tx, [created]);
        return adminSubcategoryDto(created, images) as AdminSubcategory &
          JsonValue;
      },
      receipt(AdminSubcategorySchema),
    );
  }

  updateSubcategory(
    command: AdminCommand,
    subcategoryId: string,
    input: UpdateSubcategory,
  ): Promise<AdminSubcategory> {
    return this.commands.run(
      command,
      {
        name: 'super-admin.catalog.subcategory.update',
        method: 'PATCH',
        resource: `/catalog/admin/subcategories/${subcategoryId}`,
        successStatus: 200,
      },
      input,
      async (tx, actor) => {
        const found = await this.taxonomy.findSubcategory(tx, subcategoryId);
        if (!found) throw new DomainError('SUBCATEGORY_NOT_FOUND');
        // Lock order: category, then subcategory (same as create).
        const category = (await this.taxonomy.findCategory(
          tx,
          found.categoryId,
          true,
        ))!;
        const before = (await this.taxonomy.findSubcategory(
          tx,
          subcategoryId,
          true,
        ))!;
        if (before.version !== input.expectedVersion)
          throw new DomainError('CATALOG_VERSION_CONFLICT');
        this.writer.assertServiceTypes(category, input.serviceTypes);
        await this.writer.assertImage(tx, input.imageAssetId, actor.userId);
        const nameEn = input.nameEn ?? before.nameEn;
        const nameHi = input.nameHi ?? before.nameHi;
        let normalizedName: string | undefined;
        if (input.nameEn !== undefined || input.nameHi !== undefined) {
          const [en, hi] = await this.writer.normalize(tx, [nameEn, nameHi]);
          normalizedName = en!;
          if (
            await this.taxonomy.findSubcategoryClash(tx, {
              categoryId: before.categoryId,
              normalizedNames: [en!, hi!],
              excludeId: subcategoryId,
            })
          )
            throw new DomainError('SUBCATEGORY_DUPLICATE', { field: 'nameEn' });
        }
        const { expectedVersion, ...change } = input;
        if (
          !(await this.taxonomy.updateSubcategory(tx, {
            id: subcategoryId,
            expectedVersion,
            ...change,
            ...(normalizedName !== undefined ? { normalizedName } : {}),
            at: this.clock.now(),
          }))
        )
          throw new DomainError('CATALOG_VERSION_CONFLICT');
        const after = (await this.taxonomy.findSubcategory(tx, subcategoryId))!;
        await this.audit.record(tx, {
          actor,
          action: 'catalog.subcategory.updated',
          entityType: 'subcategory',
          entityId: subcategoryId,
          summary: 'Subcategory updated',
          before: subcategorySnapshot(before),
          after: subcategorySnapshot(after),
          fields: SUBCATEGORY_AUDIT_FIELDS,
          correlationId: command.correlationId,
        });
        await this.events.taxonomyChanged(
          tx,
          {
            entity: 'subcategory',
            entityId: subcategoryId,
            categoryId: after.categoryId,
            change: 'updated',
            version: after.version,
          },
          command.correlationId,
        );
        const images = await imagesFor(this.media, tx, [after]);
        return adminSubcategoryDto(after, images) as AdminSubcategory &
          JsonValue;
      },
      receipt(AdminSubcategorySchema),
    );
  }

  private categoryChanged(
    tx: TxContext,
    category: StoredCategory,
    change: 'created' | 'updated',
    command: AdminCommand,
  ): Promise<void> {
    return this.events.taxonomyChanged(
      tx,
      {
        entity: 'category',
        entityId: category.id,
        categoryId: category.id,
        change,
        version: category.version,
      },
      command.correlationId,
    );
  }

  private async adminCategory(
    tx: TxContext,
    category: StoredCategory,
  ): Promise<AdminCategory> {
    const [images, relations] = await Promise.all([
      imagesFor(this.media, tx, [category]),
      this.taxonomy.relations(tx, [category.id]),
    ]);
    return adminCategoryDto(
      category,
      images,
      relations.map((link) => link.relatedCategoryId),
    );
  }
}
