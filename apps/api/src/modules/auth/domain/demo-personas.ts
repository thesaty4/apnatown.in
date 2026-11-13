import type { DemoPersona } from '@apnatown/shared/auth';
import type { UserRole } from '@apnatown/shared/users';

export interface DemoPersonaIdentity {
  /** Synthetic number from docs/design-context/10-sample-data.json. */
  readonly phone: string;
  /** Role the seeded user must already hold; never granted on sign-in. */
  readonly role: UserRole;
}

/**
 * Local/test-only Demo controls personas (docs/adr/0002). `pnpm db:seed`
 * creates these sample identities; the API and seed share this one map.
 */
export const DEMO_PERSONAS: Readonly<Record<DemoPersona, DemoPersonaIdentity>> =
  Object.freeze({
    customer: { phone: '9876543210', role: 'customer' }, // users u1 Rohit Kumar
    vendor: { phone: '9876500001', role: 'vendor' }, // biz b1 owner
    provider: { phone: '9876500101', role: 'provider' }, // svc s1 owner
    rider: { phone: '9876500401', role: 'rider' }, // riders r1 Sunil Yadav
    admin: { phone: '9876500501', role: 'admin' }, // admins ad1 Admin Kavita
    // TODO(verify): the sample pack has no Super Admin phone; this synthetic
    // number is outside every sample phone and seeded only by db:seed.
    super_admin: { phone: '9876500500', role: 'super_admin' },
  });
