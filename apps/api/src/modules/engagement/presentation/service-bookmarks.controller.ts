import { Body, Controller, Delete, Header, Param, Put, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ServiceBookmarkResultSchema, ServiceBookmarkTargetTypeSchema } from '@apnatown/shared';
import { EmptyRequestSchema, IdSchema } from '@apnatown/shared/wire';
import { createZodDto } from 'nestjs-zod';
import { Roles, sessionBinding, type AuthRequest } from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { ServiceBookmarksService } from '../application/service-bookmarks.service';

class ServiceBookmarkResultDto extends createZodDto(ServiceBookmarkResultSchema) {}
const writeBudget = { key: 'engagement.bookmarks.write',maximumHits: 60,windowSeconds: 60,subject: 'principal' } as const;
@ApiTags('engagement')
@PrivateApi()
@Controller('engagement/bookmarks')
export class ServiceBookmarksController {
  constructor(private readonly bookmarks: ServiceBookmarksService) {}

  @Put(':targetType/:targetId')
  @Roles('customer')
  @BrowserMutation()
  @Header('Cache-Control','private, no-store')
  @RateLimit(writeBudget)
  @ApiParam({ name: 'targetType',enum: ['service'] })
  @ApiParam({ name: 'targetId',schema: { type: 'string',format: 'uuid' } })
  @ApiOperation({ operationId: 'engagementServiceBookmark',summary: 'Save a public service; retries preserve the original save time' })
  @ApiOkResponse({ type: ServiceBookmarkResultDto })
  async put(
    @Req() request: AuthRequest,
    @Param('targetType',new InputPipe(ServiceBookmarkTargetTypeSchema)) _targetType: 'service',
    @Param('targetId',new InputPipe(IdSchema)) targetId: string,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string,never>,
    @Body(new InputPipe(EmptyRequestSchema.default({}))) _body: Record<string,never>,
  ) {
    return ServiceBookmarkResultSchema.parse(await this.bookmarks.set(sessionBinding(request),targetId,true));
  }

  @Delete(':targetType/:targetId')
  @Roles('customer')
  @BrowserMutation()
  @Header('Cache-Control','private, no-store')
  @RateLimit(writeBudget)
  @ApiParam({ name: 'targetType',enum: ['service'] })
  @ApiParam({ name: 'targetId',schema: { type: 'string',format: 'uuid' } })
  @ApiOperation({ operationId: 'engagementServiceUnbookmark',summary: 'Remove own service bookmark, including unavailable or deleted targets' })
  @ApiOkResponse({ type: ServiceBookmarkResultDto })
  async remove(
    @Req() request: AuthRequest,
    @Param('targetType',new InputPipe(ServiceBookmarkTargetTypeSchema)) _targetType: 'service',
    @Param('targetId',new InputPipe(IdSchema)) targetId: string,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string,never>,
    @Body(new InputPipe(EmptyRequestSchema.default({}))) _body: Record<string,never>,
  ) {
    return ServiceBookmarkResultSchema.parse(await this.bookmarks.set(sessionBinding(request),targetId,false));
  }
}
