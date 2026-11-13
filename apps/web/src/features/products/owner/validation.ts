/** Client mirror of the shared `plain()` rule: trimmed, length-bounded, no
 * angle brackets / control characters. Returns a `products.validation.*` key. */
export function plainError(
  value: string,
  max: number,
  required: boolean,
): 'required' | 'tooLong' | 'invalidText' | undefined {
  const text = value.trim();
  if (!text) return required ? 'required' : undefined;
  if (text.length > max) return 'tooLong';
  if (/[<>\p{Cc}]/u.test(text)) return 'invalidText';
  return undefined;
}

/** Multi-line variant: newline and tab are allowed. */
export function multilineError(value: string, max: number) {
  const text = value.trim();
  if (!text) return undefined;
  if (text.length > max) return 'tooLong' as const;
  // eslint-disable-next-line no-control-regex
  if (/[<>\u0000-\u0008\u000B-\u001F\u007F-\u009F]/u.test(text))
    return 'invalidText' as const;
  return undefined;
}

/** Trimmed text or null (blank clears an optional field). */
export const textOrNull = (value: string) => value.trim() || null;
