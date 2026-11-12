import { Controller, Get, Header, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { PublicListingParamsSchema, ServicePublicSchema } from '@apnatown/shared';
import { PublicRoute } from '../../../shared/auth';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { ErrorDto } from '../../../shared/health/health.controller';
import { ServiceReadService } from '../application/service-read.service';
export class ServicePublicDto extends createZodDto(ServicePublicSchema) {}
@ApiTags('services')
@PublicRoute()
@Controller('services')
export class ServicePublicController {
  constructor(private readonly services: ServiceReadService) {}
  @Get(':slug')
  @Header('Cache-Control', 'private, no-store')
  @RateLimit({ key: 'services.public-read', subject: 'ip', maximumHits: 120, windowSeconds: 60 })
  @ApiOperation({ operationId: 'getPublicService', summary: 'Public service detail for /service/[slug]' })
  @ApiResponse({ status: 200, type: ServicePublicDto })
  @ApiResponse({ status: 404, type: ErrorDto })
  @ApiResponse({ status: 400, type: ErrorDto })
  read(@Param(new InputPipe(PublicListingParamsSchema)) params: { slug: string }) {
    return this.services.read(params.slug);
  }
}
