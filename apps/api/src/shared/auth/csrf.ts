import { Injectable } from '@nestjs/common';
import { csrfSync } from 'csrf-sync';
import type { Request, Response } from 'express';
import type { CsrfTokens } from '../../modules/auth/application/csrf-port';
import { DomainError } from '../errors/errors';
import type { AuthRequest } from './request';

@Injectable()
export class CsrfSynchronizer implements CsrfTokens {
  private readonly sync = csrfSync({
    getTokenFromState: (request: Request) => (request as AuthRequest).csrfState,
    storeTokenInState: (request: Request, token: string | null | undefined) => {
      // The library is synchronous. Persistence happens in Auth's transaction,
      // never via a fire-and-forget callback or a second session store.
      const state = request as AuthRequest;
      if (token === null || token === undefined) delete state.csrfState;
      else state.csrfState = token;
    },
    getTokenFromRequest: (request: Request) => {
      const value = request.headers['x-csrf-token'];
      return typeof value === 'string' && /^[a-f0-9]{256}$/.test(value)
        ? value
        : undefined;
    },
  });
  generate(): string {
    return this.sync.generateToken({} as AuthRequest);
  }
  protect(request: AuthRequest, response: Response): void {
    this.sync.csrfSynchronisedProtection(
      request,
      response,
      (error?: unknown) => {
        if (error) throw new DomainError('CSRF_INVALID');
      },
    );
  }
}
