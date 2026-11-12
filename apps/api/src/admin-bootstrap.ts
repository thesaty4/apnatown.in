import 'reflect-metadata';
import { Module, type DynamicModule } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PhoneInputSchema } from '@apnatown/shared/users';
import { parseConfig, type RuntimeConfig } from './shared/config/config';
import { IDENTITY_CRYPTO, NodeIdentityCrypto } from './shared/auth/crypto';
import { RuntimeModule } from './shared/health/runtime.module';
import { UNIT_OF_WORK, type UnitOfWork } from './shared/persistence/ports';
import { ID_PROVIDER, type IdProvider } from './shared/runtime/providers';
import { AuditModule } from './modules/audit/audit.module';
import {
  AUDIT_WRITER,
  type AuditWriter,
} from './modules/audit/application/audit-writer.port';
import { USERS_REPOSITORY } from './modules/users/domain/identity';
import { USER_ROLES_REPOSITORY } from './modules/users/domain/user-roles';
import { PrismaUsersRepository } from './modules/users/infrastructure/users.repository';
import { PrismaUserRolesRepository } from './modules/users/infrastructure/user-roles.repository';
import { IdentityService } from './modules/users/application/identity.service';
import { UserRolesService } from './modules/users/application/user-roles.service';
import {
  ADMIN_REPOSITORY,
  type AdminRepository,
} from './modules/admin/domain/admin';
import { PrismaAdminRepository } from './modules/admin/infrastructure/prisma-admin.repository';

const HELP = `Usage: pnpm --filter @apnatown/api admin:bootstrap -- --phone=<+91XXXXXXXXXX>

Grants the super_admin role to an existing user identified by verified phone.
Operator-only, local/test bootstrap of the FIRST super_admin; only the
local/test \`db:seed\` demo personas (docs/adr/0002) seed admin accounts, and
after that seed this command refuses because the demo Super Admin exists. The command:
  - refuses unless APP_ENV is local or test (never production);
  - refuses when an active super_admin already exists;
  - requires an existing, active user (sign in once with OTP first);
  - refuses when that user already has an admin account;
  - writes an audit entry with actor "system" in the same transaction.

Options:
  --phone=<phone>   Indian mobile (+91XXXXXXXXXX or 10 digits). May instead be
                    supplied via the ADMIN_BOOTSTRAP_PHONE environment variable.
  --help            Show this help.

Requires the API runtime environment (DATABASE_URL, PII/phone-lookup keys, …)
and applied migrations.
`;
const SAFE_ERRORS = new Set([
  'INVALID_ARGUMENTS',
  'PRODUCTION_REFUSED',
  'SUPER_ADMIN_EXISTS',
  'USER_NOT_FOUND',
  'ADMIN_EXISTS',
]);

@Module({})
class AdminBootstrapModule {
  static forRoot(config: RuntimeConfig): DynamicModule {
    const runtime = RuntimeModule.forRoot(config);
    return {
      module: AdminBootstrapModule,
      imports: [runtime, AuditModule.forRoot(runtime)],
      providers: [
        {
          provide: IDENTITY_CRYPTO,
          useFactory: () =>
            new NodeIdentityCrypto(
              config.PII_ENCRYPTION_KEY,
              config.PHONE_LOOKUP_HASH_KEY,
            ),
        },
        { provide: USERS_REPOSITORY, useClass: PrismaUsersRepository },
        { provide: USER_ROLES_REPOSITORY, useClass: PrismaUserRolesRepository },
        { provide: ADMIN_REPOSITORY, useClass: PrismaAdminRepository },
        IdentityService,
        UserRolesService,
      ],
    };
  }
}

function parseArgs(argv: readonly string[]): { help: boolean; phone?: string } {
  const args = argv.filter((arg) => arg !== '--');
  if (args.includes('--help')) return { help: true };
  const phones = args.filter((arg) => arg.startsWith('--phone='));
  if (args.length !== phones.length || phones.length > 1)
    throw new Error('INVALID_ARGUMENTS');
  const phone =
    phones[0]?.slice('--phone='.length) ?? process.env.ADMIN_BOOTSTRAP_PHONE;
  if (!phone || !PhoneInputSchema.safeParse(phone).success)
    throw new Error('INVALID_ARGUMENTS');
  return { help: false, phone };
}

async function main(): Promise<void> {
  const { help, phone } = parseArgs(process.argv.slice(2));
  if (help || !phone) {
    process.stdout.write(HELP);
    return;
  }
  // Checked before config parsing so production is refused unconditionally.
  if (process.env.APP_ENV !== 'local' && process.env.APP_ENV !== 'test')
    throw new Error('PRODUCTION_REFUSED');
  const config = parseConfig(process.env);
  const app = await NestFactory.createApplicationContext(
    AdminBootstrapModule.forRoot(config),
    { logger: false, abortOnError: false },
  );
  try {
    const uow = app.get<UnitOfWork>(UNIT_OF_WORK);
    const identity = app.get(IdentityService);
    const roles = app.get(UserRolesService);
    const admins = app.get<AdminRepository>(ADMIN_REPOSITORY);
    const audit = app.get<AuditWriter>(AUDIT_WRITER);
    const ids = app.get<IdProvider>(ID_PROVIDER);
    await uow.run(async (tx) => {
      const existing = await roles.activeHolders(
        { role: 'super_admin', limit: 1 },
        tx,
      );
      if (existing.length) throw new Error('SUPER_ADMIN_EXISTS');
      const userId = await identity.findByPhone(tx, phone);
      const principal = userId
        ? await identity.readPrincipal(tx, userId)
        : null;
      if (!principal) throw new Error('USER_NOT_FOUND');
      if (await admins.read(tx, principal.userId))
        throw new Error('ADMIN_EXISTS');
      await roles.assignApprovedRole(
        {
          userId: principal.userId,
          role: 'super_admin',
          sourceId: principal.userId,
          caller: 'admin',
        },
        tx,
      );
      await audit.record(tx, {
        actor: { userId: null, role: 'system', label: 'System' },
        action: 'admin.super_admin_bootstrapped',
        entityType: 'user',
        entityId: principal.userId,
        summary: 'Granted super_admin via operator bootstrap command',
        before: { roles: [...principal.roles].sort() },
        after: {
          roles: [...new Set([...principal.roles, 'super_admin'])].sort(),
        },
        fields: ['roles'],
        correlationId: `bootstrap-${ids.uuidv7()}`,
      });
    });
    process.stdout.write('super_admin granted\n');
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  // Never echo the phone or database details.
  const message = error instanceof Error ? error.message : '';
  process.stderr.write(
    `${SAFE_ERRORS.has(message) ? message : 'ADMIN_BOOTSTRAP_FAILED'}\n`,
  );
  if (message === 'INVALID_ARGUMENTS') process.stderr.write(HELP);
  process.exitCode = 1;
});
