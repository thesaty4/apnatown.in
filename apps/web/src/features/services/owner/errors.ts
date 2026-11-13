/** Server code → `service.manager.errors.*` for a field it names. */
export function fieldIssue(code: string): string | null {
  switch (code) {
    case 'SERVICES_SUBCATEGORY_REQUIRED':
      return 'subcategory';
    case 'FEATURED_ENTITLEMENT_UNAVAILABLE':
      return 'featuredUnavailable';
    case 'SERVICES_INVALID':
      return 'invalid';
    default:
      return null;
  }
}

/** Server code → form-level `service.manager.errors.*`. */
export function formIssue(code: string, online: boolean) {
  if (!online) return 'offline';
  switch (code) {
    case 'USERS_APPROVAL_REQUIRED':
      return 'notApproved';
    case 'COMMON_FORBIDDEN':
      return 'forbidden';
    case 'SERVICES_INVALID_TRANSITION':
      return 'invalidTransition';
    case 'COMMON_NOT_FOUND':
      return 'notFound';
    case 'COMMON_RATE_LIMITED':
      return 'rateLimited';
    case 'SERVICES_INVALID':
    case 'COMMON_VALIDATION_FAILED':
    case 'VALIDATION_ERROR':
      return 'invalid';
    default:
      return 'requestFailed';
  }
}

/** Row status/delete failures → `service.manager.errors.*`. */
export function rowIssue(code: string, online: boolean) {
  if (!online) return 'offline';
  switch (code) {
    case 'SERVICES_VERSION_CONFLICT':
      return 'conflict';
    case 'USERS_APPROVAL_REQUIRED':
      return 'notApproved';
    case 'COMMON_FORBIDDEN':
      return 'forbidden';
    case 'COMMON_RATE_LIMITED':
      return 'rateLimited';
    case 'SERVICES_INVALID_TRANSITION':
      return 'invalidTransition';
    case 'COMMON_NOT_FOUND':
      return 'notFound';
    default:
      return 'requestFailed';
  }
}
