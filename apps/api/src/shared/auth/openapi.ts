import { applyDecorators } from '@nestjs/common';
import { ApiHeader, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { ErrorResponseSchema } from '@apnatown/shared/wire';

export class AuthErrorDto extends createZodDto(ErrorResponseSchema) {}
export function PrivateApi() {
  return applyDecorators(
    ApiSecurity('sessionCookie'),
    ...[400, 401, 403, 404, 409, 410, 429, 500, 503].map((status) =>
      ApiResponse({
        status,
        type: AuthErrorDto,
        description: 'Flat error envelope; no submitted values or credentials.',
      }),
    ),
  );
}
export function BrowserMutation() {
  return applyDecorators(
    ApiHeader({
      name: 'Origin',
      required: true,
      schema: { type: 'string', format: 'uri' },
    }),
    ApiHeader({
      name: 'X-CSRF-Token',
      required: true,
      schema: { type: 'string', pattern: '^[a-f0-9]{256}$' },
    }),
  );
}
