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
  subject: z.enum(['ip', 'principal']),
});
export type RateLimitPolicy = z.infer<typeof policySchema>;

export const RateLimit = (policy: RateLimitPolicy): MethodDecorator => {
  const parsed = policySchema.parse(policy);
  return SetMetadata(RATE_LIMIT_POLICY, Object.freeze(parsed));
};

interface RateLimitRequest extends Request {
  rateLimitPrincipalId?: string;
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
    const policy = this.reflector.getAllAndOverride<RateLimitPolicy>(
      RATE_LIMIT_POLICY,
      [context.getHandler(), context.getClass()],
    );
    if (!policy) return true;
    const parsedPolicy = policySchema.safeParse(policy);
    if (!parsedPolicy.success) throw new Error('INVALID_RATE_LIMIT_POLICY');

    const request = context.switchToHttp().getRequest<RateLimitRequest>();
    let subject: string;
    if (policy.subject === 'ip') {
      if (!request.ip) throw new DomainError('COMMON_UNAVAILABLE');
      subject = `ip:${request.ip}`;
    } else {
      if (!request.rateLimitPrincipalId)
        throw new DomainError('COMMON_UNAUTHENTICATED');
      subject = `principal:${request.rateLimitPrincipalId}`;
    }

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
    if (result.allowed) return true;

    const response = context.switchToHttp().getResponse<Response>();
    response.setHeader('Retry-After', String(result.retryAfterSeconds));
    throw new DomainError('COMMON_RATE_LIMITED');
  }
}
