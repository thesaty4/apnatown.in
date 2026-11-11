import {
  Inject,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { SessionService } from '../../modules/auth/application/session.service';
import { RUNTIME_CONFIG, type RuntimeConfig } from '../config/config';
import { DomainError } from '../errors/errors';
import { PROBE_ROUTE } from '../health/health.controller';
import { AUTH_ROUTE, type AuthRoutePolicy } from './metadata';
import { SessionCookie } from './cookie';
import { CsrfSynchronizer } from './csrf';
import type { AuthRequest } from './request';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionService,
    private readonly cookie: SessionCookie,
    private readonly csrf: CsrfSynchronizer,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const read = ['GET', 'HEAD'].includes(request.method);
    if (
      read &&
      this.reflector.get<boolean>(PROBE_ROUTE, context.getHandler()) === true
    )
      return true;
    const policy = this.reflector.getAllAndOverride<AuthRoutePolicy>(
      AUTH_ROUTE,
      [context.getHandler(), context.getClass()],
    );
    if (policy === 'public-read') {
      if (read) return true;
      throw new DomainError('COMMON_FORBIDDEN');
    }
    // New routes need an explicit policy; own-account access grants no cross-module authority.
    if (!policy || !['csrf', 'guest', 'own'].includes(policy))
      throw new DomainError('COMMON_FORBIDDEN');
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('Vary', 'Cookie, Origin');
    if (!EmptyRequestSchema.safeParse(request.query).success)
      throw new DomainError('VALIDATION_ERROR');
    this.checkOrigin(request, policy === 'csrf');
    if (policy === 'csrf') {
      if (!read) throw new DomainError('COMMON_FORBIDDEN');
      return true;
    }
    const resolved = await this.sessions.resolve(this.cookie.read(request));
    if (!resolved)
      throw new DomainError(
        policy === 'guest' ? 'CSRF_INVALID' : 'SESSION_EXPIRED',
      );
    request.authSession = {
      id: resolved.session.id,
      csrfToken: resolved.session.csrfToken,
    };
    request.csrfState = resolved.session.csrfToken;
    if (!read) this.csrf.protect(request, response);
    if (policy === 'guest' && resolved.session.kind !== 'anonymous')
      throw new DomainError('COMMON_FORBIDDEN');
    if (policy === 'own') {
      if (!resolved.principal) throw new DomainError('SESSION_EXPIRED');
      request.principal = resolved.principal;
      request.rateLimitPrincipalId = resolved.principal.userId;
    }
    return true;
  }
  private checkOrigin(request: AuthRequest, bootstrap: boolean): void {
    const origin = request.headers.origin;
    const site = request.headers['sec-fetch-site'];
    const read = ['GET', 'HEAD'].includes(request.method);
    if (
      (origin !== undefined &&
        origin !== new URL(this.config.WEB_ORIGIN).origin) ||
      site === 'cross-site' ||
      site === 'same-site' ||
      (!read && !origin) ||
      (bootstrap && !origin && site !== 'same-origin')
    )
      throw new DomainError('CSRF_INVALID');
  }
}
