import {
  Inject,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SessionService } from '../../auth/application/session.service';
import { SessionCookie } from '../../../shared/auth/cookie';
import {
  RUNTIME_CONFIG,
  type RuntimeConfig,
} from '../../../shared/config/config';
import { DomainError } from '../../../shared/errors/errors';
import { PROBE_ROUTE } from '../../../shared/health/health.controller';
import {
  MAINTENANCE_ADMISSION,
  type MaintenanceAdmissionClass,
} from '../../../shared/maintenance/admission';
import type { AuthRequest } from '../../../shared/auth/request';
import { SETTINGS_READ, type SettingsReadPort } from './settings-ports';

/**
 * Maintenance admission matrix. Runs before authentication: classification
 * is server-owned route metadata, never a body/header claim, and admission
 * never bypasses the route's normal Auth/CSRF/rate-limit/role/idempotency
 * guards. The flag is read authoritatively (no cache) per request.
 */
@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(SETTINGS_READ) private readonly settings: SettingsReadPort,
    private readonly sessions: SessionService,
    private readonly cookie: SessionCookie,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const handler = context.getHandler();
    if (this.reflector.get<boolean>(PROBE_ROUTE, handler) === true) return true;
    const admission = this.reflector.getAllAndOverride<
      MaintenanceAdmissionClass | undefined
    >(MAINTENANCE_ADMISSION, [handler, context.getClass()]);
    if (admission === 'always') return true;
    if (!(await this.maintenanceOn())) return true;
    if (admission === 'consent-withdrawal' && this.withdrawal(request))
      return true;
    if (admission === 'super' && (await this.superOrAnonymous(request)))
      return true;
    throw new DomainError(
      'MAINTENANCE',
      {},
      this.config.MAINTENANCE_RETRY_AFTER_SECONDS,
    );
  }

  private async maintenanceOn(): Promise<boolean> {
    try {
      return (await this.settings.getCurrentFlag('maintenance')).enabled;
    } catch {
      // Fail closed without exposing dependency details.
      throw new DomainError('COMMON_UNAVAILABLE');
    }
  }

  /** Only an opt-out choice is admitted; never a consent grant. */
  private withdrawal(request: AuthRequest): boolean {
    const body: unknown = request.body;
    return (
      typeof body === 'object' &&
      body !== null &&
      !Array.isArray(body) &&
      (body as Record<string, unknown>).granted === false
    );
  }

  /**
   * Anonymous/expired sessions continue to the normal guards (which deny)
   * so a super admin can re-authenticate; an authenticated non-super
   * principal is blocked here.
   */
  private async superOrAnonymous(request: AuthRequest): Promise<boolean> {
    try {
      const resolved = await this.sessions.resolve(this.cookie.read(request));
      return (
        !resolved?.principal || resolved.principal.roles.includes('super_admin')
      );
    } catch {
      return false;
    }
  }
}
