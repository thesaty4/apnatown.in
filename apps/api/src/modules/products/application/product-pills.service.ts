import { Inject, Injectable } from '@nestjs/common';
import type { Subcategory } from '@apnatown/shared/catalog';
import {
  ProductPillsSchema,
  type ProductPills,
  type ProductPillsReplace,
} from '@apnatown/shared/products';
import { DomainError } from '../../../shared/errors/errors';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import {
  CATALOG_READ,
  type CatalogReadPort,
} from '../../catalog/application/catalog-ports';
import {
  ProductOwnerAccess,
  type ProductOwnerCommand,
  type ProductOwnerRequest,
} from './product-owner-access';
import {
  PRODUCT_PILLS_REPOSITORY,
  type ProductPillsRepository,
  type StoredPill,
} from './product-owner-ports';
import { ProductWriteSupport } from './product-write-support';

/**
 * Customer-facing product pill preferences (F-VD-005; rule 8). Defaults are
 * the business's active product subcategories (those its non-deleted
 * products use); hide/rename/reorder never changes Catalog taxonomy.
 */
@Injectable()
export class ProductPillsService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(PRODUCT_PILLS_REPOSITORY)
    private readonly pills: ProductPillsRepository,
    @Inject(CATALOG_READ) private readonly catalog: CatalogReadPort,
    private readonly support: ProductWriteSupport,
    private readonly access: ProductOwnerAccess,
  ) {}

  async mine(request: ProductOwnerRequest): Promise<ProductPills> {
    const { saved, subcategoryIds } = await this.uow.run(async (tx) => {
      const business = await this.access.resolve(tx, request);
      return {
        saved: await this.pills.saved(tx, business.id),
        subcategoryIds: await this.pills.productSubcategoryIds(tx, business.id),
      };
    });
    return this.merge(saved, await this.activeProductSubcategories(subcategoryIds));
  }

  /** Replace-all (idempotent PUT); ids must be the business's active pills. */
  async replace(
    request: ProductOwnerCommand,
    input: ProductPillsReplace,
  ): Promise<ProductPills> {
    const ids = input.items.map((item) => item.subcategoryId);
    const positions = input.items.map((item) => item.position);
    if (new Set(ids).size !== ids.length || new Set(positions).size !== positions.length)
      throw new DomainError('PRODUCT_PILL_INVALID');
    // Catalog taxonomy is read outside the write transaction.
    const active = await this.activeProductSubcategories(ids);
    if (active.size !== ids.length) throw new DomainError('PRODUCT_PILL_INVALID');
    const items: StoredPill[] = input.items.map((item) => ({
      subcategoryId: item.subcategoryId,
      position: item.position,
      labelEn: item.labelEn ?? null,
      labelHi: item.labelHi ?? null,
      hidden: item.hidden,
    }));
    const subcategoryIds = await this.uow.run(async (tx) => {
      const business = await this.access.resolve(tx, request, { lock: true });
      const own = new Set(await this.pills.productSubcategoryIds(tx, business.id));
      if (ids.some((id) => !own.has(id)))
        throw new DomainError('PRODUCT_PILL_INVALID');
      await this.pills.replace(tx, business.id, items);
      await this.support.emitPills(tx, request.correlationId, business);
      return [...own];
    });
    const sorted = [...items].sort((a, b) => a.position - b.position);
    return this.merge(sorted, await this.activeProductSubcategories(subcategoryIds));
  }

  /** Active subcategories under active product-kind categories, by id. */
  private async activeProductSubcategories(
    ids: readonly string[],
  ): Promise<Map<string, Subcategory>> {
    if (!ids.length) return new Map();
    const taxonomy = await this.catalog.taxonomy({
      subcategoryIds: ids,
      kind: 'product',
      activeOnly: true,
    });
    const categories = new Set(
      taxonomy.categories
        .filter((row) => row.active && row.kind === 'product')
        .map((row) => row.id),
    );
    return new Map(
      taxonomy.subcategories
        .filter((row) => row.active && categories.has(row.categoryId) && ids.includes(row.id))
        .map((row) => [row.id, row]),
    );
  }

  /** Saved rows in position order, then unconfigured defaults by catalog order. */
  private merge(
    saved: readonly StoredPill[],
    active: ReadonlyMap<string, Subcategory>,
  ): ProductPills {
    const configured = saved.filter((row) => active.has(row.subcategoryId));
    const seen = new Set(configured.map((row) => row.subcategoryId));
    let next = Math.max(-1, ...configured.map((row) => row.position)) + 1;
    const defaults = [...active.values()]
      .filter((row) => !seen.has(row.id))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
    const pill = (sub: Subcategory, row: StoredPill | null) => ({
      subcategoryId: sub.id,
      categoryId: sub.categoryId,
      slug: sub.slug,
      position: row ? row.position : next++,
      labelEn: row?.labelEn ?? null,
      labelHi: row?.labelHi ?? null,
      catalogNameEn: sub.nameEn,
      catalogNameHi: sub.nameHi,
      hidden: row?.hidden ?? false,
      configured: row !== null,
    });
    return ProductPillsSchema.parse({
      items: [
        ...configured.map((row) => pill(active.get(row.subcategoryId)!, row)),
        ...defaults.map((sub) => pill(sub, null)),
      ],
    });
  }
}
