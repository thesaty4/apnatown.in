import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminMeSchema } from '@apnatown/shared/admin';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { adminContext, Roles, type AuthRequest } from '../../../shared/auth';
import { PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminAccountsService } from '../application/admin-accounts.service';
import { AdminErrors, AdminMeDto } from './admin.dto';

@ApiTags('admin')
@PrivateApi()
@Roles('admin', 'super_admin')
@Controller('admin')
export class AdminMeController {
  constructor(private readonly accounts: AdminAccountsService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Current admin identity and grants',
    description:
      'Server-resolved name, masked email, assigned areas, explicit whole-city grants, module permissions, communication scopes and scopeRevision. super_admin is platform-wide with all permissions. Grants are read per request; no-store.',
  })
  @ApiOkResponse({ type: AdminMeDto })
  @AdminErrors({
    403: 'COMMON_FORBIDDEN without an admin/super_admin role; ADMIN_INACTIVE for a deactivated admin.',
  })
  @RateLimit({
    key: 'admin.me.read',
    maximumHits: 120,
    windowSeconds: 60,
    subject: 'principal',
  })
  async me(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema))
    _query: Record<string, never> = {},
  ) {
    return AdminMeSchema.parse(await this.accounts.me(adminContext(request)));
  }
}
