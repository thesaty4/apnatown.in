import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  SuggestSubcategorySchema,
  SuggestionDuplicateCheckSchema,
  SuggestionDuplicateResultSchema,
  SuggestionPageSchema,
  SuggestionSchema,
  type SuggestSubcategory,
  type SuggestionDuplicateCheck,
} from '@apnatown/shared/catalog';
import {
  EmptyRequestSchema,
  PageQuerySchema,
  type PageQuery,
} from '@apnatown/shared/wire';
import {
  OwnAccount,
  sessionBinding,
  type AuthRequest,
} from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { DomainError } from '../../../shared/errors/errors';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors, adminCommand } from '../../admin/presentation/admin.dto';
import {
  CatalogSuggestionsService,
  SUGGESTION_SUBMIT_LIMIT,
  type OwnerRequest,
} from '../application/catalog-suggestions.service';
import {
  CatalogPageQueryDto,
  SuggestSubcategoryDto,
  SuggestionDto,
  SuggestionDuplicateCheckDto,
  SuggestionDuplicateResultDto,
  SuggestionPageDto,
} from './catalog.dto';

const READ_LIMIT = {
  key: 'catalog.suggestion.read',
  maximumHits: 60,
  windowSeconds: 60,
  subject: 'principal',
} as const;
const OWNER =
  'Authenticated owner whose business holds the business.taxonomy-suggest capability and a resolved area; business, submitter, city and area are derived server-side, never from the body. Until the Businesses module binds its adapter no owner can be resolved and every call is denied with COMMON_FORBIDDEN. private, no-store.';
const FORBIDDEN =
  'COMMON_FORBIDDEN when no owned, capable, active business with a resolved area exists (always, until the Businesses module is available).';
const NOT_ADMITTED =
  'MAINTENANCE while maintenance mode is on; COMMON_UNAVAILABLE when the store is unavailable.';

function owner(request: AuthRequest): OwnerRequest {
  if (!request.principal) throw new DomainError('SESSION_EXPIRED');
  return {
    session: sessionBinding(request),
    actorId: request.principal.userId,
  };
}

@ApiTags('catalog')
@PrivateApi()
@OwnAccount()
@Controller('catalog')
export class OwnerCatalogSuggestionsController {
  constructor(private readonly suggestions: CatalogSuggestionsService) {}

  @Post('subcategory-suggestions/duplicate-check')
  @HttpCode(200)
  @BrowserMutation()
  @ApiBody({ type: SuggestionDuplicateCheckDto })
  @ApiOperation({
    operationId: 'catalogSuggestionDuplicateCheck',
    summary: 'Check a proposed subcategory for duplicates',
    description: `{categoryId,nameEn,nameHi?} against the active category: returns an exact normalized-name match flag (with the existing subcategory) and up to 5 ranked fuzzy candidates. Read-only; nothing is stored. ${OWNER}`,
  })
  @ApiOkResponse({ type: SuggestionDuplicateResultDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for invalid names or unexpected keys.',
    403: FORBIDDEN,
    404: 'CATEGORY_NOT_FOUND for a missing or inactive category.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  async duplicateCheck(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(SuggestionDuplicateCheckSchema))
    input: SuggestionDuplicateCheck,
  ) {
    return SuggestionDuplicateResultSchema.parse(
      await this.suggestions.duplicateCheck(owner(request), input),
    );
  }

  @Post('subcategory-suggestions')
  @BrowserMutation()
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description:
      'Case-sensitive key; retry the identical suggestion within 24 hours to replay the stored result (replay rechecks the owner capability).',
    schema: {
      type: 'string',
      minLength: 1,
      maxLength: 128,
      pattern: '^[A-Za-z0-9._:-]+$',
    },
  })
  @ApiBody({ type: SuggestSubcategoryDto })
  @ApiOperation({
    operationId: 'catalogSuggestionCreate',
    summary: 'Suggest a new subcategory',
    description: `{categoryId,nameEn,nameHi?,reason?,allowSimilar?} creates a pending suggestion. An exact normalized match with an existing subcategory or pending suggestion is refused; fuzzy candidates are refused with SUGGESTION_SIMILARITY_WARNING unless allowSimilar is true. The suggestion, one audit entry and catalog.suggestion.submitted commit atomically. Limited to ${SUGGESTION_SUBMIT_LIMIT.maximumHits} per hour per user. ${OWNER}`,
  })
  @ApiCreatedResponse({ type: SuggestionDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for invalid names/reason or unexpected keys; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    403: FORBIDDEN,
    404: 'CATEGORY_NOT_FOUND for a missing or inactive category.',
    409: 'SUGGESTION_DUPLICATE for an exact existing subcategory or pending suggestion; SUGGESTION_SIMILARITY_WARNING for fuzzy candidates without allowSimilar; idempotency conflicts.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit({ ...SUGGESTION_SUBMIT_LIMIT, subject: 'principal' })
  async submit(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(SuggestSubcategorySchema)) input: SuggestSubcategory,
  ) {
    return SuggestionSchema.parse(
      await this.suggestions.submit(adminCommand(request), input),
    );
  }

  @Get('me/subcategory-suggestions')
  @ApiQuery({ type: CatalogPageQueryDto })
  @ApiOperation({
    operationId: 'catalogMySuggestions',
    summary: "List the owner business's suggestions",
    description: `Newest first with a caller-bound keyset cursor; includes status, rejection reason and the approved/merged subcategory id. ${OWNER}`,
  })
  @ApiOkResponse({ type: SuggestionPageDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an invalid limit or cursor.',
    403: FORBIDDEN,
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  async mine(
    @Req() request: AuthRequest,
    @Query(new InputPipe(PageQuerySchema)) query: PageQuery,
  ) {
    return SuggestionPageSchema.parse(
      await this.suggestions.mine(owner(request), query),
    );
  }
}
