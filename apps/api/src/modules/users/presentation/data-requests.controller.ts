import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBody,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import {
  CreateDataRequestSchema,
  DataExportSchema,
  DataRequestAcceptedSchema,
  DataRequestCompletionSchema,
  DataRequestParamsSchema,
  DataRequestSchema,
  type CreateDataRequest,
  type DataRequestParams,
} from '@apnatown/shared/users';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import {
  OwnAccount,
  sessionBinding,
  type AuthRequest,
} from '../../../shared/auth';
import { PublicRoute } from '../../../shared/auth/metadata';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { DomainError } from '../../../shared/errors/errors';
import { currentCorrelationId } from '../../../shared/logger/context';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import type { AddressCommand } from '../application/address-command';
import { DataRequestService } from '../application/data-request.service';
import { ConsentErrors } from './consents.dto';
import {
  CreateDataRequestDto,
  DataExportDto,
  DataRequestAcceptedDto,
  DataRequestCompletionDto,
  DataRequestDto,
} from './data-requests.dto';

const requestIdParam = ApiParam({
  name: 'requestId',
  schema: { type: 'string', format: 'uuid' },
});
const policyPending =
  'Without an approved Q-32 policy the request is stored and reported as status "blocked" with failureCode POLICY_PENDING; nothing is erased and no retention period is guessed.';

function command(request: AuthRequest): AddressCommand {
  const correlationId = currentCorrelationId();
  if (!request.principal) throw new DomainError('SESSION_EXPIRED');
  if (!correlationId) throw new Error('MISSING_CORRELATION_CONTEXT');
  return {
    session: sessionBinding(request),
    actorId: request.principal.userId,
    correlationId,
    key: request.headers['idempotency-key'],
  };
}

@ApiTags('users')
@PrivateApi()
@OwnAccount()
@Controller('users/me/data-requests')
export class DataRequestsController {
  constructor(private readonly requests: DataRequestService) {}
  @Post()
  @HttpCode(202)
  @BrowserMutation()
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description:
      'Case-sensitive request key. Retrying the identical command within 24 hours returns the same request (rechecking current access) and may rotate the deletion completion capability; it never creates another job.',
    schema: {
      type: 'string',
      minLength: 1,
      maxLength: 128,
      pattern: '^[A-Za-z0-9._:-]+$',
    },
  })
  @ApiOperation({
    summary: 'Request an own data export or account deletion',
    description: `type "delete" requires confirmed: true (else VALIDATION_ERROR). An open deletion request is returned instead of creating another; a blocked/failed one is re-queued and resumes from recorded owner receipts. A confirmed, unfinished deletion returns a short-lived completionToken (only in this response, never stored in plaintext) for GET /users/data-requests/{requestId}/completion; it is omitted while its lifetime awaits Q-32 approval. ${policyPending}`,
  })
  @ApiBody({ type: CreateDataRequestDto })
  @ApiAcceptedResponse({ type: DataRequestAcceptedDto })
  @ConsentErrors({
    400: 'VALIDATION_ERROR for an invalid body/key, or deletion without confirmed: true.',
    403: 'ACCOUNT_UNAVAILABLE for a suspended/deleting account, or CSRF/Origin failure.',
    409: 'DATA_REQUEST_CONFLICT when the key was used for another type or an export is requested during a running deletion; COMMON_CONFLICT while the same key is in flight.',
    429: 'Request limit exceeded.',
  })
  @RateLimit({
    key: 'users.data-requests.create',
    maximumHits: 10,
    windowSeconds: 3600,
    subject: 'principal',
  })
  async create(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(CreateDataRequestSchema)) input: CreateDataRequest,
  ) {
    return DataRequestAcceptedSchema.parse(
      await this.requests.submit(command(request), input),
    );
  }
  @Get(':requestId')
  @requestIdParam
  @ApiOperation({
    summary: 'Read an own data request',
    description: `Owner-only status (queued, processing, blocked, completed, failed). downloadAvailable is true only for a completed, unexpired export. ${policyPending}`,
  })
  @ApiOkResponse({ type: DataRequestDto })
  @ConsentErrors({
    404: "DATA_REQUEST_NOT_FOUND for a missing or another user's request.",
  })
  @RateLimit({
    key: 'users.data-requests.read',
    maximumHits: 120,
    windowSeconds: 60,
    subject: 'principal',
  })
  async read(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(DataRequestParamsSchema)) params: DataRequestParams,
  ) {
    return DataRequestSchema.parse(
      await this.requests.read(sessionBinding(request), params.requestId),
    );
  }
  @Get(':requestId/export')
  @requestIdParam
  @ApiOperation({
    summary: 'Download an own completed data export',
    description:
      'JSON attachment of the private generated export. Ownership, account status and expiry are rechecked on every download. Sections whose owner module is not implemented yet are explicitly "unavailable".',
  })
  @ApiOkResponse({
    type: DataExportDto,
    headers: {
      'Content-Disposition': {
        schema: { type: 'string' },
        description: 'attachment; filename="apnatown-data-<requestId>.json"',
      },
    },
  })
  @ConsentErrors({
    404: "DATA_REQUEST_NOT_FOUND for a missing, non-export or another user's request.",
    409: 'DATA_REQUEST_NOT_READY until the export has completed.',
    410: 'DATA_EXPORT_EXPIRED after the artifact expiry.',
    503: 'COMMON_UNAVAILABLE when private storage is unavailable.',
  })
  @RateLimit({
    key: 'users.data-requests.export',
    maximumHits: 10,
    windowSeconds: 3600,
    subject: 'principal',
  })
  async download(
    @Req() request: AuthRequest,
    @Res({ passthrough: true }) response: Response,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(DataRequestParamsSchema)) params: DataRequestParams,
  ) {
    const artifact = DataExportSchema.parse(
      await this.requests.download(sessionBinding(request), params.requestId),
    );
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="apnatown-data-${artifact.requestId}.json"`,
    );
    return artifact;
  }
}

/**
 * Deletion completion status by request-bound capability, usable after
 * session revocation. Not an unauthenticated status lookup.
 */
@ApiTags('users')
@Controller('users/data-requests')
export class DataRequestCompletionController {
  constructor(private readonly requests: DataRequestService) {}
  @Get(':requestId/completion')
  @PublicRoute()
  @requestIdParam
  @ApiHeader({
    name: 'Authorization',
    required: true,
    description:
      'Bearer <completionToken> issued when the deletion was confirmed. Never send it in the URL.',
    schema: { type: 'string', pattern: '^Bearer [A-Za-z0-9_-]{43}$' },
  })
  @ApiOperation({
    summary: 'Read deletion status with the completion capability',
    description:
      'Returns only {status} for the deletion request bound to the capability. A missing, invalid, expired or mismatched capability is indistinguishable from a missing request. Response is no-store.',
  })
  @ApiOkResponse({ type: DataRequestCompletionDto })
  @ConsentErrors({
    400: 'VALIDATION_ERROR for an invalid requestId or query.',
    404: 'DATA_REQUEST_NOT_FOUND for any invalid capability.',
    429: 'Request limit exceeded.',
    500: 'Unexpected failure.',
  })
  @RateLimit({
    key: 'users.data-requests.completion',
    maximumHits: 30,
    windowSeconds: 60,
    subject: 'ip',
  })
  async completion(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(DataRequestParamsSchema)) params: DataRequestParams,
  ) {
    return DataRequestCompletionSchema.parse(
      await this.requests.completion(
        params.requestId,
        request.headers.authorization,
      ),
    );
  }
}
