import { Inject, Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { RUNTIME_CONFIG, type RuntimeConfig } from '../../../shared/config/config';
import type { AuthRequest } from '../../../shared/auth';

/**
 * Host-only guest-cart capability cookie (`__Host-` + Secure on HTTPS
 * origins, mirroring Auth's SessionCookie), separate from the session cookie.
 */
@Injectable()
export class GuestCartCookie {
  private readonly secure: boolean;
  readonly name: string;
  constructor(@Inject(RUNTIME_CONFIG) config: RuntimeConfig) {
    this.secure = new URL(config.WEB_ORIGIN).protocol === 'https:';
    this.name = this.secure ? '__Host-apnatown_cart' : 'apnatown_cart';
  }

  read(request: AuthRequest): unknown {
    const cookies: unknown = request.cookies;
    return cookies && typeof cookies === 'object' && Object.hasOwn(cookies, this.name)
      ? (cookies as Record<string, unknown>)[this.name]
      : undefined;
  }

  set(response: Response, token: string, maxAgeSeconds: number): void {
    response.cookie(this.name, token, {
      httpOnly: true,
      secure: this.secure,
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeSeconds * 1000,
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
