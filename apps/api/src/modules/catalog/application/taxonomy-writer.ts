import { Inject, Injectable } from '@nestjs/common';
import { catalogSlug, normalizeCatalogText } from '@apnatown/shared/catalog';
import { DomainError, type ErrorCode } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import {
  CLOCK,
  ID_PROVIDER,
  type Clock,
  type IdProvider,
} from '../../../shared/runtime/providers';
import {
  AUDIT_WRITER,
  type AuditActor,
  type AuditWriter,
} from '../../audit/application/audit-writer.port';
import {
  TAXONOMY_REPOSITORY,
  type StoredCategory,
  type StoredSubcategory,
  type TaxonomyRepository,
} from '../domain/catalog.repository';
import { CatalogEvents } from './catalog-events';
import {
  SUBCATEGORY_AUDIT_FIELDS,
  subcategorySnapshot,
} from './catalog-mappers';
import {
  CATALOG_MEDIA_ASSETS,
  type CatalogMediaAssetPort,
} from './catalog-ports';

/**
 * Shared taxonomy write steps used by the super-admin editor and by
 * suggestion approval: normalization, duplicate checks, image validation,
 * and the subcategory insert with its audit entry and outbox event.
 */
@Injectable()
export class TaxonomyWriter {
  constructor(
    @Inject(TAXONOMY_REPOSITORY)
    private readonly taxonomy: TaxonomyRepository,
    @Inject(CATALOG_MEDIA_ASSETS)
    private readonly media: CatalogMediaAssetPort,
    @Inject(AUDIT_WRITER) private readonly audit: AuditWriter,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    private readonly events: CatalogEvents,
  ) {}

  /** Shared normalization (NFKC, case/space folding) + database `unaccent`. */
  normalize(tx: TxContext, values: readonly string[]): Promise<string[]> {
    return this.taxonomy.unaccent(tx, values.map(normalizeCatalogText));
  }

  /** Explicit null removes the image; undefined leaves it unchanged. */
  async assertImage(
    tx: TxContext,
    assetId: string | null | undefined,
  ): Promise<void> {
    if (assetId) await this.media.requireTaxonomyImage(tx, assetId);
  }

  assertServiceTypes(
    category: StoredCategory,
    serviceTypes: readonly string[] | undefined,
  ): void {
    if (serviceTypes?.length && category.kind !== 'service')
      throw new DomainError('VALIDATION_ERROR', { field: 'serviceTypes' });
  }

  /**
   * Inserts one active subcategory under a locked category. Exact normalized
   * EN/HI name or slug clashes in the category raise `duplicate`.
   */
  async createSubcategory(
    tx: TxContext,
    input: {
      category: StoredCategory;
      nameEn: string;
      nameHi: string;
      serviceTypes: readonly string[];
      imageAssetId: string | null;
      actor: AuditActor;
      correlationId: string;
      duplicate: ErrorCode;
    },
  ): Promise<StoredSubcategory> {
    const slug = catalogSlug(input.nameEn);
    if (!slug) throw new DomainError('VALIDATION_ERROR', { field: 'nameEn' });
    this.assertServiceTypes(input.category, input.serviceTypes);
    await this.assertImage(tx, input.imageAssetId);
    const [normalizedName, normalizedHi] = await this.normalize(tx, [
      input.nameEn,
      input.nameHi,
    ]);
    if (
      await this.taxonomy.findSubcategoryClash(tx, {
        categoryId: input.category.id,
        normalizedNames: [normalizedName!, normalizedHi!],
        slug,
      })
    )
      throw new DomainError(input.duplicate, { field: 'nameEn' });
    const id = this.ids.uuidv7();
    if (
      !(await this.taxonomy.insertSubcategory(tx, {
        id,
        categoryId: input.category.id,
        slug,
        nameEn: input.nameEn,
        nameHi: input.nameHi,
        normalizedName: normalizedName!,
        serviceTypes: [...input.serviceTypes],
        imageAssetId: input.imageAssetId,
        active: true,
        sortOrder: await this.taxonomy.nextSubcategorySortOrder(
          tx,
          input.category.id,
        ),
        at: this.clock.now(),
      }))
    )
      throw new DomainError(input.duplicate, { field: 'nameEn' });
    const created = (await this.taxonomy.findSubcategory(tx, id))!;
    await this.audit.record(tx, {
      actor: input.actor,
      action: 'catalog.subcategory.created',
      entityType: 'subcategory',
      entityId: id,
      summary: 'Subcategory created',
      before: null,
      after: subcategorySnapshot(created),
      fields: SUBCATEGORY_AUDIT_FIELDS,
      correlationId: input.correlationId,
    });
    await this.events.taxonomyChanged(
      tx,
      {
        entity: 'subcategory',
        entityId: id,
        categoryId: created.categoryId,
        change: 'created',
        version: created.version,
      },
      input.correlationId,
    );
    return created;
  }
}
