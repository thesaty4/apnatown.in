import { Controller, Get, Header, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BillingOverviewSchema, EarningsSchema } from '@apnatown/shared/earnings';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { createZodDto } from 'nestjs-zod';
import { OwnAccount, type AuthRequest } from '../../../shared/auth';
import { PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors } from '../../admin/presentation/admin.dto';
import { BusinessKindHeader, owner } from '../../businesses/presentation/business.dto';
import { OwnerEarningsService } from '../application/owner-earnings.service';

class EarningsDto extends createZodDto(EarningsSchema) {}
class BillingOverviewDto extends createZodDto(BillingOverviewSchema) {}

const READ_LIMIT = { key: 'payments.owner.read', maximumHits: 60, windowSeconds: 60, subject: 'principal' } as const;
const OWNER =
  "Owner of an APPROVED vendor/provider business with its live seller role, resolved server-side (X-Business-Kind selects between the caller's own businesses). Read-only. private, no-store.";
const ERRORS = {
  400: 'VALIDATION_ERROR for any query parameter or an invalid X-Business-Kind.',
  401: 'SESSION_EXPIRED without a signed-in session.',
  403: 'COMMON_FORBIDDEN when the caller has no approved selling business.',
  422: 'BUSINESS_CONTEXT_REQUIRED when the caller owns both kinds and sent no X-Business-Kind.',
  429: 'COMMON_RATE_LIMITED with Retry-After.',
} as const;

/** S-VEND-16 Earnings & plan (F-VD-017). */
@ApiTags('payments')
@PrivateApi()
@OwnAccount()
@Controller('payments/me')
export class OwnerEarningsController {
  constructor(private readonly earnings: OwnerEarningsService) {}

  @Get('earnings')
  @Header('Cache-Control', 'private, no-store')
  @BusinessKindHeader()
  @ApiOperation({
    operationId: 'paymentsMeEarnings',
    summary: 'Current-month sales, estimated commission and six-month chart',
    description: `Sales = fulfilled (delivered/picked up) orders with a paid/collected payment, at fulfilled items − discount, by IST month. Commission is an estimate at the current plan (else platform default) rate; null when no policy is configured. Payout schedule and invoices are unavailable (never fabricated). ${OWNER}`,
  })
  @ApiOkResponse({ type: EarningsDto })
  @AdminErrors(ERRORS)
  @RateLimit(READ_LIMIT)
  summary(@Req() request: AuthRequest, @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>) {
    return this.earnings.summary(owner(request));
  }

  @Get('subscription')
  @Header('Cache-Control', 'private, no-store')
  @BusinessKindHeader()
  @ApiOperation({
    operationId: 'paymentsMeSubscription',
    summary: 'Current plan, configured plans and promotion options',
    description: `Enabled plans from Settings with the current one marked (active subscription, else the free plan); enabled promotion fees. purchaseAvailable is false until online payments and reviewed billing ship. Null lists = not configured. ${OWNER}`,
  })
  @ApiOkResponse({ type: BillingOverviewDto })
  @AdminErrors(ERRORS)
  @RateLimit(READ_LIMIT)
  billing(@Req() request: AuthRequest, @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>) {
    return this.earnings.billing(owner(request));
  }
}
