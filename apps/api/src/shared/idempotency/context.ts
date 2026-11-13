import { canonicalJson, type JsonValue } from '@apnatown/shared';
import { CorrelationIdSchema, IdSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import { DomainError } from '../errors/errors';
import type { CommandContext } from '../persistence/ports';
import { IdempotencyHasher } from './hasher';

export const COMMAND_CONTEXT_FACTORY = Symbol('COMMAND_CONTEXT_FACTORY');

const operationSchema = z.strictObject({
  name: z.string().regex(/^[A-Za-z0-9._:-]{1,200}$/),
  method: z.enum(['POST', 'PUT', 'PATCH', 'DELETE']),
  scope: z.enum(['principal', 'business']),
  successStatus: z.number().int().min(200).max(299),
});

const bindingSchema = z.strictObject({
  actorId: IdSchema,
  correlationId: CorrelationIdSchema,
  resource: z
    .string()
    .min(1)
    .max(2048)
    .regex(/^\/(?!\/)[^\p{Cc}\s?#\\]*$/u),
  business: z
    .strictObject({
      id: IdSchema,
      kind: z.enum(['shop', 'provider']),
    })
    .nullable(),
  expiresAt: z.date(),
});

const keySchema = z.string().regex(/^[A-Za-z0-9._:-]{1,128}$/);

export type HttpCommandOperation = z.infer<typeof operationSchema>;
export type HttpCommandBinding = z.infer<typeof bindingSchema>;

export interface HttpCommandInput {
  key: unknown;
  payload: JsonValue;
}

export class HttpCommandContextFactory {
  private readonly hasher: IdempotencyHasher;

  constructor(hashingKey: string) {
    this.hasher = new IdempotencyHasher(hashingKey);
  }

  create(
    operation: HttpCommandOperation,
    binding: HttpCommandBinding,
    input: HttpCommandInput,
  ): CommandContext {
    const policy = operationSchema.safeParse(operation);
    const trusted = bindingSchema.safeParse(binding);
    if (!policy.success || !trusted.success)
      throw new Error('INVALID_HTTP_COMMAND_BINDING');
    const { business } = trusted.data;
    if ((policy.data.scope === 'business') !== (business !== null))
      throw new Error('INVALID_HTTP_COMMAND_BUSINESS_SCOPE');

    const key = keySchema.safeParse(input.key);
    if (!key.success) throw new DomainError('COMMON_VALIDATION_FAILED');
    const requestHash = this.fingerprint(
      policy.data,
      trusted.data,
      input.payload,
    );
    return Object.freeze({
      actor: Object.freeze({ kind: 'user', id: trusted.data.actorId }),
      operation: policy.data.name,
      keyHash: this.hasher.hash('key', key.data),
      requestHash,
      correlationId: trusted.data.correlationId,
      successStatus: policy.data.successStatus,
      expiresAt: new Date(trusted.data.expiresAt.getTime()),
    });
  }

  private fingerprint(
    operation: HttpCommandOperation,
    binding: HttpCommandBinding,
    payload: JsonValue,
  ): Buffer {
    let encoded: string;
    try {
      encoded = canonicalJson({
        operation: operation.name,
        method: operation.method,
        resource: binding.resource,
        actorId: binding.actorId,
        business: binding.business,
        payload,
      });
    } catch (error) {
      if (error instanceof TypeError)
        throw new DomainError('COMMON_VALIDATION_FAILED');
      throw error;
    }
    return this.hasher.hash('request', encoded);
  }
}
