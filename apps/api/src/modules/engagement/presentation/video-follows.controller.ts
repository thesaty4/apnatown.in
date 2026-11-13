import { Body, Controller, Delete, Param, Put, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  FollowResultSchema,
  FollowUpdateSchema,
} from '@apnatown/shared';
import { EmptyRequestSchema, IdSchema } from '@apnatown/shared/wire';
import { createZodDto } from 'nestjs-zod';
import { Roles, sessionBinding, type AuthRequest } from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { FollowsService } from '../application/follows.service';

class FollowUpdateDto extends createZodDto(FollowUpdateSchema) {}
class FollowResultDto extends createZodDto(FollowResultSchema) {}

@ApiTags('engagement')
@PrivateApi()
@Controller('engagement/follows')
export class VideoFollowsController {
  constructor(private readonly follows: FollowsService) {}

  @Put(':businessId')
  @Roles('customer')
  @BrowserMutation()
  @RateLimit({ key: 'engagement.follows.write', maximumHits: 60, windowSeconds: 60, subject: 'principal' })
  @ApiParam({ name: 'businessId', schema: { type: 'string', format: 'uuid' } })
  @ApiOperation({
    operationId: 'engagementFollowBusiness',
    summary: 'Follow a business from one of its currently public videos or update its notification bell',
  })
  @ApiOkResponse({ type: FollowResultDto })
  async follow(
    @Req() request: AuthRequest,
    @Param('businessId', new InputPipe(IdSchema)) businessId: string,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(FollowUpdateSchema)) body: FollowUpdateDto,
  ) {
    return FollowResultSchema.parse(
      await this.follows.set(
        { session: sessionBinding(request) },
        businessId,
        true,
        body,
      ),
    );
  }

  @Delete(':businessId')
  @Roles('customer')
  @BrowserMutation()
  @RateLimit({ key: 'engagement.follows.write', maximumHits: 60, windowSeconds: 60, subject: 'principal' })
  @ApiParam({ name: 'businessId', schema: { type: 'string', format: 'uuid' } })
  @ApiOperation({
    operationId: 'engagementUnfollowBusiness',
    summary: 'Unfollow a business and clear its notification bell',
  })
  @ApiOkResponse({ type: FollowResultDto })
  async unfollow(
    @Req() request: AuthRequest,
    @Param('businessId', new InputPipe(IdSchema)) businessId: string,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(EmptyRequestSchema.default({}))) _body: Record<string, never>,
  ) {
    return FollowResultSchema.parse(
      await this.follows.set(
        { session: sessionBinding(request) },
        businessId,
        false,
      ),
    );
  }
}
