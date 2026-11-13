import {
  AdminApprovalStatusSchema,
  AdminApprovalTypeSchema,
  type AdminApprovalType,
} from '@apnatown/shared/admin';
import type { z } from 'zod';

export type ApprovalStatus = z.infer<typeof AdminApprovalStatusSchema>;
export type ApprovalFilters = {
  type: AdminApprovalType;
  status: ApprovalStatus;
};

/** Prototype tab order: Businesses, Service providers, Riders. */
export const APPROVAL_TYPES: readonly AdminApprovalType[] =
  AdminApprovalTypeSchema.options;
/** Prototype filter order. The API has no "All" status (see FE report). */
export const APPROVAL_STATUSES: readonly ApprovalStatus[] =
  AdminApprovalStatusSchema.options;

const one = (value: string | string[] | null | undefined) =>
  Array.isArray(value) ? value[0] : (value ?? undefined);

/** URL `type`/`status`, validated against the API enums; anything else falls
 * back to the API defaults (business, pending). */
export function readApprovalFilters(
  read: (name: string) => string | string[] | null | undefined,
): ApprovalFilters {
  const type = AdminApprovalTypeSchema.safeParse(one(read('type')));
  const status = AdminApprovalStatusSchema.safeParse(one(read('status')));
  return {
    type: type.success ? type.data : 'business',
    status: status.success ? status.data : 'pending',
  };
}

/** Canonical list URL; defaults are omitted so shared links stay short. */
export function approvalsHref({ type, status }: ApprovalFilters) {
  const query = new URLSearchParams();
  if (type !== 'business') query.set('type', type);
  if (status !== 'pending') query.set('status', status);
  const search = query.toString();
  return search ? `/admin/approvals?${search}` : '/admin/approvals';
}

/** Detail URL. The list status rides along only to rebuild the Back link. */
export function approvalDetailHref(
  type: AdminApprovalType,
  id: string,
  status: ApprovalStatus = 'pending',
) {
  const base = `/admin/approvals/${type}/${id}`;
  return status === 'pending' ? base : `${base}?status=${status}`;
}
