import 'server-only';
import { parseWebEnvironment } from './schema';

export function getWebEnvironment() {
  return parseWebEnvironment(process.env);
}
