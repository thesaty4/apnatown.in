import type { DELIVERY_FAIL_REASONS } from '@apnatown/shared/delivery';

/** `rider.failReasons.*` message key per API delivery fail reason. */
export const failReasonKey = {
  customer_unreachable: 'customerUnreachable',
  wrong_address: 'wrongAddress',
  customer_cancelled: 'customerCancelled',
  vehicle_problem: 'vehicleProblem',
} as const satisfies Record<(typeof DELIVERY_FAIL_REASONS)[number], string>;
