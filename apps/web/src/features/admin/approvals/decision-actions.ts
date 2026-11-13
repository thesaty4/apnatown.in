import type { BusinessDecisionAction } from '@apnatown/shared/businesses';
import type { ButtonVariant } from '@apnatown/ui/primitives/Button';

/** ST-approval order: queue decisions first, then lifecycle actions. */
export const ACTION_ORDER: readonly BusinessDecisionAction[] = [
  'approve',
  'reject',
  'request_changes',
  'suspend',
  'deactivate',
  'restore',
];
export const ACTION_VARIANT: Record<BusinessDecisionAction, ButtonVariant> = {
  approve: 'primary',
  reject: 'danger',
  request_changes: 'outline',
  suspend: 'outline',
  deactivate: 'danger',
  restore: 'primary',
};
/** Reject/request changes need a reason the applicant will read. */
export const REASON_REQUIRED = new Set<BusinessDecisionAction>([
  'reject',
  'request_changes',
]);
/** Approve/restore confirm an impact; everything else collects a note. */
export const CONFIRM_ONLY = new Set<BusinessDecisionAction>([
  'approve',
  'restore',
]);
export const REASON_MIN = 10;
export const REASON_MAX = 500;
