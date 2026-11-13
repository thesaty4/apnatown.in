import { createZodDto } from 'nestjs-zod';
import {
  CreateDataRequestSchema,
  DataExportSchema,
  DataRequestAcceptedSchema,
  DataRequestCompletionSchema,
  DataRequestSchema,
} from '@apnatown/shared/users';

export class CreateDataRequestDto extends createZodDto(
  CreateDataRequestSchema,
) {}
export class DataRequestAcceptedDto extends createZodDto(
  DataRequestAcceptedSchema,
) {}
export class DataRequestDto extends createZodDto(DataRequestSchema) {}
export class DataRequestCompletionDto extends createZodDto(
  DataRequestCompletionSchema,
) {}
export class DataExportDto extends createZodDto(DataExportSchema) {}
