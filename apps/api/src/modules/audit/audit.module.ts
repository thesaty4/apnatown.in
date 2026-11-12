import { Module, type DynamicModule, type Provider } from '@nestjs/common';
import { AUDIT_WRITER } from './application/audit-writer.port';
import { AuditWriterService } from './application/audit-writer.service';
import { AuditReadService } from './application/audit-read.service';
import { AUDIT_LOG_REPOSITORY } from './domain/audit-log';
import { AUDIT_READ_REPOSITORY } from './domain/audit-read';
import { PrismaAuditLogRepository } from './infrastructure/audit-log.repository';
import { PrismaAuditReadRepository } from './infrastructure/audit-read.repository';
import { AdminAuditController } from './presentation/admin-audit.controller';
import { SuperAdminActivityController } from './presentation/super-admin-activity.controller';

const writerProviders: Provider[] = [
  { provide: AUDIT_LOG_REPOSITORY, useClass: PrismaAuditLogRepository },
  AuditWriterService,
  { provide: AUDIT_WRITER, useExisting: AuditWriterService },
];

/** Append-only audit trail (BR-12) plus scoped search, detail and export. */
@Module({})
export class AuditModule {
  /** Writer only (operator CLIs without the HTTP surface). */
  static forRoot(runtime: DynamicModule): DynamicModule {
    return {
      module: AuditModule,
      imports: [runtime],
      providers: writerProviders,
      exports: [AUDIT_WRITER],
    };
  }

  /** Writer plus the admin audit and super-admin activity endpoints. */
  static forApi(runtime: DynamicModule, users: DynamicModule): DynamicModule {
    return {
      module: AuditModule,
      imports: [runtime, users],
      controllers: [AdminAuditController, SuperAdminActivityController],
      providers: [
        ...writerProviders,
        { provide: AUDIT_READ_REPOSITORY, useClass: PrismaAuditReadRepository },
        AuditReadService,
      ],
      exports: [AUDIT_WRITER],
    };
  }
}
