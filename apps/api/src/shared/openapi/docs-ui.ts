import type { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import type { RuntimeConfig } from '../config/config';
import { buildOpenApiDocument } from './document';

// Local development only: production never exposes the API description.
export function mountLocalApiDocs(
  app: INestApplication,
  config: RuntimeConfig,
): void {
  if (config.APP_ENV !== 'local') return;
  SwaggerModule.setup('api/docs', app, () => buildOpenApiDocument(app), {
    jsonDocumentUrl: 'api/docs/openapi.json',
    yamlDocumentUrl: 'api/docs/openapi.yaml',
  });
}
