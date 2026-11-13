import { Inject, Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { RUNTIME_CONFIG, type RuntimeConfig } from '../config/config';
import type { AuthRequest } from './request';

@Injectable()
export class SessionCookie {
  private readonly secure: boolean;
  readonly name: string;
  constructor(@Inject(RUNTIME_CONFIG) config: RuntimeConfig) {
    this.secure = new URL(config.WEB_ORIGIN).protocol === 'https:';
    this.name = this.secure ? '__Host-apnatown_session' : 'apnatown_session';
  }
  read(request: AuthRequest): unknown {
    // No unsigned claims; cookie-parser only extracts the opaque credential.
    const cookies: unknown = request.cookies;
    return cookies &&
      typeof cookies === 'object' &&
      Object.hasOwn(cookies, this.name)
      ? (cookies as Record<string, unknown>)[this.name]
      : undefined;
  }
  set(response: Response, token: string, expiresAt: Date): void {
    response.cookie(this.name, token, {
      httpOnly: true,
      secure: this.secure,
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });
  }
  clear(response: Response): void {
    response.clearCookie(this.name, {
      httpOnly: true,
      secure: this.secure,
      sameSite: 'lax',
      path: '/',
    });
  }
}
