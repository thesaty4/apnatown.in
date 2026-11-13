import { z } from 'zod';
import { mapEnvironmentSchema } from './maps';

const origin = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (
      ['http:', 'https:'].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      url.pathname === '/' &&
      !url.search &&
      !url.hash
    );
  }, 'Expected an HTTP(S) origin without credentials, path, query or fragment');

export const webEnvironmentSchema = z
  .object({
    APP_ENV: z.enum(['local', 'test', 'production']),
    APP_BASE_URL: origin,
    API_INTERNAL_ORIGIN: origin,
    // Local/test-only Demo controls (docs/adr/0002); must match the API flag.
    DEMO_LOGIN_ENABLED: z
      .preprocess(
        (value) => (value === '' ? undefined : value),
        z.enum(['true', 'false']).default('false'),
      )
      .transform((value) => value === 'true'),
    ...mapEnvironmentSchema.shape,
  })
  .superRefine((value, context) => {
    if (value.APP_ENV === 'production' && value.DEMO_LOGIN_ENABLED) {
      context.addIssue({
        code: 'custom',
        path: ['DEMO_LOGIN_ENABLED'],
        message: 'Demo sign-in is local/test only',
      });
    }
    if (
      value.APP_ENV === 'production' &&
      !value.APP_BASE_URL.startsWith('https://')
    ) {
      context.addIssue({
        code: 'custom',
        path: ['APP_BASE_URL'],
        message: 'HTTPS required in production',
      });
    }
  });

export function parseWebEnvironment(input: Record<string, unknown>) {
  const result = webEnvironmentSchema.safeParse(input);
  if (!result.success) {
    // Do not echo submitted environment values (including accidentally supplied secrets).
    throw new Error(
      `Invalid Web environment: ${result.error.issues.map((issue) => issue.path.join('.')).join(', ')}`,
    );
  }
  return result.data;
}
