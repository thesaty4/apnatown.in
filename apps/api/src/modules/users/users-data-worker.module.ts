import { Module, type DynamicModule } from '@nestjs/common';
import type { RuntimeConfig } from '../../shared/config/config';
import { IDENTITY_CRYPTO, NodeIdentityCrypto } from '../../shared/auth/crypto';
import { privateStorageProvider } from '../../integrations/storage/provider';
import { AuthSessionsModule } from '../auth/auth-sessions.module';
import { SupportDataOwner } from '../settings/application/support-data-owner';
import { SettingsDataModule } from '../settings/settings.module';
import { EngagementDataModule } from '../engagement/engagement-data.module';
import { ServiceBookmarkDataOwner } from '../engagement/application/service-bookmark-data-owner';
import { ADDRESS_REPOSITORY } from './domain/address';
import { CONSENT_REPOSITORY } from './domain/consent';
import { DATA_REQUEST_REPOSITORY } from './domain/data-request';
import { USERS_REPOSITORY } from './domain/identity';
import { AddressProjection } from './application/address-projection';
import { DataRequestEvents } from './application/data-request-events';
import { DataRequestProcessor } from './application/data-request-processor';
import {
  AddressDataOwner,
  ConsentDataOwner,
  ProfileDataOwner,
} from './application/user-data-owners';
import {
  USER_DATA_OWNERS,
  type UserDataPort,
} from './application/user-data-port';
import { PrismaAddressRepository } from './infrastructure/address.repository';
import { PrismaConsentRepository } from './infrastructure/consent.repository';
import { PrismaDataRequestRepository } from './infrastructure/data-request.repository';
import { PrismaUsersRepository } from './infrastructure/users.repository';

/**
 * Worker composition for Users data requests: the outbox handler plus the
 * owner registry (UserDataPort). Future owners (orders, reviews)
 * add their port implementation to USER_DATA_OWNERS.
 */
@Module({})
export class UsersDataWorkerModule {
  static forRoot(runtime: DynamicModule, config: RuntimeConfig): DynamicModule {
    return {
      module: UsersDataWorkerModule,
      imports: [
        runtime,
        AuthSessionsModule.forRoot(runtime),
        SettingsDataModule.forRoot(runtime),
        EngagementDataModule.forRoot(runtime),
      ],
      providers: [
        {
          provide: IDENTITY_CRYPTO,
          useFactory: () =>
            new NodeIdentityCrypto(
              config.PII_ENCRYPTION_KEY,
              config.PHONE_LOOKUP_HASH_KEY,
            ),
        },
        privateStorageProvider,
        { provide: USERS_REPOSITORY, useClass: PrismaUsersRepository },
        { provide: ADDRESS_REPOSITORY, useClass: PrismaAddressRepository },
        { provide: CONSENT_REPOSITORY, useClass: PrismaConsentRepository },
        {
          provide: DATA_REQUEST_REPOSITORY,
          useClass: PrismaDataRequestRepository,
        },
        AddressProjection,
        ProfileDataOwner,
        AddressDataOwner,
        ConsentDataOwner,
        {
          provide: USER_DATA_OWNERS,
          useFactory: (...owners: UserDataPort[]) => Object.freeze(owners),
          // Support first: its retention block stops erasure before others run.
          inject: [
            SupportDataOwner,
            ProfileDataOwner,
            AddressDataOwner,
            ConsentDataOwner,
            ServiceBookmarkDataOwner,
          ],
        },
        DataRequestEvents,
        DataRequestProcessor,
      ],
      exports: [DataRequestProcessor],
    };
  }
}
