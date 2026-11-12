import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SavedPageSchema, SavedQuerySchema } from '@apnatown/shared';
import { createZodDto } from 'nestjs-zod';
import { Roles, sessionBinding, type AuthRequest } from '../../../shared/auth';
import { PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { SavedService } from '../application/saved.service';

class SavedQueryDto extends createZodDto(SavedQuerySchema) {}
class SavedPageDto extends createZodDto(SavedPageSchema) {}

@ApiTags('engagement')
@PrivateApi()
@Controller('engagement/me/saved')
export class SavedController {
  constructor(private readonly saved: SavedService) {}

  @Get()
  @Roles('customer')
  @ApiOperation({
    operationId: 'engagementSaved',
    summary:
      'List own followed businesses or saved videos, including removable unavailable items',
  })
  @ApiOkResponse({ type: SavedPageDto })
  async list(
    @Req() request: AuthRequest,
    @Query(new InputPipe(SavedQuerySchema)) query: SavedQueryDto,
  ) {
    return SavedPageSchema.parse(
      await this.saved.list(sessionBinding(request), query),
    );
  }
}
