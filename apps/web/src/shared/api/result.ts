import type { z } from 'zod';
import { ErrorResponseSchema } from '@apnatown/shared/wire';
import type { ErrorDetails } from '@apnatown/shared/wire';

export class ApiFailure extends Error {
  constructor(
    public readonly code: string,
    public readonly fields: readonly string[] = [],
    public readonly status = 0,
    public readonly message_key = 'errors.common.requestFailed',
    public readonly details: ErrorDetails = {},
    public readonly correlationId?: string,
  ) {
    super(code);
  }
}

export type Resource<T> =
  { kind: 'ready'; data: T } | { kind: 'error'; code: string };

/** Never display server messages or turn a missing/malformed body into success. */
export function unwrap<T>(
  result: { data?: unknown; error?: unknown; response: Response },
  schema: z.ZodType<T>,
): T {
  if (!result.response.ok) {
    const parsed = ErrorResponseSchema.safeParse(result.error);
    const error = parsed.success ? parsed.data : undefined;
    throw new ApiFailure(
      error?.code ?? 'REQUEST_FAILED',
      error?.details?.fields ??
        (error?.details?.field ? [error.details.field] : []),
      result.response.status,
      error?.message_key,
      error?.details,
      error?.correlationId,
    );
  }
  const parsed = schema.safeParse(result.data);
  if (!parsed.success) throw new ApiFailure('INVALID_RESPONSE');
  return parsed.data;
}

export function failureCode(error: unknown): string {
  // Hydrated failures are safe plain objects, not Error instances.
  return error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string'
    ? error.code
    : 'REQUEST_FAILED';
}

/** Network/library failures must not leak messages, request URLs or payloads. */
export function normalizeFailure(error: unknown): ApiFailure {
  return error instanceof ApiFailure ? error : new ApiFailure('REQUEST_FAILED');
}

export async function resource<T>(
  load: () => Promise<T>,
): Promise<Resource<T>> {
  try {
    return { kind: 'ready', data: await load() };
  } catch (error) {
    return { kind: 'error', code: failureCode(error) };
  }
}
