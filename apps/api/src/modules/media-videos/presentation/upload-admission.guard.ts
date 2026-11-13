import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { AuthRequest } from '../../../shared/auth';
import { DomainError } from '../../../shared/errors/errors';
import { ImageService } from '../application/image.service';

/**
 * Runs before the multipart interceptor so accounts that can never upload
 * (e.g. plain customers) are rejected before any body is buffered.
 */
@Injectable()
export class UploadAdmissionGuard implements CanActivate {
  constructor(private readonly images: ImageService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const principal = ctx.switchToHttp().getRequest<AuthRequest>().principal;
    if (!principal || !(await this.images.mayStreamUpload(principal.userId, principal.roles)))
      throw new DomainError('COMMON_FORBIDDEN');
    return true;
  }
}
