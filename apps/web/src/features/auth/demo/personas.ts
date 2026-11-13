import type { DemoPersona } from '@apnatown/shared/auth';
import { publicHref, type Locale } from '../../../shared/i18n/preferences';

/** Prototype `ROLES` order and emoji (js3). */
export const demoRoles = [
  { persona: 'customer', label: 'customer', emoji: '🛍️' },
  { persona: 'vendor', label: 'vendor', emoji: '🏪' },
  { persona: 'provider', label: 'provider', emoji: '🔧' },
  { persona: 'rider', label: 'rider', emoji: '🛵' },
  { persona: 'admin', label: 'admin', emoji: '🛡️' },
  { persona: 'super_admin', label: 'superAdmin', emoji: '👑' },
] as const satisfies readonly {
  persona: DemoPersona;
  label: string;
  emoji: string;
}[];

const precedence: readonly DemoPersona[] = [
  'super_admin',
  'admin',
  'provider',
  'vendor',
  'rider',
  'customer',
];

/** The dashboard a session opens by default: its most privileged role. */
export function activePersona(roles: readonly string[]) {
  return precedence.find((role) => roles.includes(role));
}

/** Prototype `HOMEOF`, limited to dashboards that exist in this app. */
export function demoHome(persona: DemoPersona, locale: Locale) {
  const homes: Record<DemoPersona, string> = {
    customer: publicHref('/', locale),
    vendor: '/vendor/media',
    provider: '/provider/media',
    rider: '/rider/home',
    admin: '/admin',
    super_admin: '/super-admin',
  };
  return homes[persona];
}
