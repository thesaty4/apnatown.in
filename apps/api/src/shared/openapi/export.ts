import 'reflect-metadata';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { HealthController } from '../health/health.controller';
import { ReadinessService } from '../health/readiness';

// Metadata-only composition; never imported by AppModule or WorkerModule.
// No runtime config, repository, DB client, provider, queue or listen.
@Module({
  controllers: [HealthController],
  providers: [{ provide: ReadinessService, useValue: Object.freeze({}) }],
})
class OpenApiModule {}

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((arg) => arg !== '--');
  if (args.length > 1 || (args[0] && !args[0].startsWith('--output='))) {
    throw new Error('Expected --output=<file>');
  }
  const output =
    args[0]?.slice('--output='.length) ||
    '../../packages/api-client/openapi.json';
  const app = await NestFactory.create(OpenApiModule, {
    logger: false,
    abortOnError: false,
  });
  try {
    const config = new DocumentBuilder()
      .setTitle('ApnaTown API')
      .setVersion('0.0.0')
      .addServer('/api')
      .build();
    const document = cleanupOpenApiDoc(
      SwaggerModule.createDocument(app, config),
    );
    for (const item of Object.values(document.paths)) {
      for (const operation of [item.get, item.head].filter(
        (value) => value !== undefined,
      )) {
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
        for (const [status, response] of Object.entries(operation.responses)) {
          if (response && !('$ref' in response))
            response.headers = {
              ...response.headers,
              'X-Correlation-ID': {
                schema: { type: 'string' },
                description: 'Validated or generated request ID',
              },
              ...(status === '429'
                ? {
                    'Retry-After': {
                      schema: { type: 'string', pattern: '^[0-9]+$' },
                      description: 'Seconds until this rate-limit window resets',
                    },
                  }
                : {}),
            };
        }
      }
    }
    await writeFile(resolve(output), `${JSON.stringify(document, null, 2)}\n`);
  } finally {
    await app.close();
  }
}

void main().catch((error: unknown) => {
  // Export runs without credentials or request input; report tooling diagnostics.
  process.stderr.write(
    `OpenAPI export failed: ${error instanceof Error ? error.message : 'unknown error'}\n`,
  );
  process.exitCode = 1;
});
