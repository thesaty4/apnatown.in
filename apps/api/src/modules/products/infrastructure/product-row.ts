import { Prisma } from '../../../shared/persistence/generated/client';
import type {
  NewProductRow,
  ProductFields,
  ProductSpec,
  StoredProduct,
  StoredProductMedia,
} from '../application/product-owner-ports';

/** Raw `products p JOIN inventory i` row before JSON normalisation. */
export type ProductRow = Omit<
  StoredProduct,
  'media' | 'specs' | 'inventory'
> & {
  media: unknown;
  specs: unknown;
  onHand: number;
  lowStockThreshold: number;
  availableForSale: boolean;
  inventoryVersion: number;
  inventoryUpdatedAt: Date;
};

// Paise are bounded by CHECK to 2^53-1, so float8 is exact.
export const productColumns = Prisma.sql`
  p.id::text AS id,p.business_id::text AS "businessId",p.slug,
  p.category_id::text AS "categoryId",p.subcategory_id::text AS "subcategoryId",
  p.name_en AS "nameEn",p.name_hi AS "nameHi",p.description,p.brand,p.sku,
  p.price_paise::float8 AS "pricePaise",p.mrp_paise::float8 AS "mrpPaise",p.unit,p.tags,
  p.specs,p.tax_code AS "taxCode",p.featured_selected AS "featuredSelected",p.published,
  p.media,p.version,(p.deleted_at IS NOT NULL) AS deleted,
  p.created_at AS "createdAt",p.updated_at AS "updatedAt",
  i.on_hand AS "onHand",i.low_stock_threshold AS "lowStockThreshold",
  i.available_for_sale AS "availableForSale",i.version AS "inventoryVersion",
  i.updated_at AS "inventoryUpdatedAt"`;

const record = (item: unknown): Record<string, unknown> | null =>
  typeof item === 'object' && item !== null
    ? (item as Record<string, unknown>)
    : null;

/** Only `{assetId,showInGallery}` is kept, in stored order. */
function media(value: unknown): StoredProductMedia[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: unknown) => {
    const row = record(item);
    return row && typeof row.assetId === 'string'
      ? [{ assetId: row.assetId, showInGallery: row.showInGallery === true }]
      : [];
  });
}

function specs(value: unknown): ProductSpec[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: unknown) => {
    const row = record(item);
    return row && typeof row.label === 'string' && typeof row.value === 'string'
      ? [{ label: row.label, value: row.value }]
      : [];
  });
}

export function storedProduct(row: ProductRow): StoredProduct {
  const {
    onHand,
    lowStockThreshold,
    availableForSale,
    inventoryVersion,
    inventoryUpdatedAt,
    ...product
  } = row;
  return {
    ...product,
    media: media(row.media),
    specs: specs(row.specs),
    inventory: {
      onHand,
      lowStockThreshold,
      availableForSale,
      version: inventoryVersion,
      updatedAt: inventoryUpdatedAt,
    },
  };
}

export const mediaJson = (fields: ProductFields) =>
  JSON.stringify(
    fields.media.map((item) => ({
      assetId: item.assetId,
      showInGallery: item.showInGallery,
    })),
  );
export const specsJson = (fields: ProductFields) =>
  JSON.stringify(fields.specs.map(({ label, value }) => ({ label, value })));

/** `INSERT INTO products <columns> VALUES <productValues(row)>, ...`. */
export const productInsertColumns = Prisma.sql`(id,business_id,category_id,
  subcategory_id,slug,name_en,name_hi,description,brand,sku,price_paise,mrp_paise,
  unit,tags,specs,featured_selected,published,media,version,created_at,updated_at)`;
export const productValues = (
  row: NewProductRow,
) => Prisma.sql`(${row.id}::uuid,
  ${row.businessId}::uuid,${row.categoryId}::uuid,${row.subcategoryId}::uuid,${row.slug},
  ${row.nameEn},${row.nameHi},${row.description},${row.brand},${row.sku},
  ${row.pricePaise}::bigint,${row.mrpPaise}::bigint,${row.unit},${row.tags}::text[],
  ${specsJson(row)}::jsonb,${row.featuredSelected},${row.published},
  ${mediaJson(row)}::jsonb,1,${row.at},${row.at})`;
/** `INSERT INTO inventory <columns> VALUES <inventoryValues(row)>, ...`. */
export const inventoryInsertColumns = Prisma.sql`(product_id,on_hand,
  low_stock_threshold,available_for_sale,version,updated_at)`;
export const inventoryValues = (
  row: NewProductRow,
) => Prisma.sql`(${row.id}::uuid,
  ${row.stock.onHand},${row.stock.lowStockThreshold},${row.stock.availableForSale},1,
  ${row.at})`;
