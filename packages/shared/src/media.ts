import { z } from 'zod';

/**
 * Browser-facing image paths stay on the application origin so Media can
 * reauthorize the current placement instead of exposing provider URLs.
 */
export const MediaGatewayPathSchema = z
  .string()
  .min(2)
  .max(2048)
  .regex(
    /^\/(?!\/)(?!.*%(?![A-Fa-f0-9]{2}))[A-Za-z0-9._~!$&'()*+,;=:@%/-]+$/u,
    'Expected a same-origin media path',
  )
  .describe(
    'Root-relative same-origin Media gateway path; provider URLs are invalid.',
  );
