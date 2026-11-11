/** Per-response nonce for Next's bootstrap scripts; never use unsafe-inline. */
export function contentSecurityPolicy(
  nonce: string,
  development: boolean,
): string {
  if (!/^[A-Za-z0-9+/=]+$/.test(nonce)) throw new Error('Invalid CSP nonce');
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self'${development ? ' ws://localhost:* ws://127.0.0.1:*' : ''}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}
