import { XMLParser } from 'fast-xml-parser';
import { PRODUCT_IMPORT_HEADERS } from '@apnatown/shared/products';
import { DomainError } from '../../../../shared/errors/errors';
import type { ImportCell } from '../../application/product-import-ports';
import { IMPORT_MAX_COLUMNS } from './csv-reader';
import { assertXmlBudget, type XmlBudget } from './xml-budget';
import { attr, child, isNode, nodes, text, type Node } from './xml-nodes';
import { inflateEntry, zipEntries } from './zip-entries';

/**
 * Values-only reader for the first worksheet of an OOXML workbook.
 * Formulas are never evaluated and their cached results are never read;
 * DOCTYPE/ENTITY declarations are rejected; external or escaping
 * relationship targets are rejected. Part sizes are capped before inflation.
 */

// TODO(verify): uncompressed caps sized for a 1000-row, 13-column template
// (~150 B of XML per cell) and the blank-row allowance below.
const MAX_ENTRIES = 256;
const META_CAP = 256 * 1024;
const SHEET_CAP = 2 * 1024 * 1024;
/** Extra `<row>` elements tolerated for formatted/blank rows. */
const BLANK_ROW_ALLOWANCE = 100;
/** Elements per template cell (c, v/is, t, r…) and per row (row + slack). */
const ELEMENTS_PER_CELL = 4;
const ELEMENTS_PER_ROW = 2;
const ELEMENTS_PER_STRING = 4;
/** Sheet/sst wrappers and metadata (dimension, sheetViews, cols, …). */
const METADATA_ELEMENTS = 256;
/** Attribute-like tokens allowed per counted element. */
const ATTRIBUTES_PER_ELEMENT = 4;
/** Fixed element budgets for the small package/workbook parts. */
const TYPES_ELEMENTS = 1000;
const RELS_ELEMENTS = 1000;
const WORKBOOK_ELEMENTS = 4000;
const MAX_SHEET_ROW = 1_048_576;
const WORKBOOK_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml';
const SHARED_STRINGS = /\/sharedStrings$/;
const ARRAYS = new Set([
  'row',
  'c',
  'si',
  'r',
  'sheet',
  'Relationship',
  'Override',
]);

const invalid = () =>
  new DomainError('PRODUCT_IMPORT_INVALID', { field: 'file' });

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: false,
  // PIs never become nodes (also rejected by the pre-parse budget).
  ignorePiTags: true,
  processEntities: false,
  htmlEntities: false,
  isArray: (name) => ARRAYS.has(name),
});

/** Element budget with the matching attribute budget. */
const budgetOf = (
  elements: number,
  field: 'rows' | 'file',
  named?: XmlBudget['named'],
): XmlBudget => ({
  elements,
  attributes: elements * ATTRIBUTES_PER_ELEMENT,
  field,
  ...(named && { named }),
});

function xml(
  bytes: Buffer,
  entries: ReturnType<typeof zipEntries>,
  name: string,
  cap: number,
  budget: XmlBudget,
): Node {
  const entry = entries.get(name);
  if (!entry) throw invalid();
  let source: string;
  try {
    source = new TextDecoder('utf-8', { fatal: true }).decode(
      inflateEntry(bytes, entry, cap),
    );
  } catch (error) {
    if (error instanceof DomainError) throw error;
    throw invalid();
  }
  if (/<!(DOCTYPE|ENTITY)/i.test(source)) throw invalid();
  // Bound the parser's object tree before building it.
  assertXmlBudget(source, budget);
  try {
    const parsed: unknown = parser.parse(source);
    if (!isNode(parsed)) throw invalid();
    return parsed;
  } catch {
    throw invalid();
  }
}

/** Zip-internal part path for a relationship target, never escaping root. */
function resolve(dir: string, target: string): string {
  const segments = (target.startsWith('/') ? target : `${dir}${target}`)
    .split('/')
    .filter((segment) => segment && segment !== '.');
  if (segments.some((segment) => segment === '..' || segment.includes('\\')))
    throw invalid();
  return segments.join('/');
}

/** Column index from an A1 reference (`AB12` → 27). */
function column(ref: string | undefined, fallback: number): number {
  if (ref === undefined) return fallback;
  const letters = /^([A-Z]{1,3})[0-9]+$/.exec(ref)?.[1];
  if (!letters) throw invalid();
  return (
    [...letters].reduce(
      (sum, letter) => sum * 26 + letter.charCodeAt(0) - 64,
      0,
    ) - 1
  );
}

function cell(node: Node, shared: () => string[]): ImportCell | undefined {
  if ('f' in node) return { kind: 'formula' };
  const type = attr(node, 't') ?? 'n';
  if (type === 'e') return { kind: 'error' };
  if (type === 'inlineStr') return { kind: 'text', value: text(node.is) };
  if (!('v' in node)) return undefined;
  const value = text(node.v);
  if (type === 's') {
    const index = /^(0|[1-9][0-9]{0,8})$/.test(value) ? Number(value) : -1;
    const strings = shared();
    if (index < 0 || index >= strings.length) throw invalid();
    return { kind: 'text', value: strings[index] ?? '' };
  }
  if (type === 'b')
    return { kind: 'text', value: value === '1' ? 'true' : 'false' };
  if (type === 'str' || type === 'd') return { kind: 'text', value };
  if (type !== 'n') throw invalid();
  const number = Number(value);
  if (value.trim() === '' || !Number.isFinite(number)) throw invalid();
  return { kind: 'number', value: String(number) };
}

/**
 * First worksheet as sparse rows keyed by the 1-based sheet row number.
 * `maxRows` (data rows) bounds `<row>` and `<si>` elements before parsing.
 */
export function xlsxRows(
  bytes: Buffer,
  maxRows: number,
): { index: number; cells: ImportCell[] }[] {
  // Any unexpected extraction failure (incl. RangeError) is a bad file, not 500.
  try {
    return readRows(bytes, maxRows);
  } catch (error) {
    if (error instanceof DomainError) throw error;
    throw invalid();
  }
}

function readRows(
  bytes: Buffer,
  maxRows: number,
): { index: number; cells: ImportCell[] }[] {
  const entries = zipEntries(bytes, MAX_ENTRIES);
  const types = child(
    xml(
      bytes,
      entries,
      '[Content_Types].xml',
      META_CAP,
      budgetOf(TYPES_ELEMENTS, 'file'),
    ),
    'Types',
  );
  const workbookPart = nodes(types?.Override).find(
    (item) => attr(item, 'ContentType') === WORKBOOK_TYPE,
  );
  const workbookPath = resolve('', attr(workbookPart, 'PartName') ?? '');
  const slash = workbookPath.lastIndexOf('/');
  const dir = slash < 0 ? '' : workbookPath.slice(0, slash + 1);
  const relsPath = `${dir}_rels/${workbookPath.slice(slash + 1)}.rels`;
  const workbook = child(
    xml(
      bytes,
      entries,
      workbookPath,
      META_CAP,
      budgetOf(WORKBOOK_ELEMENTS, 'file'),
    ),
    'workbook',
  );
  const first = nodes(child(workbook, 'sheets')?.sheet)[0];
  const relations = nodes(
    child(
      xml(bytes, entries, relsPath, META_CAP, budgetOf(RELS_ELEMENTS, 'file')),
      'Relationships',
    )?.Relationship,
  );
  if (relations.some((item) => attr(item, 'TargetMode') === 'External'))
    throw invalid();
  const target = (item: Node | undefined) => {
    const path = attr(item, 'Target');
    if (!path) throw invalid();
    return resolve(dir, path);
  };
  const sheetId = attr(first, 'id');
  const sheet = relations.find(
    (item) => sheetId && attr(item, 'Id') === sheetId,
  );
  const sharedPart = relations.find((item) =>
    SHARED_STRINGS.test(attr(item, 'Type') ?? ''),
  );
  // Header + data rows + blank/formatted rows; blank rows never bypass this.
  const maxSheetRows = maxRows + 1 + BLANK_ROW_ALLOWANCE;
  const maxStrings = (maxRows + 1) * PRODUCT_IMPORT_HEADERS.length;
  let strings: string[] | undefined;
  const sharedStrings = () => {
    if (!sharedPart) return [];
    const si = child(
      xml(
        bytes,
        entries,
        target(sharedPart),
        SHEET_CAP,
        // At most one distinct string per template cell (+ header row).
        budgetOf(maxStrings * ELEMENTS_PER_STRING + METADATA_ELEMENTS, 'file', {
          name: 'si',
          max: maxStrings,
        }),
      ),
      'sst',
    )?.si;
    if (Array.isArray(si) && si.length > maxStrings)
      throw new DomainError('PRODUCT_IMPORT_LIMIT', { field: 'file' });
    return nodes(si).map(text);
  };
  const shared = () => (strings ??= sharedStrings());
  const sheetData = child(
    child(
      xml(
        bytes,
        entries,
        target(sheet),
        SHEET_CAP,
        budgetOf(
          maxSheetRows *
            (PRODUCT_IMPORT_HEADERS.length * ELEMENTS_PER_CELL +
              ELEMENTS_PER_ROW) +
            METADATA_ELEMENTS,
          'rows',
          { name: 'row', max: maxSheetRows },
        ),
      ),
      'worksheet',
    ),
    'sheetData',
  );
  const rows = nodes(sheetData?.row);
  // Post-parse recount (blank rows included) against the same allowance.
  if (rows.length > maxSheetRows)
    throw new DomainError('PRODUCT_IMPORT_LIMIT', { field: 'rows' });
  let previous = 0;
  return rows.map((row) => {
    const declared = attr(row, 'r');
    const index = declared === undefined ? previous + 1 : Number(declared);
    if (!Number.isInteger(index) || index <= previous || index > MAX_SHEET_ROW)
      throw invalid();
    previous = index;
    const cells: ImportCell[] = [];
    let next = 0;
    for (const node of nodes(row.c)) {
      const at = column(attr(node, 'r'), next);
      if (at < next) throw invalid();
      next = at + 1;
      const value = cell(node, shared);
      if (value === undefined) continue;
      if (at >= IMPORT_MAX_COLUMNS) throw invalid();
      cells[at] = value;
    }
    return {
      index,
      cells: Array.from(cells, (value) => value ?? { kind: 'text', value: '' }),
    };
  });
}
