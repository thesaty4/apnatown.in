import { Module, type DynamicModule } from '@nestjs/common';
import {
  SETTINGS_REPOSITORY,
  SUPPORT_MESSAGE_REPOSITORY,
} from './domain/settings';
import { MaintenanceGuard } from './application/maintenance.guard';
import { PublicSettingsService } from './application/public-settings.service';
import {
  SETTINGS_READ,
  SETTINGS_TAX,
  SUPPORT_INTAKE,
  SUPPORT_READ,
} from './application/settings-ports';
import { SettingsEvents } from './application/settings-events';
import { SettingsReader } from './application/settings-reader';
import { SettingsService } from './application/settings.service';
import { SupportDataOwner } from './application/support-data-owner';
import { SupportService } from './application/support.service';
import { PrismaSettingsRepository } from './infrastructure/prisma-settings.repository';
import { PrismaSupportMessageRepository } from './infrastructure/prisma-support.repository';
import { PublicSettingsController } from './presentation/public-settings.controller';
import { SuperAdminSettingsController } from './presentation/super-admin-settings.controller';
import {
  AdminSupportMessagesController,
  SupportMessagesController,
} from './presentation/support.controller';

/**
 * Platform settings, feature flags, legal pages, support intake and the
 * maintenance admission guard. Other modules read configuration only through
 * SETTINGS_READ / SETTINGS_TAX and support through SUPPORT_READ/SUPPORT_INTAKE.
 */
@Module({})
export class SettingsModule {
  static forRoot(
    runtime: DynamicModule,
    users: DynamicModule,
    audit: DynamicModule,
    admin: DynamicModule,
  ): DynamicModule {
    return {
      module: SettingsModule,
      imports: [runtime, users, audit, admin],
      controllers: [
        PublicSettingsController,
        SuperAdminSettingsController,
        SupportMessagesController,
        AdminSupportMessagesController,
      ],
      providers: [
        { provide: SETTINGS_REPOSITORY, useClass: PrismaSettingsRepository },
        {
          provide: SUPPORT_MESSAGE_REPOSITORY,
          useClass: PrismaSupportMessageRepository,
        },
        SettingsReader,
        { provide: SETTINGS_READ, useExisting: SettingsReader },
        { provide: SETTINGS_TAX, useExisting: SettingsReader },
        SettingsEvents,
        SettingsService,
        PublicSettingsService,
        SupportService,
        { provide: SUPPORT_READ, useExisting: SupportService },
        { provide: SUPPORT_INTAKE, useExisting: SupportService },
        MaintenanceGuard,
      ],
      exports: [
        SETTINGS_READ,
        SETTINGS_TAX,
        SUPPORT_READ,
        SUPPORT_INTAKE,
        MaintenanceGuard,
      ],
    };
  }
}

/** Worker composition: the Users data owner for account-linked support messages. */
@Module({})
export class SettingsDataModule {
  static forRoot(runtime: DynamicModule): DynamicModule {
    return {
      module: SettingsDataModule,
      imports: [runtime],
      providers: [
        {
          provide: SUPPORT_MESSAGE_REPOSITORY,
          useClass: PrismaSupportMessageRepository,
        },
        SupportDataOwner,
      ],
      exports: [SupportDataOwner],
    };
  }
}
