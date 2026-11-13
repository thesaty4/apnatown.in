import {
  PRODUCT_IMPORT_ERROR_LIMIT,
  PRODUCT_IMPORT_HEADERS,
  type ProductImportHeader,
  type ProductImportRowError,
  type ProductImportRowErrorCode,
} from '@apnatown/shared/products';
import { DomainError } from '../../../shared/errors/errors';

const SAFE_HEADER = /^[A-Za-z][A-Za-z0-9_.]{0,99}$/;
const ORDER = new Map<string, number>(
  PRODUCT_IMPORT_HEADERS.map((header, index) => [header, index]),
);

export type ImportColumns = ReadonlyMap<ProductImportHeader, number>;

/**
 * Template header check: every header exactly once (case-sensitive, trimmed),
 * any order, blank header cells ignored. Otherwise PRODUCT_IMPORT_INVALID
 * `{field:'headers', expected, unknown}`; `unknown` lists only submitted
 * names that are safe field paths (never arbitrary cell text).
 */
export function importColumns(headers: readonly string[]): ImportColumns {
  const columns = new Map<ProductImportHeader, number>();
  const unknown = new Set<string>();
  let valid = true;
  headers.forEach((name, index) => {
    if (!name) return;
    const header = PRODUCT_IMPORT_HEADERS.find((item) => item === name);
    if (!header) {
      valid = false;
      if (SAFE_HEADER.test(name)) unknown.add(name);
    } else if (columns.has(header)) valid = false;
    else columns.set(header, index);
  });
  if (!valid || columns.size !== PRODUCT_IMPORT_HEADERS.length)
    throw new DomainError('PRODUCT_IMPORT_INVALID', {
      field: 'headers',
      expected: [...PRODUCT_IMPORT_HEADERS],
      unknown: [...unknown].slice(0, 50),
    });
  return columns;
}

/** One code per (row, field); first recorded wins. */
export class ImportRowErrors {
  private readonly errors = new Map<string, ProductImportRowError>();
  private readonly rows = new Set<number>();

  add(
    row: number,
    field: ProductImportHeader | null,
    code: ProductImportRowErrorCode,
  ): void {
    const key = `${row}:${field ?? ''}`;
    if (!this.errors.has(key)) this.errors.set(key, { row, field, code });
    this.rows.add(row);
  }

  has(row: number): boolean {
    return this.rows.has(row);
  }

  get size(): number {
    return this.errors.size;
  }

  /** PRODUCT_IMPORT_INVALID with the first errors by row then template order. */
  fail(): DomainError {
    const rank = (field: string | null) =>
      field === null ? ORDER.size : (ORDER.get(field) ?? ORDER.size);
    const rows = [...this.errors.values()].sort(
      (left, right) =>
        left.row - right.row || rank(left.field) - rank(right.field),
    );
    return new DomainError('PRODUCT_IMPORT_INVALID', {
      rows: rows.slice(0, PRODUCT_IMPORT_ERROR_LIMIT),
      totalErrors: rows.length,
    });
  }
}
