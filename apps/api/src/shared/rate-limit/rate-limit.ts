import { createHmac } from 'node:crypto';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { z } from 'zod';
import type { Request, Response } from 'express';
import { DomainError } from '../errors/errors';
import { RUNTIME_CONFIG, type RuntimeConfig } from '../config/config';
import { currentCorrelationId } from '../logger/context';
import { RUNTIME_LOGGER } from '../logger/logger';
import type { Logger } from 'pino';
import { RATE_LIMIT_REPOSITORY, type RateLimitRepository } from './repository';

const RATE_LIMIT_POLICY = 'apnatown:rate-limit';
const policySchema = z.strictObject({
  key: z.string().regex(/^[a-z][a-z0-9._-]{0,63}$/),
  maximumHits: z.number().int().min(1).max(100_000),
  windowSeconds: z.number().int().min(1).max(86_400),
  // `session`: the authenticated user when present, else the anonymous session.
  subject: z.enum(['ip', 'principal', 'session']),
});
export type RateLimitPolicy = z.infer<typeof policySchema>;

/** One or more independent buckets; every listed policy must admit the request. */
export const RateLimit = (
  ...policies: [RateLimitPolicy, ...RateLimitPolicy[]]
): MethodDecorator => {
  const parsed = policies.map((policy) =>
    Object.freeze(policySchema.parse(policy)),
  );
  if (new Set(parsed.map((policy) => policy.key)).size !== parsed.length)
    throw new Error('DUPLICATE_RATE_LIMIT_POLICY');
  return SetMetadata(RATE_LIMIT_POLICY, Object.freeze(parsed));
};

interface RateLimitRequest extends Request {
  rateLimitPrincipalId?: string;
  rateLimitSessionId?: string;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(RATE_LIMIT_REPOSITORY)
    private readonly repository: RateLimitRepository,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
    @Inject(RUNTIME_LOGGER) private readonly logger: Logger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policies = this.reflector.getAllAndOverride<
      readonly RateLimitPolicy[]
    >(RATE_LIMIT_POLICY, [context.getHandler(), context.getClass()]);
    if (!policies) return true;
    const request = context.switchToHttp().getRequest<RateLimitRequest>();
    for (const policy of policies) {
      if (!policySchema.safeParse(policy).success)
        throw new Error('INVALID_RATE_LIMIT_POLICY');
      await this.consume(context, policy, this.subject(request, policy));
    }
    return true;
  }

  private subject(request: RateLimitRequest, policy: RateLimitPolicy): string {
    if (policy.subject === 'ip') {
      if (!request.ip) throw new DomainError('COMMON_UNAVAILABLE');
      return `ip:${request.ip}`;
    }
    if (request.rateLimitPrincipalId)
      return `principal:${request.rateLimitPrincipalId}`;
    if (policy.subject === 'session' && request.rateLimitSessionId)
      return `session:${request.rateLimitSessionId}`;
    throw new DomainError('COMMON_UNAUTHENTICATED');
  }

  private async consume(
    context: ExecutionContext,
    policy: RateLimitPolicy,
    subject: string,
  ): Promise<void> {

    const subjectHash = createHmac('sha256', this.config.CURSOR_SIGNING_KEY)
      .update(`rate-limit-v1\0${subject}`)
      .digest();
    let result: Awaited<ReturnType<RateLimitRepository['consume']>>;
    try {
      result = await this.repository.consume({
        policyKey: policy.key,
        subjectHash,
        windowSeconds: policy.windowSeconds,
        maximumHits: policy.maximumHits,
      });
    } catch {
      this.logger.error({
        event: 'rate_limit.store_failed',
        policy: policy.key,
        correlationId: currentCorrelationId(),
      });
      throw new DomainError('COMMON_UNAVAILABLE');
    }
    if (result.allowed) return;

    const response = context.switchToHttp().getResponse<Response>();
    response.setHeader('Retry-After', String(result.retryAfterSeconds));
    throw new DomainError('COMMON_RATE_LIMITED');
  }
}
