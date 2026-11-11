import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DomainError } from '../errors/errors';
import { PROBE_ROUTE } from './health.controller';

@Injectable()
export class ProbeOnlyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const method = context
      .switchToHttp()
      .getRequest<{ method: string }>().method;
    if (
      ['GET', 'HEAD'].includes(method) &&
      this.reflector.get<boolean>(PROBE_ROUTE, context.getHandler()) === true
    )
      return true;
    // Not a substitute for Auth: C00 has no session verifier or protected API.
    // Any accidentally registered non-probe handler is inaccessible by default.
    throw new DomainError('COMMON_UNAUTHENTICATED');
  }
}
