import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  AddressSchema,
  AddressPageSchema,
  AddressParamsSchema,
  AddressListQuerySchema,
  CreateAddressSchema,
  UpdateAddressSchema,
  DeleteAddressSchema,
  AddressDeletedSchema,
  type CreateAddress,
  type UpdateAddress,
  type DeleteAddress,
} from '@apnatown/shared/users';
import { EmptyRequestSchema, type PageQuery } from '@apnatown/shared/wire';
import {
  OwnAccount,
  sessionBinding,
  type AuthRequest,
} from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { DomainError } from '../../../shared/errors/errors';
import { currentCorrelationId } from '../../../shared/logger/context';
import { AddressService } from '../application/address.service';
import type { AddressCommand } from '../application/address-command';
import {
  AddressDto,
  AddressPageDto,
  AddressQueryDto,
  CreateAddressDto,
  UpdateAddressDto,
  DeleteAddressDto,
  AddressDeletedDto,
} from './addresses.dto';

function IdempotentAddress() {
  return ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description:
      'Case-sensitive command key. Retry the identical command within 24 hours; replay rechecks current access.',
    schema: {
      type: 'string',
      minLength: 1,
      maxLength: 128,
      pattern: '^[A-Za-z0-9._:-]+$',
    },
  });
}
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
@Controller('users/me/addresses')
export class AddressesController {
  constructor(private readonly addresses: AddressService) {}
  @Get()
  @ApiQuery({ type: AddressQueryDto })
  @ApiOkResponse({ type: AddressPageDto })
  async list(
    @Req() request: AuthRequest,
    @Query(new InputPipe(AddressListQuerySchema)) query: PageQuery,
  ) {
    return AddressPageSchema.parse(
      await this.addresses.list(sessionBinding(request), query),
    );
  }
  @Post()
  @BrowserMutation()
  @IdempotentAddress()
  @ApiBody({ type: CreateAddressDto })
  @ApiOperation({
    description:
      'Coordinates are optional: supply both lat/lng or neither. Null clears a pair. City/area IDs are validated authoritatively; saving does not establish delivery serviceability.',
  })
  @ApiCreatedResponse({ type: AddressDto })
  async create(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(CreateAddressSchema)) input: CreateAddress,
  ) {
    return AddressSchema.parse(
      await this.addresses.create(command(request), input),
    );
  }
  @Patch(':addressId')
  @BrowserMutation()
  @IdempotentAddress()
  @ApiParam({ name: 'addressId', schema: { type: 'string', format: 'uuid' } })
  @ApiBody({ type: UpdateAddressDto })
  @ApiOperation({
    description:
      'Supply at least one editable field plus expectedVersion. Send lat/lng together, or both null to clear. The merged city/area pair must remain valid.',
  })
  @ApiOkResponse({ type: AddressDto })
  async update(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(AddressParamsSchema)) params: { addressId: string },
    @Body(new InputPipe(UpdateAddressSchema)) input: UpdateAddress,
  ) {
    return AddressSchema.parse(
      await this.addresses.update(command(request), params.addressId, input),
    );
  }
  @Delete(':addressId')
  @BrowserMutation()
  @IdempotentAddress()
  @ApiParam({ name: 'addressId', schema: { type: 'string', format: 'uuid' } })
  @ApiBody({ type: DeleteAddressDto })
  @ApiOkResponse({ type: AddressDeletedDto })
  async delete(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(AddressParamsSchema)) params: { addressId: string },
    @Body(new InputPipe(DeleteAddressSchema)) input: DeleteAddress,
  ) {
    return AddressDeletedSchema.parse(
      await this.addresses.delete(command(request), params.addressId, input),
    );
  }
}
