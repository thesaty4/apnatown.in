import type { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  type OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

const PROBE_PATHS = new Set(['/health/live', '/health/ready']);

// Paths omit the global `/api` prefix; the `/api` server entry supplies it.
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('ApnaTown API')
    .setVersion('0.0.0')
    .addServer('/api')
    .addCookieAuth(
      '__Host-apnatown_session',
      {
        type: 'apiKey',
        in: 'cookie',
        description:
          'HttpOnly host-only session; loopback HTTP uses apnatown_session. Never expose the cookie to JavaScript.',
      },
      'sessionCookie',
    )
    .build();
  const document = cleanupOpenApiDoc(
    SwaggerModule.createDocument(app, config, { ignoreGlobalPrefix: true }),
  );
  for (const [path, item] of Object.entries(document.paths)) {
    for (const operation of [
      item.get,
      item.head,
      item.post,
      item.patch,
      item.put,
      item.delete,
    ].filter((value) => value !== undefined)) {
      operation.parameters ??= [];
      operation.parameters.push({
        name: 'X-Correlation-ID',
        in: 'header',
        required: false,
        schema: {
          type: 'string',
          maxLength: 64,
          pattern: '^[A-Za-z0-9_-]+$',
        },
      });
      // Every non-probe route can be refused by the global maintenance guard.
      if (!PROBE_PATHS.has(path))
        operation.responses['503'] ??= {
          description:
            'MAINTENANCE (errors.system.maintenance) while maintenance mode is on and this route is not admitted',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorDto' },
            },
          },
        };
      for (const [status, response] of Object.entries(operation.responses)) {
        if (response && !('$ref' in response))
          response.headers = {
            ...response.headers,
            'X-Correlation-ID': {
              schema: { type: 'string' },
              description: 'Validated or generated request ID',
            },
            'Cache-Control': {
              schema: { type: 'string' },
              description:
                'Auth, own-account and admin responses are private, no-store.',
            },
            ...(status === '429'
              ? {
                  'Retry-After': {
                    schema: { type: 'string', pattern: '^[0-9]+$' },
                    description: 'Seconds until this rate-limit window resets',
                  },
                }
              : {}),
            ...(status === '503'
              ? {
                  'Retry-After': {
                    schema: { type: 'string', pattern: '^[0-9]+$' },
                    description:
                      'Seconds before retrying; sent with MAINTENANCE',
                  },
                }
              : {}),
          };
      }
    }
  }
  return document;
}
