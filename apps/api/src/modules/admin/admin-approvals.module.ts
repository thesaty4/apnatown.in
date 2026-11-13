import { Module, type DynamicModule } from '@nestjs/common';
import { AdminApprovalsService } from './application/admin-approvals.service';
import { AdminApprovalsController } from './presentation/admin-approvals.controller';

/**
 * S-ADMN-02 approvals composition. Imports the owning modules' read ports
 * (Businesses applications, Audit entity history); writes nothing.
 */
@Module({})
export class AdminApprovalsModule {
  static forRoot(
    runtime: DynamicModule,
    businesses: DynamicModule,
    audit: DynamicModule,
  ): DynamicModule {
    return {
      module: AdminApprovalsModule,
      imports: [runtime, businesses, audit],
      controllers: [AdminApprovalsController],
      providers: [AdminApprovalsService],
    };
  }
}
