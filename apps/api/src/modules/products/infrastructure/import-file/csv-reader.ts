import { DomainError } from '../../../../shared/errors/errors';

/** Widest record accepted; the template has 13 columns. */
export const IMPORT_MAX_COLUMNS = 64;

const invalid = () =>
  new DomainError('PRODUCT_IMPORT_INVALID', { field: 'file' });

/**
 * Strict RFC 4180 CSV records from already-decoded UTF-8 text.
 *
 * - Separator is `,` only; records end at CRLF, LF or CR (CRLF counts once).
 * - A field is quoted only when its first character is `"`; inside it `""`
 *   is a literal quote and separators/line breaks are data.
 * - A quote inside an unquoted field, any character other than a separator
 *   or line break after a closing quote, an unterminated quote, or more than
 *   IMPORT_MAX_COLUMNS fields is PRODUCT_IMPORT_INVALID {field:'file'}.
 * - Values are returned verbatim (no trimming, no type coercion).
 */
export function* csvRecords(text: string): Generator<string[]> {
  let at = 0;
  const length = text.length;
  while (at < length) {
    const record: string[] = [];
    for (;;) {
      let value = '';
      if (text[at] === '"') {
        at += 1;
        for (;;) {
          const close = text.indexOf('"', at);
          if (close < 0) throw invalid();
          value += text.slice(at, close);
          if (text[close + 1] === '"') {
            value += '"';
            at = close + 2;
          } else {
            at = close + 1;
            break;
          }
        }
        const next = text[at];
        if (
          next !== undefined &&
          next !== ',' &&
          next !== '\n' &&
          next !== '\r'
        )
          throw invalid();
      } else {
        const start = at;
        while (
          at < length &&
          text[at] !== ',' &&
          text[at] !== '\n' &&
          text[at] !== '\r'
        ) {
          if (text[at] === '"') throw invalid();
          at += 1;
        }
        value = text.slice(start, at);
      }
      record.push(value);
      if (record.length > IMPORT_MAX_COLUMNS) throw invalid();
      if (text[at] === ',') {
        at += 1;
        continue;
      }
      if (text[at] === '\r') at += text[at + 1] === '\n' ? 2 : 1;
      else if (text[at] === '\n') at += 1;
      break;
    }
    yield record;
  }
}

/** UTF-8 text without BOM; NUL or invalid UTF-8 is not a CSV file. */
export function csvText(bytes: Buffer): string {
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(
      bytes,
    );
  } catch {
    throw invalid();
  }
  if (text.includes('\u0000')) throw invalid();
  return text;
}
