import { Module, type DynamicModule } from '@nestjs/common';
import { AUDIT_WRITER } from './application/audit-writer.port';
import { AuditWriterService } from './application/audit-writer.service';
import { AUDIT_LOG_REPOSITORY } from './domain/audit-log';
import { PrismaAuditLogRepository } from './infrastructure/audit-log.repository';

/** Append-only audit trail (BR-12). Read/search endpoints are a later slice. */
@Module({})
export class AuditModule {
  static forRoot(runtime: DynamicModule): DynamicModule {
    return {
      module: AuditModule,
      imports: [runtime],
      providers: [
        { provide: AUDIT_LOG_REPOSITORY, useClass: PrismaAuditLogRepository },
        AuditWriterService,
        { provide: AUDIT_WRITER, useExisting: AuditWriterService },
      ],
      exports: [AUDIT_WRITER],
    };
  }
}
