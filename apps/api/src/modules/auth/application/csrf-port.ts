export const CSRF_TOKENS = Symbol('CSRF_TOKENS');
export interface CsrfTokens {
  generate(): string;
}
