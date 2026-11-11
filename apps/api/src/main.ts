import { createApplication } from './bootstrap';
import { parseConfig } from './shared/config/config';
import { handleSignals } from './shared/lifecycle';
import { createLogger } from './shared/logger/logger';

async function main(): Promise<void> {
  const config = parseConfig(process.env);
  const { app, logger, shutdown } = await createApplication(config);
  await app.listen(config.PORT, '127.0.0.1');
  handleSignals(shutdown, logger);
  logger.info({ event: 'api.listening' });
}

void main().catch(() => {
  createLogger('error').error({ event: 'api.startup_failed' });
  process.exitCode = 1;
});
