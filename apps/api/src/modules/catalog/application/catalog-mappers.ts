import type { JsonValue } from '@apnatown/shared';
import {
  AdminCategorySchema,
  AdminSubcategorySchema,
  CategorySchema,
  SubcategorySchema,
  type AdminCategory,
  type AdminSubcategory,
  type Category,
  type Subcategory,
  type TaxonomyImage,
} from '@apnatown/shared/catalog';
import type { z } from 'zod';
import type { AuditSnapshot } from '../../audit/application/audit-writer.port';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  StoredCategory,
  StoredSubcategory,
} from '../domain/catalog.repository';
import type { CatalogMediaAssetPort } from './catalog-ports';

export type ImageMap = ReadonlyMap<string, TaxonomyImage>;

/** Public descriptors for the rows' attached images (Media-owned). */
export function imagesFor(
  media: CatalogMediaAssetPort,
  tx: TxContext,
  rows: readonly { imageAssetId: string | null }[],
): Promise<Map<string, TaxonomyImage>> {
  const ids = [
    ...new Set(
      rows.flatMap((row) => (row.imageAssetId ? [row.imageAssetId] : [])),
    ),
  ];
  return ids.length ? media.describe(tx, ids) : Promise.resolve(new Map());
}

const image = (images: ImageMap, assetId: string | null) => {
  const found = assetId ? images.get(assetId) : undefined;
  return found ? { image: found } : {};
};

export function categoryDto(row: StoredCategory, images: ImageMap): Category {
  return CategorySchema.parse({
    id: row.id,
    slug: row.slug,
    kind: row.kind,
    nameEn: row.nameEn,
    nameHi: row.nameHi,
    ...(row.icon ? { icon: row.icon } : {}),
    ...image(images, row.imageAssetId),
    active: row.active,
    sortOrder: row.sortOrder,
  });
}

export function subcategoryDto(
  row: StoredSubcategory,
  images: ImageMap,
): Subcategory {
  return SubcategorySchema.parse({
    id: row.id,
    categoryId: row.categoryId,
    slug: row.slug,
    nameEn: row.nameEn,
    nameHi: row.nameHi,
    serviceTypes: row.serviceTypes,
    ...image(images, row.imageAssetId),
    active: row.active,
    sortOrder: row.sortOrder,
  });
}

export function adminCategoryDto(
  row: StoredCategory,
  images: ImageMap,
  relatedCategoryIds: readonly string[],
): AdminCategory {
  return AdminCategorySchema.parse({
    ...categoryDto(row, images),
    imageAssetId: row.imageAssetId,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    relatedCategoryIds,
  });
}

export function adminSubcategoryDto(
  row: StoredSubcategory,
  images: ImageMap,
): AdminSubcategory {
  return AdminSubcategorySchema.parse({
    ...subcategoryDto(row, images),
    imageAssetId: row.imageAssetId,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export const CATEGORY_AUDIT_FIELDS = [
  'kind',
  'slug',
  'nameEn',
  'nameHi',
  'icon',
  'imageAssetId',
  'active',
  'sortOrder',
  'version',
] as const;
export const SUBCATEGORY_AUDIT_FIELDS = [
  'categoryId',
  'slug',
  'nameEn',
  'nameHi',
  'serviceTypes',
  'imageAssetId',
  'active',
  'sortOrder',
  'version',
] as const;

export function categorySnapshot(row: StoredCategory): AuditSnapshot {
  return {
    kind: row.kind,
    slug: row.slug,
    nameEn: row.nameEn,
    nameHi: row.nameHi,
    icon: row.icon,
    imageAssetId: row.imageAssetId,
    active: row.active,
    sortOrder: row.sortOrder,
    version: row.version,
  };
}

export function subcategorySnapshot(row: StoredSubcategory): AuditSnapshot {
  return {
    categoryId: row.categoryId,
    slug: row.slug,
    nameEn: row.nameEn,
    nameHi: row.nameHi,
    serviceTypes: row.serviceTypes,
    imageAssetId: row.imageAssetId,
    active: row.active,
    sortOrder: row.sortOrder,
    version: row.version,
  };
}

/** Idempotency receipt: the stored result is re-validated on replay. */
export function receipt<S extends z.ZodType>(schema: S) {
  type Result = z.infer<S> & JsonValue;
  return {
    store: (result: Result): JsonValue => result,
    replay: (_tx: TxContext, stored: JsonValue) =>
      Promise.resolve(schema.parse(stored) as Result),
  };
}
