import { AsyncLocalStorage } from 'node:async_hooks';
import { CorrelationIdSchema } from '@apnatown/shared/wire';

const storage = new AsyncLocalStorage<Readonly<{ correlationId: string }>>();

export function withCorrelation<T>(id: string, work: () => T): T {
  const parsed = CorrelationIdSchema.safeParse(id);
  if (!parsed.success) throw new Error('INVALID_CORRELATION_CONTEXT');
  return storage.run(Object.freeze({ correlationId: parsed.data }), work);
}

export function currentCorrelationId(): string | undefined {
  return storage.getStore()?.correlationId;
}
