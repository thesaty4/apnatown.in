import type { JsonValue } from '@apnatown/shared';

const REDACTED = '[redacted]';
/**
 * Key words whose values never enter audit diffs: phone, email, OTP/code,
 * documents, tokens, card/UPI, signed URLs, credentials and ciphertext.
 */
const SENSITIVE_WORDS = new Set([
  'phone',
  'mobile',
  'email',
  'mail',
  'otp',
  'code',
  'document',
  'documents',
  'doc',
  'docs',
  'token',
  'tokens',
  'card',
  'upi',
  'vpa',
  'url',
  'urls',
  'uri',
  'signed',
  'signature',
  'credential',
  'credentials',
  'password',
  'passcode',
  'secret',
  'cipher',
  'ciphertext',
  'aadhaar',
  'cvv',
  'ifsc',
]);
const SENSITIVE_PAIRS =
  /(storage|api|private|access|refresh)_key|account_number/;
function sensitiveKey(key: string): boolean {
  const snake = key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
  return (
    SENSITIVE_PAIRS.test(snake) ||
    snake.split(/[^a-z0-9]+/).some((word) => SENSITIVE_WORDS.has(word))
  );
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/;
const PATTERNS: readonly RegExp[] = [
  // URLs (including signed object URLs) and bare storage paths.
  /\b(?:https?|ftp|s3|gs):\/\/\S+/gi,
  // Emails and UPI handles (name@bank).
  /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+/gu,
  // Phone, card, account, OTP and code digit runs (4+ digits, separators allowed).
  /\+?\d(?:[\s-]?\d){3,}/g,
  // Opaque tokens/keys/ciphertexts.
  /[A-Za-z0-9_\-.]{24,}/g,
];

/** Redacts sensitive substrings and strips control characters. */
export function redactText(value: string): string {
  let text = value.replace(/\p{Cc}+/gu, ' ');
  for (const pattern of PATTERNS) text = text.replace(pattern, REDACTED);
  return text.trim();
}

function redactValue(value: JsonValue): JsonValue {
  if (typeof value === 'string')
    return UUID.test(value) || TIMESTAMP.test(value)
      ? value
      : redactText(value);
  if (Array.isArray(value)) return value.map(redactValue);
  if (value !== null && typeof value === 'object') {
    const result: Record<string, JsonValue> = {};
    for (const [key, child] of Object.entries(value))
      result[key] = sensitiveKey(key)
        ? REDACTED
        : redactValue(child as JsonValue);
    return result;
  }
  return value;
}

/** Recursive key- and value-based redaction for audit snapshots. */
export function redactSnapshot(
  snapshot: Readonly<Record<string, JsonValue>>,
): Record<string, JsonValue> {
  return redactValue(snapshot as JsonValue) as Record<string, JsonValue>;
}
