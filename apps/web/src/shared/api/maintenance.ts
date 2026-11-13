/** S-CUST-37 routing for a server 503 `MAINTENANCE`. Admission is BE-owned;
 * this only decides where the browser shows the blocked state. */

const base = 'https://apnatown.invalid';

/** A same-origin page path (with query) or undefined. Never an external URL,
 * API/asset path or the maintenance page itself. */
export function safeReturnPath(value: string | null | undefined) {
  if (
    !value ||
    value.length > 512 ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /[\\\p{Cc}]/u.test(value)
  )
    return undefined;
  let url: URL;
  try {
    url = new URL(value, base);
  } catch {
    return undefined;
  }
  if (
    url.origin !== base ||
    /^\/(?:hi\/)?(?:api|_next|maintenance)(?:\/|$)/.test(url.pathname)
  )
    return undefined;
  return `${url.pathname}${url.search}`;
}

/** Recovery and form screens handle MAINTENANCE in place: Auth/session
 * recovery, authenticated super-admin settings, and drafts that must survive. */
export function isMaintenanceExempt(path: string) {
  return (
    /^\/(?:super-admin)(?:\/|$)/.test(path) ||
    /^\/(?:hi\/)?(?:login|session-expired|maintenance|offline|help)(?:\/|$)/.test(
      path,
    )
  );
}

export function maintenanceHref(from: string | undefined, hindi: boolean) {
  const path = hindi ? '/hi/maintenance' : '/maintenance';
  const safe = safeReturnPath(from);
  return safe ? `${path}?${new URLSearchParams({ from: safe })}` : path;
}

/** Browser only. Keeps the current page path (a GET), never a pending POST. */
export function showMaintenance() {
  const { pathname, search } = window.location;
  if (isMaintenanceExempt(pathname)) return;
  window.location.assign(
    maintenanceHref(`${pathname}${search}`, /^\/hi(?:\/|$)/.test(pathname)),
  );
}
