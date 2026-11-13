import { DomainError } from '../../../../shared/errors/errors';

/** Longest accepted start/end tag, `<` to `>` inclusive. */
const MAX_TAG_LENGTH = 4096;
/** Deepest accepted element nesting (SpreadsheetML needs < 10). */
const MAX_DEPTH = 64;

/**
 * Pre-parse budget for one XML part, mirroring fast-xml-parser 5.x node
 * creation (processing instructions ignored, comments dropped, CDATA text):
 * - `elements`: start tags (every `<` that is not `</`, `<!--`, `<![CDATA[`
 *   or the leading `<?xml …?>` declaration);
 * - `attributes`: attribute-like tokens (each run of characters other than
 *   whitespace, `=`, `/` or quotes after the tag name, outside quoted values;
 *   so `a="1"b="2"` counts 2 — over-counts, never under);
 * - `named`: start tags whose local name (text after the FIRST `:`, as the
 *   parser's `removeNSPrefix` strips any prefix) equals `name`.
 * Whitespace is the parser's own `/\s/` (incl. U+00A0, \f, \v).
 * Over budget → PRODUCT_IMPORT_LIMIT {field}. Any other `<?`/`<!` construct,
 * an unterminated construct, a tag longer than 4 KiB or nesting deeper than
 * 64 → PRODUCT_IMPORT_INVALID {field:'file'}.
 */
export interface XmlBudget {
  elements: number;
  attributes: number;
  field: 'rows' | 'file';
  named?: { name: string; max: number };
}

const invalid = () =>
  new DomainError('PRODUCT_IMPORT_INVALID', { field: 'file' });

const WHITESPACE = /\s/;

/** Index just past `close`, searching from `from`; invalid when missing. */
function after(source: string, close: string, from: number): number {
  const end = source.indexOf(close, from);
  if (end < 0) throw invalid();
  return end + close.length;
}

/** Single linear pass (indexOf/charCode only; no backtracking regex). */
export function assertXmlBudget(source: string, budget: XmlBudget): void {
  const limit = () =>
    new DomainError('PRODUCT_IMPORT_LIMIT', { field: budget.field });
  let elements = 0;
  let attributes = 0;
  let named = 0;
  let depth = 0;
  let at = source.indexOf('<');
  while (at >= 0) {
    if (source.startsWith('<?', at)) {
      // Only a leading XML declaration; any other PI is rejected.
      if (at !== 0 || !/^<\?xml\s/.test(source.slice(0, 6))) throw invalid();
      at = source.indexOf('<', after(source, '?>', at + 2));
      continue;
    }
    if (source.startsWith('<!--', at)) {
      at = source.indexOf('<', after(source, '-->', at + 4));
      continue;
    }
    if (source.startsWith('<![CDATA[', at)) {
      at = source.indexOf('<', after(source, ']]>', at + 9));
      continue;
    }
    if (source[at + 1] === '!') throw invalid();
    const closing = source[at + 1] === '/';
    // Tag body up to the first `>` outside quotes, length-capped.
    let index = at + 1;
    let quote = 0;
    let nameEnd = -1;
    let tokens = 0;
    let inToken = false;
    let last = 0;
    for (; ; index += 1) {
      if (index >= source.length || index - at >= MAX_TAG_LENGTH)
        throw invalid();
      const code = source.charCodeAt(index);
      if (quote) {
        if (code === quote) quote = 0;
        continue;
      }
      if (code === 0x3e) break; // >
      const space = WHITESPACE.test(source[index] ?? '');
      if (space && nameEnd < 0) nameEnd = index;
      const separator =
        space ||
        code === 0x3d ||
        code === 0x2f ||
        code === 0x22 ||
        code === 0x27;
      if (code === 0x22 || code === 0x27) quote = code;
      // Attribute names start a token after the tag name (`= / " '` or space).
      if (!separator && !inToken && nameEnd >= 0) tokens += 1;
      inToken = !separator;
      if (!space) last = code;
    }
    if (closing) depth -= 1;
    else if (last !== 0x2f && ++depth > MAX_DEPTH) throw invalid();
    if (!closing) {
      if (++elements > budget.elements) throw limit();
      attributes += tokens;
      if (attributes > budget.attributes) throw limit();
      if (budget.named) {
        let name = source.slice(at + 1, nameEnd < 0 ? index : nameEnd);
        if (name.endsWith('/')) name = name.slice(0, -1);
        const colon = name.indexOf(':');
        if (colon >= 0) name = name.slice(colon + 1);
        if (name === budget.named.name && ++named > budget.named.max)
          throw limit();
      }
    }
    at = source.indexOf('<', index + 1);
  }
}
