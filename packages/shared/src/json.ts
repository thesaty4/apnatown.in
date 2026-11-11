export type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export function canonicalJson(value: unknown): string {
  const ancestors = new Set<object>();
  let remaining = 10000;
  const encode = (input: unknown, depth: number): string => {
    if (--remaining < 0 || depth > 16)
      throw new TypeError('JSON_VALUE_TOO_COMPLEX');
    if (input === null) return 'null';
    if (typeof input === 'boolean') return String(input);
    if (typeof input === 'number' && Number.isFinite(input)) {
      if (Number.isInteger(input) && !Number.isSafeInteger(input))
        throw new TypeError('JSON_INTEGER_UNSAFE');
      return JSON.stringify(input);
    }
    if (typeof input === 'string' && input.length <= 65536)
      return JSON.stringify(input);
    if (typeof input !== 'object' || ancestors.has(input))
      throw new TypeError('JSON_VALUE_INVALID');
    const prototype: unknown = Object.getPrototypeOf(input);
    if (
      !Array.isArray(input) &&
      prototype !== Object.prototype &&
      prototype !== null
    )
      throw new TypeError('JSON_VALUE_INVALID');
    ancestors.add(input);
    let result: string;
    if (Array.isArray(input)) {
      if (input.length > 10000) throw new TypeError('JSON_VALUE_TOO_COMPLEX');
      result = `[${Array.from(input, (item: unknown) => encode(item, depth + 1)).join(',')}]`;
    } else {
      const entries = Object.entries(input).sort(([a], [b]) =>
        a < b ? -1 : a > b ? 1 : 0,
      );
      if (entries.length > 10000) throw new TypeError('JSON_VALUE_TOO_COMPLEX');
      result = `{${entries
        .map(
          ([key, item]) => `${JSON.stringify(key)}:${encode(item, depth + 1)}`,
        )
        .join(',')}}`;
    }
    ancestors.delete(input);
    if (result.length > 65536) throw new TypeError('JSON_VALUE_TOO_LARGE');
    return result;
  };
  return encode(value, 0);
}
