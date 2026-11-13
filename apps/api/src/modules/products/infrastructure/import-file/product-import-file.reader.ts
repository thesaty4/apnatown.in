import { Injectable } from '@nestjs/common';
import { DomainError } from '../../../../shared/errors/errors';
import type {
  ImportCell,
  ImportSheet,
  ImportSheetRow,
  ProductImportReader,
} from '../../application/product-import-ports';
import { csvRecords, csvText } from './csv-reader';
import { xlsxRows } from './xlsx-reader';

/** Local file header signature that every OOXML package starts with. */
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

const blank = (cells: readonly ImportCell[]) =>
  cells.every((cell) => cell.kind === 'text' && cell.value.trim() === '');
const header = (cell: ImportCell | undefined) =>
  cell?.kind === 'text' ? cell.value.trim() : '';

/**
 * Detects the format by content only: a ZIP local-header signature means
 * XLSX (then validated as OOXML); anything else must be strict UTF-8 CSV.
 * The header is the first non-blank row; data rows are numbered by their
 * distance from it (CSV records / sheet rows), so blank rows keep the
 * numbering aligned with what the owner sees. Blank rows are dropped.
 * `maxRows` is enforced while CSV records stream (stops at the first extra
 * row) and before XLSX XML is parsed (element budgets in xlsxRows).
 */
@Injectable()
export class ProductImportFileReader implements ProductImportReader {
  read(bytes: Buffer, limits: { maxRows: number }): ImportSheet {
    const source = bytes.subarray(0, 4).equals(ZIP_MAGIC)
      ? xlsxRows(bytes, limits.maxRows)
      : this.csv(bytes);
    let headerIndex: number | undefined;
    let headers: string[] = [];
    const rows: ImportSheetRow[] = [];
    for (const { index, cells } of source) {
      if (blank(cells)) continue;
      if (headerIndex === undefined) {
        headerIndex = index;
        headers = cells.map(header);
        continue;
      }
      rows.push({ row: index - headerIndex, cells });
      if (rows.length > limits.maxRows)
        throw new DomainError('PRODUCT_IMPORT_LIMIT', { field: 'rows' });
    }
    return { headers, rows };
  }

  private *csv(
    bytes: Buffer,
  ): Generator<{ index: number; cells: ImportCell[] }> {
    let index = 0;
    for (const record of csvRecords(csvText(bytes))) {
      index += 1;
      yield {
        index,
        cells: record.map((value) => ({ kind: 'text', value })),
      };
    }
  }
}
