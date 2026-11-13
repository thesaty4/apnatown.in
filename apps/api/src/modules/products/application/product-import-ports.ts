import type { TxContext } from '../../../shared/persistence/ports';
import type { NewProductRow } from './product-owner-ports';

export const PRODUCT_IMPORT_READER = Symbol('PRODUCT_IMPORT_READER');
export const PRODUCT_IMPORT_REPOSITORY = Symbol('PRODUCT_IMPORT_REPOSITORY');

/**
 * One parsed cell. `text` is untrusted submitted text; `number` is a typed
 * spreadsheet number normalised to its shortest decimal form. Formula and
 * error cells never carry a value: formulas are never evaluated and cached
 * results are never read.
 */
export type ImportCell =
  | { kind: 'text'; value: string }
  | { kind: 'number'; value: string }
  | { kind: 'formula' }
  | { kind: 'error' };

/** A non-blank data row; `row` is 1-based after the header row. */
export interface ImportSheetRow {
  row: number;
  cells: ImportCell[];
}

/** First sheet only: header names (formula/error header cells read as ''). */
export interface ImportSheet {
  headers: string[];
  rows: ImportSheetRow[];
}

/**
 * Content-detected CSV/XLSX reader (never by extension or client mimetype).
 * Throws PRODUCT_IMPORT_INVALID {field:'file'} for an unsupported/unreadable
 * file and PRODUCT_IMPORT_LIMIT {field:'rows'} once more than `maxRows`
 * non-blank data rows are found, or {field:'file'} when an XLSX part exceeds
 * the uncompressed safety caps.
 */
export interface ProductImportReader {
  read(bytes: Buffer, limits: { maxRows: number }): ImportSheet;
}

/** Products-owned batch persistence for imports (parameterized SQL only). */
export interface ProductImportRepository {
  /** SKUs among `skus` already used by the business (deleted rows included). */
  existingSkus(
    tx: TxContext,
    businessId: string,
    skus: readonly string[],
  ): Promise<string[]>;
  /**
   * One unique slug per base, in input order; bases are serialized with the
   * single-create allocator's bucketed advisory locks until commit.
   */
  allocateSlugs(tx: TxContext, bases: readonly string[]): Promise<string[]>;
  /** All products + inventory rows; false (nothing usable) on any unique race. */
  insertMany(tx: TxContext, rows: readonly NewProductRow[]): Promise<boolean>;
}
