import { DomainError } from '../../../../shared/errors/errors';

/** Plain-object view of fast-xml-parser output plus text/entity helpers. */
const invalid = () =>
  new DomainError('PRODUCT_IMPORT_INVALID', { field: 'file' });

export type Node = Record<string, unknown>;
export const isNode = (value: unknown): value is Node =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
export const nodes = (value: unknown): Node[] =>
  Array.isArray(value) ? value.filter(isNode) : [];
export const child = (node: Node | undefined, name: string) =>
  isNode(node?.[name]) ? (node[name] as Node) : undefined;

const NAMED: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};
/** One-pass XML entity decoding (predefined + numeric references only). */
export function decode(raw: string): string {
  return raw.replace(
    /&(#x[0-9a-fA-F]{1,6}|#[0-9]{1,7}|amp|lt|gt|quot|apos);/g,
    (_match, ref: string) => {
      if (!ref.startsWith('#')) return NAMED[ref] ?? '';
      const code =
        ref[1] === 'x'
          ? Number.parseInt(ref.slice(2), 16)
          : Number.parseInt(ref.slice(1), 10);
      if (code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff) || code === 0)
        throw invalid();
      return String.fromCodePoint(code);
    },
  );
}
export const attr = (node: Node | undefined, name: string) => {
  const value = node?.[`@_${name}`];
  return typeof value === 'string' ? decode(value) : undefined;
};
/** Concatenated text of a `<t>` / rich-text `<r><t>` container. */
export function text(value: unknown): string {
  if (typeof value === 'string') return decode(value);
  if (!isNode(value)) return '';
  if ('#text' in value) return text(value['#text']);
  if ('t' in value) return text(value.t);
  return nodes(value.r)
    .map((run) => text(run.t))
    .join('');
}
