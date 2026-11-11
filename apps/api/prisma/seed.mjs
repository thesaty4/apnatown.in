import { localTargets } from './targets.mjs';

export async function seed(env) {
  localTargets(env);
  throw new Error('C02_REQUIRED_NO_DOMAIN_SEED_ADAPTER');
}
