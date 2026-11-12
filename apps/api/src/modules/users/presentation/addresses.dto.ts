import { createZodDto } from 'nestjs-zod';
import {
  AddressSchema,
  AddressPageSchema,
  AddressListQuerySchema,
  CreateAddressSchema,
  UpdateAddressSchema,
  DeleteAddressSchema,
  AddressDeletedSchema,
} from '@apnatown/shared/users';

export class AddressDto extends createZodDto(AddressSchema) {}
export class AddressPageDto extends createZodDto(AddressPageSchema) {}
export class AddressQueryDto extends createZodDto(AddressListQuerySchema) {}
export class CreateAddressDto extends createZodDto(CreateAddressSchema) {}
export class UpdateAddressDto extends createZodDto(UpdateAddressSchema) {}
export class DeleteAddressDto extends createZodDto(DeleteAddressSchema) {}
export class AddressDeletedDto extends createZodDto(AddressDeletedSchema) {}
