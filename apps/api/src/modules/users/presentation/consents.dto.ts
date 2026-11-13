import { applyDecorators, type PipeTransform } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import type { z } from 'zod';
import {
  ConsentListSchema,
  ConsentRecordSchema,
  UpdateConsentSchema,
} from '@apnatown/shared/users';
import { AuthErrorDto } from '../../../shared/auth/openapi';
import { DomainError } from '../../../shared/errors/errors';

export class ConsentListDto extends createZodDto(ConsentListSchema) {}
export class ConsentRecordDto extends createZodDto(ConsentRecordSchema) {}
export class UpdateConsentDto extends createZodDto(UpdateConsentSchema) {}

/** Registry-field failures are CONSENT_PURPOSE_INVALID; anything else is VALIDATION_ERROR. */
export class ConsentInputPipe<T> implements PipeTransform<unknown, T> {
  constructor(
    private readonly schema: z.ZodType<T>,
    private readonly field: 'purpose' | 'channel',
  ) {}
  transform(value: unknown): T {
    const parsed = this.schema.safeParse(value);
    if (parsed.success) return parsed.data;
    if (parsed.error.issues.every((issue) => issue.path[0] === this.field))
      throw new DomainError('CONSENT_PURPOSE_INVALID', { field: this.field });
    throw new DomainError('VALIDATION_ERROR');
  }
}

/** Documents the flat error envelope for each listed status. */
export function ConsentErrors(responses: Readonly<Record<number, string>>) {
  return applyDecorators(
    ...Object.entries(responses).map(([status, description]) =>
      ApiResponse({ status: Number(status), type: AuthErrorDto, description }),
    ),
  );
}
