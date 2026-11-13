import { IdSchema } from '@apnatown/shared/wire';
import {
  ProductCreateSchema,
  type ProductCreate,
  type ProductImportHeader,
  type ProductImportRowErrorCode,
} from '@apnatown/shared/products';
import type { ImportCell, ImportSheetRow } from './product-import-ports';
import type { ImportColumns, ImportRowErrors } from './product-import-errors';
import { assertPrice } from './product-rules';

/** A row that passed every file-local rule; taxonomy/SKU checks follow. */
export interface ImportRowInput {
  row: number;
  input: ProductCreate;
}

/**
 * Cell grammar (all values are untrusted text; nothing is evaluated):
 * - Formula guard: a formula cell, or a value whose raw form starts with
 *   `= + - @ TAB CR` (or whose trimmed form starts with `= + - @`), is
 *   `formula_not_allowed`. Text fields are checked whatever the cell type
 *   (a typed number `-5` in a name/SKU is rejected too); each tag is checked
 *   again after splitting. Only typed numbers in priceINR, mrpINR, onHand,
 *   lowStockThreshold and availableForSale are exempt (they fail their own
 *   unsigned grammar instead).
 * - priceINR/mrpINR: plain decimal rupees `0`..`999999999` with an optional
 *   `.d`/`.dd`; no sign, thousands separators, currency symbol, exponent or
 *   leading zeros. Converted exactly to integer paise (no float math).
 * - onHand/lowStockThreshold: whole number `0`..`2147483647`, no sign/zeros.
 * - availableForSale: true/false/yes/no/1/0 (case-insensitive).
 * - tags: comma-separated plain text; blank items are dropped.
 * - Blank optional cells use the create defaults (generated SKU, stock 10,
 *   threshold 5, available).
 */
const PRICE = /^(0|[1-9][0-9]{0,8})(?:\.([0-9]{1,2}))?$/;
const INTEGER = /^(0|[1-9][0-9]{0,9})$/;
const BOOLEANS = new Map([
  ['true', true],
  ['yes', true],
  ['1', true],
  ['false', false],
  ['no', false],
  ['0', false],
]);
const FORMULA_RAW = /^[=+\-@\t\r]/;
const FORMULA_TRIMMED = /^[=+\-@]/;
const PLACEHOLDER_ID = '00000000-0000-0000-0000-000000000000';
/** Fields whose typed-number cells skip the formula guard. */
const NUMERIC_FIELDS = new Set<ProductImportHeader>([
  'priceINR',
  'mrpINR',
  'onHand',
  'lowStockThreshold',
  'availableForSale',
]);
const formulaLike = (raw: string) =>
  FORMULA_RAW.test(raw) || FORMULA_TRIMMED.test(raw.trim());

/** Input field path (zod issue path head) → template header. */
const FIELD_HEADER: Record<string, ProductImportHeader> = {
  nameEn: 'nameEn',
  nameHi: 'nameHi',
  categoryId: 'categoryId',
  subcategoryId: 'subcategoryId',
  brand: 'brand',
  sku: 'sku',
  pricePaise: 'priceINR',
  mrpPaise: 'mrpINR',
  unit: 'unit',
  onHand: 'onHand',
  lowStockThreshold: 'lowStockThreshold',
  availableForSale: 'availableForSale',
  tags: 'tags',
};

type Issue = { code: string; path: PropertyKey[]; origin?: unknown };
function issueCode(issue: Issue): ProductImportRowErrorCode {
  const list = issue.path[0] === 'tags' && issue.path.length === 1;
  if (issue.code === 'too_big') return list ? 'too_many_tags' : 'too_long';
  if (issue.code === 'too_small') return 'required';
  if (issue.code === 'custom') return 'invalid_text';
  if (issue.code === 'invalid_format') return 'invalid_id';
  return 'invalid_value';
}

class RowReader {
  constructor(
    private readonly row: ImportSheetRow,
    private readonly columns: ImportColumns,
    private readonly errors: ImportRowErrors,
  ) {}

  private fail(field: ProductImportHeader, code: ProductImportRowErrorCode) {
    this.errors.add(this.row.row, field, code);
    return undefined;
  }

  /** Trimmed text, null when blank, undefined after recording an error. */
  text(field: ProductImportHeader): string | null | undefined {
    const cell: ImportCell | undefined =
      this.row.cells[this.columns.get(field) ?? -1];
    if (!cell) return null;
    if (cell.kind === 'formula') return this.fail(field, 'formula_not_allowed');
    if (cell.kind === 'error') return this.fail(field, 'invalid_value');
    const value = cell.value.trim();
    if (
      (cell.kind === 'text' || !NUMERIC_FIELDS.has(field)) &&
      formulaLike(cell.value)
    )
      return this.fail(field, 'formula_not_allowed');
    return value || null;
  }

  /** Comma-separated tags, each trimmed and formula-checked on its own. */
  tags(): string[] | undefined {
    const value = this.text('tags');
    if (value === undefined) return undefined;
    const tags = (value ?? '').split(',');
    if (tags.some(formulaLike)) return this.fail('tags', 'formula_not_allowed');
    return tags.map((tag) => tag.trim()).filter(Boolean);
  }

  required(field: ProductImportHeader): string | undefined {
    const value = this.text(field);
    return value === null ? this.fail(field, 'required') : value;
  }

  id(field: ProductImportHeader): string | undefined {
    const value = this.required(field)?.toLowerCase();
    if (value === undefined) return undefined;
    return IdSchema.safeParse(value).success
      ? value
      : this.fail(field, 'invalid_id');
  }

  paise(field: ProductImportHeader): number | undefined {
    const value = this.required(field);
    if (value === undefined) return undefined;
    const match = PRICE.exec(value);
    if (!match) return this.fail(field, 'invalid_price');
    return Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
  }

  integer(field: ProductImportHeader): number | null | undefined {
    const value = this.text(field);
    if (value === null || value === undefined) return value;
    return INTEGER.test(value) && Number(value) <= 2147483647
      ? Number(value)
      : this.fail(field, 'invalid_number');
  }

  boolean(field: ProductImportHeader): boolean | null | undefined {
    const value = this.text(field);
    if (value === null || value === undefined) return value;
    const parsed = BOOLEANS.get(value.toLowerCase());
    return parsed ?? this.fail(field, 'invalid_boolean');
  }
}

/** File-local validation of one data row; null when any rule failed. */
export function importRow(
  row: ImportSheetRow,
  columns: ImportColumns,
  errors: ImportRowErrors,
): ImportRowInput | null {
  const used = new Set(columns.values());
  row.cells.forEach((cell, index) => {
    if (used.has(index)) return;
    if (cell.kind !== 'text' || cell.value.trim())
      errors.add(row.row, null, 'unexpected_column');
  });
  const read = new RowReader(row, columns, errors);
  const pricePaise = read.paise('priceINR');
  const mrpPaise = read.paise('mrpINR');
  const onHand = read.integer('onHand');
  const lowStockThreshold = read.integer('lowStockThreshold');
  const availableForSale = read.boolean('availableForSale');
  const tags = read.tags();
  const candidate = {
    nameEn: read.required('nameEn') ?? 'x',
    nameHi: read.text('nameHi') ?? null,
    categoryId: read.id('categoryId') ?? PLACEHOLDER_ID,
    subcategoryId: read.id('subcategoryId') ?? PLACEHOLDER_ID,
    brand: read.text('brand') ?? null,
    sku: read.text('sku') ?? null,
    pricePaise: pricePaise ?? 0,
    mrpPaise: mrpPaise ?? 0,
    unit: read.required('unit') ?? 'x',
    tags: tags ?? [],
    inventory: {
      ...(onHand != null && { onHand }),
      ...(lowStockThreshold != null && { lowStockThreshold }),
      ...(availableForSale != null && { availableForSale }),
    },
  };
  const parsed = ProductCreateSchema.safeParse(candidate);
  if (!parsed.success)
    for (const issue of parsed.error.issues) {
      const head =
        issue.path[0] === 'inventory' ? issue.path[1] : issue.path[0];
      const header = typeof head === 'string' ? FIELD_HEADER[head] : undefined;
      errors.add(row.row, header ?? null, issueCode(issue as Issue));
    }
  if (pricePaise !== undefined && mrpPaise !== undefined)
    try {
      assertPrice(pricePaise, mrpPaise);
    } catch {
      errors.add(row.row, 'mrpINR', 'mrp_below_price');
    }
  return parsed.success && !errors.has(row.row)
    ? { row: row.row, input: parsed.data }
    : null;
}

/** Later rows repeating an earlier SKU (exact, as the unique index compares). */
export function markDuplicateSkus(
  rows: readonly ImportRowInput[],
  errors: ImportRowErrors,
): void {
  const seen = new Set<string>();
  for (const { row, input } of rows) {
    if (!input.sku) continue;
    if (seen.has(input.sku)) errors.add(row, 'sku', 'duplicate_sku');
    seen.add(input.sku);
  }
}
