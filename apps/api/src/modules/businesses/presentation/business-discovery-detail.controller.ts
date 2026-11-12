import { Controller, Get, Header, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { PublicListingParamsSchema, BusinessDiscoveryDetailSchema } from '@apnatown/shared';
import { PublicRoute } from '../../../shared/auth';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { ErrorDto } from '../../../shared/health/health.controller';
import { BusinessDiscoveryDetailService } from '../application/business-discovery-detail.service';
export class BusinessDiscoveryDetailDto extends createZodDto(BusinessDiscoveryDetailSchema) {}
@ApiTags('businesses')
@PublicRoute()
@Controller('businesses/public')
export class BusinessDiscoveryDetailController {
  constructor(private readonly businesses: BusinessDiscoveryDetailService) {}
  @Get(':slug')
  @Header('Cache-Control', 'private, no-store')
  @RateLimit({ key: 'businesses.public-detail', subject: 'ip', maximumHits: 120, windowSeconds: 60 })
  @ApiOperation({ operationId: 'getPublicBusiness', summary: 'Public detail for /shop/[slug] or /provider/[slug]' })
  @ApiResponse({ status: 200, type: BusinessDiscoveryDetailDto })
  @ApiResponse({ status: 404, type: ErrorDto })
  @ApiResponse({ status: 400, type: ErrorDto })
  read(@Param(new InputPipe(PublicListingParamsSchema)) params: { slug: string }) {
    return this.businesses.read(params.slug);
  }
}
