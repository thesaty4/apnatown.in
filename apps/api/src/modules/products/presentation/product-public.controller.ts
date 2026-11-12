import { Controller, Get, Header, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { PublicListingParamsSchema, ProductPublicSchema } from '@apnatown/shared';
import { PublicRoute } from '../../../shared/auth';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { ErrorDto } from '../../../shared/health/health.controller';
import { ProductReadService } from '../application/product-read.service';

export class ProductPublicDto extends createZodDto(ProductPublicSchema) {}
@ApiTags('products')
@PublicRoute()
@Controller('products')
export class ProductPublicController {
  constructor(private readonly products: ProductReadService) {}
  @Get(':slug')
  @Header('Cache-Control', 'private, no-store')
  @RateLimit({ key: 'products.public-read', subject: 'ip', maximumHits: 120, windowSeconds: 60 })
  @ApiOperation({ operationId: 'getPublicProduct', summary: 'Public product detail for /product/[slug]; checkout is unavailable' })
  @ApiParam({ name: 'slug', schema: { type: 'string', pattern: '^[a-z0-9]+(-[a-z0-9]+)*$', maxLength: 80 } })
  @ApiResponse({ status: 200, type: ProductPublicDto })
  @ApiResponse({ status: 404, type: ErrorDto })
  @ApiResponse({ status: 400, type: ErrorDto })
  read(@Param(new InputPipe(PublicListingParamsSchema)) params: { slug: string }) {
    return this.products.read(params.slug);
  }
}
